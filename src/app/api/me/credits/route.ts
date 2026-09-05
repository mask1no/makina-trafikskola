import { z } from "zod";

import { auth } from "@/auth";
import {
  apiError,
  authorizationError,
  invalidInput,
} from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { getAvailableCreditBalance } from "@/lib/credits/ledger";
import { db } from "@/lib/db";

const querySchema = z.object({}).strict();

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  let studentId: string;
  try {
    studentId = requireRole(await auth(), ["STUDENT"]).user.id;
  } catch (error) {
    return authorizationError(error);
  }

  const student = await db.user.findFirst({
    where: { id: studentId, role: "STUDENT", deletedAt: null },
    select: { id: true },
  });
  if (!student) return apiError("STUDENT_NOT_FOUND", 404);

  const now = new Date();
  const [credits, lots] = await Promise.all([
    getAvailableCreditBalance(db, studentId, now),
    db.creditTransaction.findMany({
      where: {
        studentId,
        delta: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        delta: true,
        reason: true,
        expiresAt: true,
        createdAt: true,
        orderItemId: true,
      },
    }),
  ]);

  return Response.json({ balance: credits.balance, lots });
}
