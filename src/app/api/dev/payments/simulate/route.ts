import { randomUUID } from "node:crypto";

import type Stripe from "stripe";
import { z } from "zod";

import { auth } from "@/auth";
import { apiError, authorizationError, invalidInput } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { processVerifiedStripeEvent } from "@/app/api/webhooks/stripe/route";

export const runtime = "nodejs";

if (
  process.env.NODE_ENV === "production" &&
  process.env.PAYMENTS_SIMULATOR === "1"
) {
  throw new Error("PAYMENTS_SIMULATOR_MUST_NOT_RUN_IN_PRODUCTION");
}

const inputSchema = z
  .object({
    orderId: z.string().cuid(),
  })
  .strict();

function simulatorEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.PAYMENTS_SIMULATOR === "1"
  );
}

export async function POST(request: Request) {
  if (!simulatorEnabled()) {
    return apiError("NOT_FOUND", 404);
  }

  const parsed = inputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  let studentId: string;
  try {
    studentId = requireRole(await auth(), ["STUDENT"]).user.id;
  } catch (error) {
    return authorizationError(error);
  }

  const order = await db.order.findFirst({
    where: {
      id: parsed.data.orderId,
      studentId,
      status: { in: ["PENDING", "PAID"] },
    },
    include: { payment: true },
  });
  if (!order?.payment) return apiError("ORDER_NOT_FOUND", 404);

  const now = new Date();
  const paymentIntentId =
    order.payment.stripePaymentIntentId ??
    `pi_sim_${randomUUID().replaceAll("-", "")}`;
  const event = {
    id: `evt_sim_${order.id}`,
    object: "event",
    type: "payment_intent.succeeded",
    created: Math.floor(now.getTime() / 1000),
    data: {
      object: {
        id: paymentIntentId,
        object: "payment_intent",
        amount: order.totalOre,
        amount_received: order.totalOre,
        metadata: { orderId: order.id },
        payment_method: { type: "card" },
      },
    },
  } as unknown as Stripe.Event;

  await processVerifiedStripeEvent(event, now);
  return Response.json({ orderId: order.id, status: "SUCCEEDED" });
}
