import { apiError, invalidInput } from "@/lib/api/http";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import {
  AuthorizationError,
  requireRole,
} from "@/lib/auth/guards";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { canDeactivateInstructor } from "@/lib/bookings/cancellation";
import { revalidateTeacherLanguages } from "@/lib/admin/revalidate-public";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const requestSchema = z.union([
  z.object({ id: z.string().cuid(), active: z.boolean() }).strict(),
  z
    .object({
      id: z.string().cuid(),
      phone: z.string().trim().min(1).max(30),
    })
    .strict(),
]);



export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const now = new Date();
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse({
    ...(body && typeof body === "object" ? body : {}),
    id: (await context.params).id,
  });
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

  const teacher = await db.teacherProfile.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      active: true,
      userId: true,
      user: { select: { phone: true } },
    },
  });
  if (!teacher) return apiError("TEACHER_NOT_FOUND", 404);

  if ("phone" in parsed.data) {
    const phone = normalizeSwedishPhone(parsed.data.phone);
    if (!phone) return apiError("INVALID_PHONE", 400);
    try {
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: teacher.userId },
          data: { phone },
        });
        await tx.auditLog.create({
          data: {
            actorId,
            action: "instructor.phone",
            entityType: "User",
            entityId: teacher.userId,
            before: {
              phoneLast4: teacher.user.phone?.slice(-4) ?? null,
            },
            after: { phoneLast4: phone.slice(-4) },
          },
        });
      });
      return Response.json({ id: teacher.id, phoneLast4: phone.slice(-4) });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return apiError("PHONE_IN_USE", 409);
      }
      throw error;
    }
  }

  if (!("active" in parsed.data)) {
    return apiError("INVALID_INPUT", 400);
  }
  const { active } = parsed.data;

  try {
    const updated = await db.$transaction(
      async (tx) => {
        if (!active) {
          const futureBookings = await tx.booking.count({
            where: {
              teacherId: teacher.id,
              status: "CONFIRMED",
              startsAt: { gt: now },
            },
          });
          if (!canDeactivateInstructor(futureBookings)) {
            throw new Error("TEACHER_HAS_FUTURE_BOOKINGS");
          }
        }

        const changed = await tx.teacherProfile.update({
          where: { id: teacher.id },
          data: { active },
          select: { id: true, active: true },
        });
        await tx.auditLog.create({
          data: {
            actorId,
            action: changed.active ? "teacher.activate" : "teacher.deactivate",
            entityType: "TeacherProfile",
            entityId: teacher.id,
            before: { active: teacher.active },
            after: { active: changed.active },
          },
        });
        return changed;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    revalidateTeacherLanguages();
    return Response.json(updated);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "TEACHER_HAS_FUTURE_BOOKINGS"
    ) {
      return apiError("TEACHER_HAS_FUTURE_BOOKINGS", 409);
    }
    throw error;
  }
}
