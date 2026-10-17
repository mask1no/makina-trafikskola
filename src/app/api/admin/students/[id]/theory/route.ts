import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { invalidInput, apiError, errorResponse } from "@/lib/api/http";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getActiveTheoryAccess } from "@/lib/theory/access";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    id: z.string().cuid(),
    action: z.enum(["grant", "revoke"]),
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

  const student = await db.user.findFirst({
    where: { id: parsed.data.id, role: "STUDENT", deletedAt: null },
    select: { id: true },
  });
  if (!student) return errorResponse("STUDENT_NOT_FOUND", 404);

  const now = new Date();
  const result = await db.$transaction(
    async (tx) => {
      const active = await getActiveTheoryAccess(tx, student.id, now);
      if (parsed.data.action === "grant") {
        if (active) return { status: "already_active" as const };
        await tx.theoryAccess.create({
          data: {
            studentId: student.id,
            grantedAt: now,
            expiresAt: null,
          },
        });
      } else if (active) {
        await tx.theoryAccess.updateMany({
          where: {
            studentId: student.id,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          data: { expiresAt: now },
        });
      } else {
        return { status: "already_inactive" as const };
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action:
            parsed.data.action === "grant"
              ? "theory.grant"
              : "theory.revoke",
          entityType: "User",
          entityId: student.id,
          before: Prisma.JsonNull,
          after: { note: parsed.data.note, action: parsed.data.action },
        },
      });
      return {
        status: parsed.data.action === "grant" ? ("active" as const) : ("inactive" as const),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return Response.json(result);
}
