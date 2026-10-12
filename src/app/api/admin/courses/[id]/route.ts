import { z } from "zod";

import { auth } from "@/auth";
import { apiError, invalidInput } from "@/lib/api/http";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const patchSchema = z
  .object({
    recurrenceEnabled: z.boolean(),
    recurrenceDays: z.array(z.number().int().min(1).max(28)).min(1).max(8),
    defaultStartTime: timeSchema,
    durationMinutes: z.number().int().min(30).max(12 * 60),
    defaultCapacity: z.number().int().min(1).max(200),
    defaultVenueName: z.string().trim().min(1).max(120),
    defaultVenueAddress: z.string().trim().min(1).max(200),
  })
  .strict();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return apiError(error.code, error.status);
    }
    throw error;
  }

  const course = await db.course.findUnique({
    where: { id: (await context.params).id },
    select: { id: true, kind: true },
  });
  if (!course) return apiError("COURSE_NOT_FOUND", 404);
  if (course.kind !== "RISK1") return apiError("INVALID_INPUT", 400);

  await db.$transaction(async (tx) => {
    await tx.course.update({
      where: { id: course.id },
      data: parsed.data,
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "course.recurrence",
        entityType: "Course",
        entityId: course.id,
        after: parsed.data,
      },
    });
  });

  return Response.json({ ok: true });
}
