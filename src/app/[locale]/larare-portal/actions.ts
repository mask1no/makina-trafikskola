"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";

import { auth } from "@/auth";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { bookingNotificationContext } from "@/lib/notifications/context";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { enqueueBookingNotifications } from "@/lib/notifications/queue";

const localeSchema = z.enum(["sv", "en", "ti", "ar", "so"]);

const reportSchema = z.object({
  bookingId: z.string().cuid(),
  locale: localeSchema,
  summary: z.string().trim().max(1000).optional(),
  nextFocus: z.string().trim().max(1000).optional(),
});

export async function reportLesson(formData: FormData) {
  const parsed = reportSchema.parse({
    bookingId: formData.get("bookingId"),
    locale: formData.get("locale"),
    summary: formData.get("summary") || undefined,
    nextFocus: formData.get("nextFocus") || undefined,
  });
  const session = requireRole(await auth(), ["TEACHER", "ADMIN"]);
  const booking = await db.booking.findUnique({
    where: { id: parsed.bookingId },
    select: {
      id: true,
      status: true,
      startsAt: true,
      teacherId: true,
      teacher: { select: { userId: true } },
    },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (
    session.user.role !== "ADMIN" &&
    booking.teacher.userId !== session.user.id
  ) {
    throw new Error("FORBIDDEN");
  }
  if (!["CONFIRMED", "COMPLETED"].includes(booking.status)) {
    throw new Error("BOOKING_NOT_ACTIVE");
  }
  if (booking.startsAt > new Date()) {
    redirect(`/${parsed.locale}/larare-portal?error=LESSON_NOT_STARTED`);
  }

  await db.$transaction([
    db.lessonReport.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        teacherId: booking.teacherId,
        summary: parsed.summary,
        nextFocus: parsed.nextFocus,
      },
      update: {
        summary: parsed.summary,
        nextFocus: parsed.nextFocus,
      },
    }),
    db.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED", holdExpiresAt: null },
    }),
  ]);
  revalidatePath(`/${parsed.locale}/larare-portal`);
}

const blockSchema = z
  .object({
    locale: localeSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    reason: z.string().trim().max(200).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.startTime) === Boolean(value.endTime) &&
      (!value.startTime || value.startTime < value.endTime!),
    { path: ["endTime"], message: "INVALID_TIME_RANGE" },
  );

export async function blockAvailability(formData: FormData) {
  const parsed = blockSchema.parse({
    locale: formData.get("locale"),
    date: formData.get("date"),
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
    reason: formData.get("reason") || undefined,
  });
  const session = requireRole(await auth(), ["TEACHER"]);
  const teacher = await db.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) throw new Error("TEACHER_NOT_FOUND");

  const now = new Date();
  const blockStart = fromZonedTime(
    `${parsed.date}T${parsed.startTime ?? "00:00"}:00`,
    "Europe/Stockholm",
  );
  const blockEnd = fromZonedTime(
    `${parsed.date}T${parsed.endTime ?? "23:59"}:59`,
    "Europe/Stockholm",
  );
  const affected = await db.booking.findMany({
    where: {
      teacherId: teacher.id,
      status: "CONFIRMED",
      startsAt: { lt: blockEnd },
      endsAt: { gt: blockStart },
    },
    select: {
      id: true,
      studentId: true,
      startsAt: true,
      creditCharged: true,
      student: { select: { localePref: true } },
    },
  });
  const notificationIds = await db.$transaction(async (tx) => {
    const exception = await tx.availabilityException.create({
      data: {
        teacherId: teacher.id,
        date: new Date(`${parsed.date}T00:00:00.000Z`),
        type: parsed.startTime ? "PARTIAL_BLOCK" : "FULL_DAY_OFF",
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        reason: parsed.reason,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "availability.block",
        entityType: "AvailabilityException",
        entityId: exception.id,
        after: {
          teacherId: teacher.id,
          date: parsed.date,
          type: parsed.startTime ? "PARTIAL_BLOCK" : "FULL_DAY_OFF",
          startTime: parsed.startTime ?? null,
          endTime: parsed.endTime ?? null,
        },
      },
    });
    const ids: string[] = [];
    for (const booking of affected) {
      const updated = await tx.booking.updateMany({
        where: { id: booking.id, status: "CONFIRMED" },
        data: {
          status: "CANCELLED_BY_TEACHER",
          cancelledAt: now,
          cancelledById: session.user.id,
          cancelReason: parsed.reason,
          holdExpiresAt: null,
        },
      });
      if (!updated.count) continue;
      if (booking.creditCharged) {
        await tx.creditTransaction.create({
          data: {
            studentId: booking.studentId,
            bookingId: booking.id,
            delta: 1,
            reason: "TEACHER_CANCELLATION_REFUND",
          },
        });
      }
      const context = await bookingNotificationContext(tx, booking.id);
      ids.push(
        ...(await enqueueBookingNotifications(tx, {
          userId: booking.studentId,
          locale: booking.student.localePref,
          template: "booking_cancelled_by_teacher",
          bookingId: booking.id,
          startsAt: booking.startsAt,
          creditRefunded: booking.creditCharged,
          teacherFirstName: context.teacherFirstName,
          placeLabel: context.placeLabel,
          now,
        })),
      );
    }
    return ids;
  });
  await dispatchNotifications(notificationIds, now);
  revalidatePath(`/${parsed.locale}/larare-portal`);
}

async function ownTeacher() {
  const session = requireRole(await auth(), ["TEACHER"]);
  const teacher = await db.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) throw new Error("TEACHER_NOT_FOUND");
  return teacher;
}

export async function createCalendarToken() {
  const teacher = await ownTeacher();
  const token = randomBytes(32).toString("base64url");
  await db.teacherProfile.updateMany({
    where: { id: teacher.id, calendarToken: null },
    data: { calendarToken: token },
  });
  for (const locale of ["sv", "en", "ti", "ar", "so"]) {
    revalidatePath(`/${locale}/larare-portal`);
  }
}

export async function rotateCalendarToken() {
  const teacher = await ownTeacher();
  const token = randomBytes(32).toString("base64url");
  await db.teacherProfile.update({
    where: { id: teacher.id },
    data: { calendarToken: token },
  });
  for (const locale of ["sv", "en", "ti", "ar", "so"]) {
    revalidatePath(`/${locale}/larare-portal`);
  }
}
