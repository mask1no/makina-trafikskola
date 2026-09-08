import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ studentId: "" }));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: authState.studentId, role: "STUDENT" },
  })),
}));

vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotifications: vi.fn(async () => undefined),
}));

import { POST } from "@/app/api/dev/payments/simulate/route";
import { db } from "@/lib/db";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const fixture = `payment-simulator-${randomUUID()}`;
const previousFlag = process.env.PAYMENTS_SIMULATOR;
let productId = "";
let orderId = "";

describe.skipIf(!runIntegration)("development payment simulator", () => {
  beforeAll(async () => {
    delete process.env.PAYMENTS_SIMULATOR;
    const student = await db.user.create({
      data: {
        email: `${fixture}@example.invalid`,
        firstName: "Payment",
        lastName: "Simulator",
        role: "STUDENT",
      },
    });
    authState.studentId = student.id;

    const product = await db.product.create({
      data: {
        slug: fixture,
        kind: "PACKAGE",
        active: false,
        priceOre: 200000,
        lessonCredits: 10,
        creditValidDays: 730,
        translations: {
          create: {
            locale: "sv",
            name: "Payment simulator fixture",
            features: [],
          },
        },
      },
    });
    productId = product.id;

    const order = await db.order.create({
      data: {
        studentId: student.id,
        totalOre: product.priceOre,
        vatOre: 40000,
        payment: { create: { amountOre: product.priceOre } },
        items: {
          create: {
            productId,
            quantity: 1,
            unitPriceOre: product.priceOre,
            vatRatePct: 25,
            productNameSnapshot: "Payment simulator fixture",
          },
        },
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    if (previousFlag === undefined) {
      delete process.env.PAYMENTS_SIMULATOR;
    } else {
      process.env.PAYMENTS_SIMULATOR = previousFlag;
    }
    await db.notification.deleteMany({
      where: { userId: authState.studentId },
    });
    await db.creditTransaction.deleteMany({
      where: { studentId: authState.studentId },
    });
    await db.stripeEvent.deleteMany({ where: { id: `evt_sim_${orderId}` } });
    await db.payment.deleteMany({ where: { orderId } });
    if (orderId) await db.order.delete({ where: { id: orderId } });
    if (productId) {
      await db.productTranslation.deleteMany({ where: { productId } });
      await db.product.delete({ where: { id: productId } });
    }
    if (authState.studentId) {
      await db.user.delete({ where: { id: authState.studentId } });
    }
  });

  it("returns 404 when the explicit flag is absent", async () => {
    const response = await POST(
      new Request("http://localhost/api/dev/payments/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("fulfills through the shared webhook handler exactly once", async () => {
    process.env.PAYMENTS_SIMULATOR = "1";
    const postPayment = () =>
      POST(
        new Request("http://localhost/api/dev/payments/simulate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId }),
        }),
      );

    const first = await postPayment();
    const replay = await postPayment();
    expect([first.status, replay.status]).toEqual([200, 200]);

    const [order, credits, events] = await Promise.all([
      db.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { payment: true },
      }),
      db.creditTransaction.findMany({
        where: { studentId: authState.studentId, reason: "PURCHASE" },
      }),
      db.stripeEvent.count({ where: { id: `evt_sim_${orderId}` } }),
    ]);
    expect(order.status).toBe("PAID");
    expect(order.payment?.status).toBe("SUCCEEDED");
    expect(credits).toHaveLength(1);
    expect(credits[0]?.delta).toBe(10);
    expect(events).toBe(1);
  });
});
