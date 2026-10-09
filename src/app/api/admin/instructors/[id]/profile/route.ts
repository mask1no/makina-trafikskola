import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const offered = ["sv", "en", "ti", "ku"] as const;

const profileSchema = z
  .object({
    phone: z.string().trim().min(1).max(30),
    languages: z.array(z.enum(offered)).min(1),
    transmissions: z.array(z.enum(["MANUAL", "AUTOMATIC"])).max(2),
    locationIds: z.array(z.string().cuid()).min(1).max(20),
    yearsExperience: z.number().int().min(0).max(70),
    googleCalendarEmail: z.string().trim().email().or(z.literal("")),
    payRateKr: z.number().int().min(0).max(100_000).nullable(),
    hours: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          startTime: timeSchema,
          endTime: timeSchema,
          locationId: z.string().cuid(),
        }),
      )
      .max(50),
    daysOff: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(60),
  })
  .strict();

function hoursOverlap(
  hours: { dayOfWeek: number; startTime: string; endTime: string }[],
) {
  const byDay = new Map<number, typeof hours>();
  for (const hour of hours) {
    if (hour.startTime >= hour.endTime) return true;
    const list = byDay.get(hour.dayOfWeek) ?? [];
    list.push(hour);
    byDay.set(hour.dayOfWeek, list);
  }
  for (const list of byDay.values()) {
    const sorted = [...list].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (previous && current && current.startTime < previous.endTime) return true;
    }
  }
  return false;
}

function apiError(code: string, status: number) {
  return Response.json({ error: { code, message: code } }, { status });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "INVALID_INPUT",
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }
  if (hoursOverlap(parsed.data.hours)) return apiError("HOURS_OVERLAP", 400);

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) return apiError(error.code, error.status);
    throw error;
  }

  const teacher = await db.teacherProfile.findUnique({
    where: { id: (await context.params).id },
    select: { id: true, userId: true },
  });
  if (!teacher) return apiError("TEACHER_NOT_FOUND", 404);
  const phone = normalizeSwedishPhone(parsed.data.phone);
  if (!phone) return apiError("INVALID_PHONE", 400);
  const locationIds = [...new Set(parsed.data.locationIds)];
  if (parsed.data.hours.some((hour) => !locationIds.includes(hour.locationId))) {
    return apiError("LOCATION_NOT_ASSIGNED", 400);
  }
  const locations = await db.location.findMany({
    where: { id: { in: locationIds } },
    select: { id: true },
  });
  if (locations.length !== locationIds.length) return apiError("LOCATION_NOT_FOUND", 404);

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: teacher.userId }, data: { phone } });
      await tx.teacherProfile.update({
        where: { id: teacher.id },
        data: {
          languages: parsed.data.languages,
          transmissions: parsed.data.transmissions,
          yearsExperience: parsed.data.yearsExperience,
          googleCalendarEmail: parsed.data.googleCalendarEmail || null,
          payRateOre: parsed.data.payRateKr == null ? null : parsed.data.payRateKr * 100,
        },
      });
      await tx.teacherLocation.deleteMany({ where: { teacherId: teacher.id } });
      await tx.teacherLocation.createMany({
        data: locationIds.map((locationId) => ({ teacherId: teacher.id, locationId })),
      });
      await tx.teacherAvailability.deleteMany({ where: { teacherId: teacher.id } });
      if (parsed.data.hours.length) {
        await tx.teacherAvailability.createMany({
          data: parsed.data.hours.map((hour) => ({
            teacherId: teacher.id,
            dayOfWeek: hour.dayOfWeek,
            startTime: hour.startTime,
            endTime: hour.endTime,
            locationId: hour.locationId,
          })),
        });
      }
      await tx.availabilityException.deleteMany({
        where: { teacherId: teacher.id, type: "FULL_DAY_OFF" },
      });
      if (parsed.data.daysOff.length) {
        await tx.availabilityException.createMany({
          data: parsed.data.daysOff.map((date) => ({
            teacherId: teacher.id,
            date: new Date(`${date}T00:00:00.000Z`),
            type: "FULL_DAY_OFF" as const,
          })),
        });
      }
      await tx.auditLog.create({
        data: {
          actorId,
          action: "teacher.profile",
          entityType: "TeacherProfile",
          entityId: teacher.id,
          after: {
            languages: parsed.data.languages,
            transmissions: parsed.data.transmissions,
            locationIds,
            yearsExperience: parsed.data.yearsExperience,
            googleCalendarEmail: parsed.data.googleCalendarEmail || null,
            payRateOre: parsed.data.payRateKr == null ? null : parsed.data.payRateKr * 100,
            hours: parsed.data.hours,
            daysOff: parsed.data.daysOff,
            phoneLast4: phone.slice(-4),
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("PHONE_IN_USE", 409);
    }
    throw error;
  }
  return Response.json({ id: teacher.id });
}
