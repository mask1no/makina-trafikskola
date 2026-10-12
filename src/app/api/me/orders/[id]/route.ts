import { z } from "zod";

import { auth } from "@/auth";
import { authorizationError, errorResponse, invalidInput } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().cuid() }).strict();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  let session;
  try {
    session = requireRole(await auth(), ["STUDENT"]);
  } catch (error) {
    return authorizationError(error);
  }

  const order = await db.order.findFirst({
    where: { id: parsed.data.id, studentId: session.user.id },
    select: {
      id: true,
      status: true,
      payment: { select: { status: true } },
    },
  });
  if (!order) {
    return errorResponse("ORDER_NOT_FOUND", 404);
  }

  return Response.json({
    id: order.id,
    status: order.status,
    paymentStatus: order.payment?.status ?? null,
  });
}
