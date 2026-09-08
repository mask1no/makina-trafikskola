import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotifications: vi.fn(async () => undefined),
}));

import { POST } from "@/app/api/webhooks/stripe/route";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const fixture = `webhook-replay-${randomUUID()}`;
const webhookSecret = "whsec_webhook_replay_integration";
const eventId = `evt_${randomUUID().replaceAll("-", "")}`;
let studentId = "";
let productId = "";
let orderId = "";

describe.skipIf(!runIntegration)("Stripe webhook replay", () => {
  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_webhook_replay_integration";
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;

    const student = await db.user.create({
      data: {
        email: `${fixture}@example.invalid`,
        firstName: "Webhook",
        lastName: "Replay",
        role: "STUDENT",
      },
    });
    studentId = student.id;

    const product = await db.product.create({
      data: {
        slug: fixture,
        kind: "PACKAGE",
        active: false,
        priceOre: 100000,
        vatRatePct: 25,
        lessonCredits: 5,
        creditValidDays: 730,
        translations: {
          create: {
            locale: "sv",
            name: "Webhook replay fixture",
            features: [],
          },
        },
      },
    });
    productId = product.id;

    const order = await db.order.create({
      data: {
        studentId,
        totalOre: product.priceOre,
        vatOre: 20000,
        payment: {
          create: {
            amountOre: product.priceOre,
            stripeCheckoutSessionId: `cs_${fixture}`,
          },
        },
        items: {
          create: {
            productId,
            quantity: 1,
            unitPriceOre: product.priceOre,
            vatRatePct: product.vatRatePct,
            productNameSnapshot: "Webhook replay fixture",
          },
        },
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    await db.notification.deleteMany({ where: { userId: studentId } });
    await db.creditTransaction.deleteMany({ where: { studentId } });
    await db.stripeEvent.deleteMany({ where: { id: eventId } });
    await db.payment.deleteMany({ where: { orderId } });
    if (orderId) await db.order.delete({ where: { id: orderId } });
    if (productId) {
      await db.productTranslation.deleteMany({ where: { productId } });
      await db.product.delete({ where: { id: productId } });
    }
    if (studentId) await db.user.delete({ where: { id: studentId } });
  });

  it("fulfills one order and one credit lot when the event is posted twice", async () => {
    const payload = JSON.stringify({
      id: eventId,
      object: "event",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `cs_${fixture}`,
          object: "checkout.session",
          payment_status: "paid",
          payment_intent: `pi_${fixture}`,
          amount_total: 100000,
          metadata: { orderId },
        },
      },
    });
    const signature = getStripe().webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });
    const postEvent = () =>
      POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "stripe-signature": signature,
          },
          body: payload,
        }),
      );

    const first = await postEvent();
    const replay = await postEvent();
    expect([first.status, replay.status]).toEqual([200, 200]);

    const [order, events, credits] = await Promise.all([
      db.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { payment: true },
      }),
      db.stripeEvent.count({ where: { id: eventId } }),
      db.creditTransaction.findMany({
        where: { studentId, reason: "PURCHASE" },
      }),
    ]);
    expect(order.status).toBe("PAID");
    expect(order.payment?.status).toBe("SUCCEEDED");
    expect(events).toBe(1);
    expect(credits).toHaveLength(1);
    expect(credits[0]?.delta).toBe(5);
  });
});
