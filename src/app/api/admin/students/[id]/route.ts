import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { calculateAvailableCreditBalance } from "@/lib/credits/ledger";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().cuid() }).strict();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse((await context.params));
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

  try {
    requireRole(await auth(), ["ADMIN"]);
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
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      localePref: true,
      credits: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          delta: true,
          reason: true,
          orderItemId: true,
          expiresAt: true,
          note: true,
          createdAt: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          totalOre: true,
          vatOre: true,
          createdAt: true,
          payment: {
            select: {
              provider: true,
              method: true,
              amountOre: true,
              refundedOre: true,
              status: true,
            },
          },
        },
      },
    },
  });
  if (!student) {
    return Response.json(
      { error: { code: "STUDENT_NOT_FOUND", message: "STUDENT_NOT_FOUND" } },
      { status: 404 },
    );
  }

  const now = new Date();
  const balance = calculateAvailableCreditBalance(student.credits, now).balance;

  return Response.json({ ...student, balance });
}
