"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";

import { auth } from "@/auth";
import { requireRole } from "@/lib/auth/guards";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { getCreditBalance } from "@/lib/credits/ledger";
import { db } from "@/lib/db";
import { bookingNotificationContext } from "@/lib/notifications/context";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { notifyOwnerOfBooking } from "@/lib/notifications/owner";
import { enqueueBookingNotifications } from "@/lib/notifications/queue";
import { locales } from "@/i18n/routing";

const localeSchema = z.enum(locales);

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
      studentId: true,
      creditCharged: true,
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

  const firstCompletion = booking.status !== "COMPLETED";
  const now = new Date();
  const notificationIds = await db.$transaction(async (tx) => {
    await tx.lessonReport.upsert({
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
    });
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED", holdExpiresAt: null },
    });
    if (!firstCompletion) return [];

    const creditsRemaining = booking.creditCharged
      ? await getCreditBalance(tx, booking.studentId, now)
      : undefined;
    const student = await tx.user.findUnique({
      where: { id: booking.studentId },
      select: { localePref: true },
    });
    const admins = await tx.user.findMany({
      where: { role: "ADMIN", deletedAt: null },
      select: { id: true, localePref: true },
    });
    const ids = await enqueueBookingNotifications(tx, {
      userId: booking.studentId,
      locale: student?.localePref ?? parsed.locale,
      template: "lesson_completed",
      bookingId: booking.id,
      startsAt: booking.startsAt,
      creditsRemaining,
      channels: ["INAPP"],
      now,
    });
    for (const admin of admins) {
      if (admin.id === booking.studentId) continue;
      ids.push(
        ...(await enqueueBookingNotifications(tx, {
          userId: admin.id,
          locale: admin.localePref || "sv",
          template: "lesson_completed",
          bookingId: booking.id,
          startsAt: booking.startsAt,
          creditsRemaining,
          channels: ["INAPP"],
          now,
        })),
      );
    }
    return ids;
  });
  if (notificationIds.length) {
    await dispatchNotifications(notificationIds, now);
  }
  revalidatePath(`/${parsed.locale}/larare-portal`);
  revalidatePath(`/${parsed.locale}/mina-sidor`);
  revalidatePath(`/${parsed.locale}/admin`);
}

const phoneSchema = z.object({
  locale: localeSchema,
  phone: z.string().trim().min(1).max(30),
});

export async function saveTeacherPhone(formData: FormData) {
  const parsed = phoneSchema.parse({
    locale: formData.get("locale"),
    phone: formData.get("phone"),
  });
  const session = requireRole(await auth(), ["TEACHER", "ADMIN"]);
  const phone = normalizeSwedishPhone(parsed.phone);
  if (!phone) {
    redirect(`/${parsed.locale}/larare-portal?view=office&error=INVALID_PHONE`);
  }
  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { phone },
    });
  } catch {
    redirect(`/${parsed.locale}/larare-portal?view=office&error=PHONE_TAKEN`);
  }
  revalidatePath(`/${parsed.locale}/larare-portal`);
  redirect(`/${parsed.locale}/larare-portal?view=office&phone=saved`);
}

const blockSchema = z
  .object({
    locale: localeSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    reason: z.string().trim().max(200).optional(),
    confirm: z.literal("yes"),
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
    confirm: formData.get("confirm"),
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
  const ownerCancelledIds: string[] = [];
  const notificationIds = await db.$transaction(async (tx) => {
    ownerCancelledIds.length = 0;
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
        ownerCancelledIds.push(booking.id);
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
  for (const bookingId of ownerCancelledIds) {
    await notifyOwnerOfBooking(bookingId, "cancelled");
  }
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
  for (const locale of locales) {
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
  for (const locale of locales) {
    revalidatePath(`/${locale}/larare-portal`);
  }
}
