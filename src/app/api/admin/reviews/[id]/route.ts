import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().cuid() }).strict();
const bodySchema = z
  .object({ decision: z.enum(["publish", "reject"]) })
  .strict();

function errorResponse(
  code: string,
  status: number,
  fields?: Record<string, string[] | undefined>,
) {
  return Response.json(
    { error: { code, message: code, ...(fields ? { fields } : {}) } },
    { status },
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return errorResponse("INVALID_INPUT", 400, parsedParams.error.flatten().fieldErrors);
  }
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", 400, parsedBody.error.flatten().fieldErrors);
  }

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return errorResponse(error.code, error.status);
    }
    throw error;
  }

  const review = await db.review.findUnique({
    where: { id: parsedParams.data.id },
  });
  if (!review) return errorResponse("REVIEW_NOT_FOUND", 404);

  const decision = parsedBody.data.decision;
  await db.$transaction(async (tx) => {
    if (decision === "publish") {
      await tx.review.update({
        where: { id: review.id },
        data: { published: true },
      });
    } else {
      await tx.review.delete({ where: { id: review.id } });
    }
    const stats = await tx.review.aggregate({
      where: { teacherId: review.teacherId, published: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await tx.teacherProfile.update({
      where: { id: review.teacherId },
      data: {
        ratingAvg: stats._avg.rating ?? 0,
        ratingCount: stats._count.rating,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: decision === "publish" ? "review.publish" : "review.reject",
        entityType: "Review",
        entityId: review.id,
        before: {
          published: review.published,
          rating: review.rating,
          comment: review.comment,
        },
        after:
          decision === "publish"
            ? { published: true }
            : Prisma.JsonNull,
      },
    });
  });

  return new Response(null, { status: 204 });
}
