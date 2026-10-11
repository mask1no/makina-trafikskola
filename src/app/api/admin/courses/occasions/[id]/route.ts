import { z } from "zod";

import { auth } from "@/auth";
import { apiError, authorizationError, invalidInput } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().cuid() }).strict();
const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("edit"),
    courseId: z.string().cuid(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    venueName: z.string().trim().min(1).max(120),
    venueAddress: z.string().trim().min(1).max(240),
    capacity: z.number().int().min(1).max(500),
    language: z.enum(["sv", "en", "ti", "ku"]),
  }).strict(),
  z.object({
    action: z.literal("cancel"),
    confirm: z.literal(true),
  }).strict(),
]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await context.params);
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedParams.success || !parsedBody.success) {
    return invalidInput({
      ...(parsedParams.success ? {} : parsedParams.error.flatten().fieldErrors),
      ...(parsedBody.success ? {} : parsedBody.error.flatten().fieldErrors),
    });
  }

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    return authorizationError(error);
  }

  const occasion = await db.courseOccasion.findFirst({
    where: {
      id: parsedParams.data.id,
      course: { kind: { in: ["RISK1", "RISK2"] } },
    },
    include: {
      course: { select: { id: true, kind: true, productId: true } },
      _count: {
        select: {
          bookings: {
            where: { status: { in: ["CONFIRMED", "COMPLETED", "PENDING_PAYMENT"] } },
          },
        },
      },
    },
  });
  if (!occasion) return apiError("COURSE_OCCASION_NOT_FOUND", 404);

  if (parsedBody.data.action === "cancel") {
    if (occasion.cancelled) return Response.json({ id: occasion.id });
    if (occasion._count.bookings > 0) {
      return apiError("COURSE_OCCASION_HAS_BOOKINGS", 409);
    }
    await db.$transaction([
      db.courseOccasion.update({
        where: { id: occasion.id },
        data: { cancelled: true },
      }),
      db.auditLog.create({
        data: {
          actorId,
          action: "courseOccasion.cancel",
          entityType: "CourseOccasion",
          entityId: occasion.id,
          before: { cancelled: false },
          after: { cancelled: true },
        },
      }),
    ]);
    return Response.json({ id: occasion.id });
  }

  const data = parsedBody.data;
  const course = await db.course.findFirst({
    where: {
      id: data.courseId,
      kind: { in: ["RISK1", "RISK2"] },
      product: { kind: "COURSE_SEAT" },
    },
    select: { id: true, kind: true, productId: true },
  });
  if (!course) return apiError("COURSE_NOT_FOUND", 404);
  if (data.capacity < occasion._count.bookings) {
    return apiError("COURSE_CAPACITY_BELOW_BOOKINGS", 409);
  }
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);
  if (endsAt <= startsAt) {
    return invalidInput({ endsAt: ["COURSE_END_MUST_BE_AFTER_START"] });
  }

  await db.$transaction(async (tx) => {
    await tx.courseOccasion.update({
      where: { id: occasion.id },
      data: {
        courseId: course.id,
        startsAt,
        endsAt,
        venueName: data.venueName,
        venueAddress: data.venueAddress,
        capacity: data.capacity,
        language: data.language,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "courseOccasion.update",
        entityType: "CourseOccasion",
        entityId: occasion.id,
        before: {
          courseId: occasion.courseId,
          productId: occasion.course.productId,
          startsAt: occasion.startsAt,
          endsAt: occasion.endsAt,
          venueName: occasion.venueName,
          venueAddress: occasion.venueAddress,
          capacity: occasion.capacity,
          language: occasion.language,
        },
        after: {
          ...data,
          productId: course.productId,
          kind: course.kind,
        },
      },
    });
  });

  return Response.json({ id: occasion.id });
}
