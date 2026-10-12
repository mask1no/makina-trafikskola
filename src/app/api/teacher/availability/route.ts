import { z } from "zod";

import { auth } from "@/auth";
import { apiError, invalidInput } from "@/lib/api/http";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { hoursOverlap, weeklyHoursSchema } from "@/lib/teachers/hours";

export const runtime = "nodejs";

const requestSchema = z.object({ hours: weeklyHoursSchema }).strict();

/** Replaces the signed-in teacher's own weekly hours. Never accepts a teacher id. */
export async function PUT(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }
  if (hoursOverlap(parsed.data.hours)) return apiError("HOURS_OVERLAP", 400);

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["TEACHER", "ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) return apiError(error.code, error.status);
    throw error;
  }

  // Ownership: the profile is always resolved from the session user.
  const teacher = await db.teacherProfile.findUnique({
    where: { userId: actorId },
    select: { id: true, locations: { select: { locationId: true } } },
  });
  if (!teacher) return apiError("TEACHER_NOT_FOUND", 404);

  const assigned = new Set(teacher.locations.map((item) => item.locationId));
  if (parsed.data.hours.some((hour) => !assigned.has(hour.locationId))) {
    return apiError("LOCATION_NOT_ASSIGNED", 400);
  }

  await db.$transaction(async (tx) => {
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
    await tx.auditLog.create({
      data: {
        actorId,
        action: "teacher.availability",
        entityType: "TeacherProfile",
        entityId: teacher.id,
        after: { hours: parsed.data.hours },
      },
    });
  });

  return Response.json({ id: teacher.id });
}
