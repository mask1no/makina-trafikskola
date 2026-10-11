import { z } from "zod";

import { auth } from "@/auth";
import { apiError, authorizationError, invalidInput } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const bodySchema = z.object({
  courseId: z.string().cuid(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  venueName: z.string().trim().min(1).max(120),
  venueAddress: z.string().trim().min(1).max(240),
  capacity: z.number().int().min(1).max(500),
  language: z.enum(["sv", "en", "ti", "ku"]).default("sv"),
}).strict();

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    return authorizationError(error);
  }

  const course = await db.course.findFirst({
    where: {
      id: parsed.data.courseId,
      kind: { in: ["RISK1", "RISK2"] },
      product: { kind: "COURSE_SEAT" },
    },
    select: { id: true, kind: true, productId: true },
  });
  if (!course) return apiError("COURSE_NOT_FOUND", 404);

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (endsAt <= startsAt) {
    return invalidInput({ endsAt: ["COURSE_END_MUST_BE_AFTER_START"] });
  }

  const occasion = await db.$transaction(async (tx) => {
    const created = await tx.courseOccasion.create({
      data: {
        courseId: course.id,
        startsAt,
        endsAt,
        venueName: parsed.data.venueName,
        venueAddress: parsed.data.venueAddress,
        capacity: parsed.data.capacity,
        language: parsed.data.language,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "courseOccasion.create",
        entityType: "CourseOccasion",
        entityId: created.id,
        after: {
          ...parsed.data,
          kind: course.kind,
          productId: course.productId,
        },
      },
    });
    return created;
  });

  return Response.json({ id: occasion.id }, { status: 201 });
}
