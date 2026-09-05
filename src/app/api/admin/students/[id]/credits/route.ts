import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    id: z.string().cuid(),
    delta: z.number().int().min(-100).max(100).refine((value) => value !== 0),
    note: z.string().trim().min(3).max(500),
  })
  .strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse({
    ...(body && typeof body === "object" ? body : {}),
    id: (await context.params).id,
  });
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

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json(
        { error: { code: error.code, message: error.code } },
        { status: error.status },
      );
    }
    throw error;
  }

  const student = await db.user.findFirst({
    where: { id: parsed.data.id, role: "STUDENT", deletedAt: null },
    select: { id: true },
  });
  if (!student) {
    return Response.json(
      { error: { code: "STUDENT_NOT_FOUND", message: "STUDENT_NOT_FOUND" } },
      { status: 404 },
    );
  }

  const result = await db.$transaction(
    async (tx) => {
      const credit = await tx.creditTransaction.create({
        data: {
          studentId: student.id,
          delta: parsed.data.delta,
          reason: "ADMIN_ADJUSTMENT",
          note: parsed.data.note,
          createdById: actorId,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: "credit.adjust",
          entityType: "User",
          entityId: student.id,
          before: Prisma.JsonNull,
          after: {
            creditTransactionId: credit.id,
            delta: credit.delta,
            note: credit.note,
          },
        },
      });
      return credit;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return Response.json(result, { status: 201 });
}
