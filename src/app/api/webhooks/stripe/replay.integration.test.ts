import { randomUUID } from "node:crypto";

import { addDays } from "date-fns";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ studentId: "" }));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: authState.studentId, role: "STUDENT" as const },
  })),
}));

vi.mock("@/lib/auth/otp-store", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/auth/otp-store")>();
  return { ...original, allowRateLimitedAction: vi.fn(async () => true) };
});

vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotifications: vi.fn(async () => undefined),
}));

import { POST as createBooking } from "@/app/api/bookings/route";
import { POST } from "@/app/api/webhooks/stripe/route";
import { loadAvailability } from "@/lib/bookings/availability";
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
        creditValidDays: 365,
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

  it(
    "keeps the balance non-negative when a refund races a booking",
    async () => {
      const raceStudentIds: string[] = [];
      const orderIds: string[] = [];
      const eventIds: string[] = [];
      let raceTeacherUserId = "";
      let raceTeacherId = "";
      let raceLocationId = "";
      let raceProductId = "";

      try {
        const location = await db.location.create({
          data: {
            slug: `${fixture}-race`,
            name: "Refund race fixture",
            address: "Testvägen 2",
            city: "Stockholm",
            postalCode: "111 22",
            lat: 59.33,
            lng: 18.07,
          },
        });
        raceLocationId = location.id;
        const teacher = await db.user.create({
          data: {
            email: `${fixture}-race-teacher@example.invalid`,
            firstName: "Refund",
            lastName: "Teacher",
            role: "TEACHER",
            teacherProfile: {
              create: {
                slug: `${fixture}-race`,
                languages: ["sv"],
                transmissions: ["MANUAL"],
                locations: { create: { locationId: raceLocationId } },
                availability: {
                  create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
                    dayOfWeek,
                    startTime: "08:00",
                    endTime: "18:00",
                    locationId: raceLocationId,
                  })),
                },
              },
            },
          },
          include: { teacherProfile: true },
        });
        raceTeacherUserId = teacher.id;
        raceTeacherId = teacher.teacherProfile!.id;
        const usedStarts = new Set<number>();

        const product = await db.product.create({
          data: {
            slug: `${fixture}-race`,
            kind: "SINGLE_LESSON",
            active: false,
            priceOre: 100000,
            vatRatePct: 25,
            lessonCredits: 1,
            creditValidDays: 365,
            translations: {
              create: {
                locale: "sv",
                name: "Refund race credit",
                features: [],
              },
            },
          },
        });
        raceProductId = product.id;

        for (let index = 0; index < 5; index += 1) {
          const student = await db.user.create({
            data: {
              email: `${fixture}-race-${index}@example.invalid`,
              firstName: "Refund",
              lastName: `Student ${index}`,
              role: "STUDENT",
            },
          });
          raceStudentIds.push(student.id);
          const paymentIntentId = `pi_${fixture}_race_${index}`.replaceAll(
            "-",
            "",
          );
          const order = await db.order.create({
            data: {
              studentId: student.id,
              status: "PAID",
              totalOre: 100000,
              vatOre: 20000,
              paidAt: new Date(),
              payment: {
                create: {
                  amountOre: 100000,
                  status: "SUCCEEDED",
                  stripePaymentIntentId: paymentIntentId,
                },
              },
              items: {
                create: {
                  productId: raceProductId,
                  quantity: 1,
                  unitPriceOre: 100000,
                  vatRatePct: 25,
                  productNameSnapshot: "Refund race credit",
                },
              },
            },
            include: { items: true },
          });
          orderIds.push(order.id);
          await db.creditTransaction.create({
            data: {
              studentId: student.id,
              delta: 1,
              reason: "PURCHASE",
              orderItemId: order.items[0]?.id,
              expiresAt: addDays(new Date(), 365),
            },
          });

          const eventId = `evt_${randomUUID().replaceAll("-", "")}`;
          eventIds.push(eventId);
          const payload = JSON.stringify({
            id: eventId,
            object: "event",
            type: "charge.refunded",
            created: Math.floor(Date.now() / 1000),
            data: {
              object: {
                id: `ch_${eventId}`,
                object: "charge",
                payment_intent: paymentIntentId,
                amount: 100000,
                amount_refunded: 100000,
              },
            },
          });
          const signature = getStripe().webhooks.generateTestHeaderString({
            payload,
            secret: webhookSecret,
          });
          authState.studentId = student.id;
          const openSlots = await loadAvailability({
            teacherId: raceTeacherId,
            from: addDays(new Date(), 20),
            to: addDays(new Date(), 34),
            lessonMinutes: 50,
            now: new Date(),
            minNoticeHours: 12,
          });
          const slot = openSlots?.find(
            (candidate) => !usedStarts.has(candidate.startsAt.getTime()),
          );
          if (!slot) throw new Error("TEST_SLOT_MISSING");
          usedStarts.add(slot.startsAt.getTime());
          const [webhook, booking] = await Promise.all([
            POST(
              new Request("http://localhost/api/webhooks/stripe", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "stripe-signature": signature,
                },
                body: payload,
              }),
            ),
            createBooking(
              new Request("http://localhost/api/bookings", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "idempotency-key": `${fixture}:race:${index}`,
                },
                body: JSON.stringify({
                  teacherId: raceTeacherId,
                  startsAt: slot.startsAt.toISOString(),
                  lessonMinutes: 50,
                  locationId: raceLocationId,
                  requireCredit: false,
                }),
              }),
            ),
          ]);

          expect(webhook.status, await webhook.clone().text()).toBe(200);
          expect(
            booking.status,
            `${slot.startsAt.toISOString()} ${await booking.clone().text()}`,
          ).toBe(201);
          const booked = (await booking.json()) as {
            creditCharged: boolean;
            holdExpiresAt: string | null;
          };
          const ledger = await db.creditTransaction.findMany({
            where: { studentId: student.id },
          });
          const balance = ledger.reduce((sum, entry) => sum + entry.delta, 0);
          const reversed = ledger
            .filter((entry) => entry.reason === "PAYMENT_REFUND")
            .reduce((sum, entry) => sum - entry.delta, 0);
          expect(balance).toBeGreaterThanOrEqual(0);
          const charged = booked.creditCharged && reversed === 0;
          const hold =
            !booked.creditCharged &&
            booked.holdExpiresAt !== null &&
            reversed === 1;
          expect(charged || hold).toBe(true);
        }
      } finally {
        if (raceStudentIds.length > 0) {
          await db.notification.deleteMany({
            where: { userId: { in: raceStudentIds } },
          });
          await db.creditTransaction.deleteMany({
            where: { studentId: { in: raceStudentIds } },
          });
          await db.booking.deleteMany({
            where: { studentId: { in: raceStudentIds } },
          });
        }
        if (eventIds.length > 0) {
          await db.stripeEvent.deleteMany({ where: { id: { in: eventIds } } });
        }
        if (orderIds.length > 0) {
          await db.payment.deleteMany({ where: { orderId: { in: orderIds } } });
          await db.order.deleteMany({ where: { id: { in: orderIds } } });
        }
        if (raceProductId) {
          await db.productTranslation.deleteMany({
            where: { productId: raceProductId },
          });
          await db.product.delete({ where: { id: raceProductId } });
        }
        if (raceTeacherId) {
          await db.teacherAvailability.deleteMany({
            where: { teacherId: raceTeacherId },
          });
          await db.teacherLocation.deleteMany({
            where: { teacherId: raceTeacherId },
          });
          await db.teacherProfile.delete({ where: { id: raceTeacherId } });
        }
        if (raceLocationId) {
          await db.location.delete({ where: { id: raceLocationId } });
        }
        if (raceTeacherUserId) {
          await db.user.delete({ where: { id: raceTeacherUserId } });
        }
        if (raceStudentIds.length > 0) {
          await db.user.deleteMany({ where: { id: { in: raceStudentIds } } });
        }
      }
    },
    60_000,
  );
});
