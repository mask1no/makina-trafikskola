import { randomUUID } from "node:crypto";

import { addDays, addHours } from "date-fns";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ studentIds: [] as string[] }));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => {
    const id = authState.studentIds.shift();
    if (!id) throw new Error("TEST_SESSION_QUEUE_EMPTY");
    return { user: { id, role: "STUDENT" } };
  }),
}));

vi.mock("@/lib/payments/payment-intents", () => ({
  createPaymentIntentForOrder: vi.fn(async () => {
    throw new Error("PAYMENT_PATH_MUST_NOT_RUN_FOR_OWNED_ENTITLEMENT");
  }),
}));

import { POST } from "@/app/api/courses/bookings/route";
import { db } from "@/lib/db";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const fixture = `api-course-race-${randomUUID()}`;
const studentIds: string[] = [];
const orderIds: string[] = [];
let productId = "";
let courseId = "";
let occasionId = "";

describe.skipIf(!runIntegration)("course booking API concurrency", () => {
  beforeAll(async () => {
    const product = await db.product.create({
      data: {
        slug: fixture,
        kind: "COURSE_SEAT",
        active: false,
        priceOre: 10000,
        includesRisk1: true,
        translations: {
          create: {
            locale: "sv",
            name: "Concurrency fixture",
            features: [],
          },
        },
      },
    });
    productId = product.id;

    const course = await db.course.create({
      data: { kind: "RISK1", productId },
    });
    courseId = course.id;

    const startsAt = addDays(new Date(), 14);
    const occasion = await db.courseOccasion.create({
      data: {
        courseId,
        startsAt,
        endsAt: addHours(startsAt, 2),
        capacity: 1,
        venueName: "Concurrency fixture",
        venueAddress: "Testvägen 1",
      },
    });
    occasionId = occasion.id;

    for (let index = 0; index < 20; index += 1) {
      const student = await db.user.create({
        data: {
          email: `${fixture}-student-${index}@example.invalid`,
          firstName: "Concurrency",
          lastName: `Student ${index}`,
          role: "STUDENT",
        },
      });
      studentIds.push(student.id);

      const order = await db.order.create({
        data: {
          studentId: student.id,
          status: "PAID",
          paidAt: new Date(),
          totalOre: product.priceOre,
          vatOre: 2000,
          payment: {
            create: {
              amountOre: product.priceOre,
              status: "SUCCEEDED",
            },
          },
          items: {
            create: {
              productId,
              quantity: 1,
              unitPriceOre: product.priceOre,
              vatRatePct: 25,
              productNameSnapshot: "Concurrency fixture",
            },
          },
        },
      });
      orderIds.push(order.id);
    }
  });

  afterAll(async () => {
    if (occasionId) {
      await db.courseBooking.deleteMany({ where: { occasionId } });
      await db.courseOccasion.delete({ where: { id: occasionId } });
    }
    await db.payment.deleteMany({ where: { orderId: { in: orderIds } } });
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
    await db.user.deleteMany({ where: { id: { in: studentIds } } });
    if (courseId) await db.course.delete({ where: { id: courseId } });
    if (productId) {
      await db.productTranslation.deleteMany({ where: { productId } });
      await db.product.delete({ where: { id: productId } });
    }
  });

  it(
    "accepts exactly one of twenty requests for a one-seat occasion",
    async () => {
      authState.studentIds = [...studentIds];
      const responses = await Promise.all(
        studentIds.map(() =>
          POST(
            new Request("http://localhost/api/courses/bookings", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                occasionId,
                termsAccepted: true,
                withdrawalAcknowledged: true,
              }),
            }),
          ),
        ),
      );

      const statuses = responses.map(({ status }) => status);
      expect(statuses.filter((status) => status === 201)).toHaveLength(1);
      expect(statuses.filter((status) => status === 409)).toHaveLength(19);

      const conflicts = await Promise.all(
        responses
          .filter(({ status }) => status === 409)
          .map((response) => response.json()),
      );
      expect(conflicts).toHaveLength(19);
      expect(
        conflicts.every(
          (body) =>
            (body as { error?: { code?: string } }).error?.code ===
            "COURSE_FULL",
        ),
      ).toBe(true);
    },
    30_000,
  );
});
