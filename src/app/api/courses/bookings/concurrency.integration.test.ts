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
const runId = process.env.INTEGRATION_RUN_ID?.trim() || "it-courses-concurrency";
const studentIds: string[] = [];
let productId = "";
let courseId = "";
let occasionId = "";

async function cleanupRunArtifacts() {
  const runUsers = await db.user.findMany({
    where: { email: { startsWith: `${runId}-` } },
    select: { id: true },
  });
  const runUserIds = runUsers.map((user) => user.id);
  const runProducts = await db.product.findMany({
    where: { slug: { startsWith: `${runId}-` } },
    select: { id: true },
  });
  const runProductIds = runProducts.map((product) => product.id);
  const runCourses = await db.course.findMany({
    where: { productId: { in: runProductIds } },
    select: { id: true },
  });
  const runCourseIds = runCourses.map((course) => course.id);
  await db.courseBooking.deleteMany({
    where: {
      OR: [
        { studentId: { in: runUserIds } },
        { sourceOrderItem: { order: { studentId: { in: runUserIds } } } },
        { occasion: { courseId: { in: runCourseIds } } },
      ],
    },
  });
  await db.courseOccasion.deleteMany({
    where: { courseId: { in: runCourseIds } },
  });
  await db.payment.deleteMany({
    where: { order: { studentId: { in: runUserIds } } },
  });
  await db.order.deleteMany({
    where: { studentId: { in: runUserIds } },
  });
  await db.user.deleteMany({
    where: { id: { in: runUserIds } },
  });
  await db.course.deleteMany({
    where: { id: { in: runCourseIds } },
  });
  await db.productTranslation.deleteMany({
    where: { productId: { in: runProductIds } },
  });
  await db.product.deleteMany({
    where: { id: { in: runProductIds } },
  });
}

describe.skipIf(!runIntegration)("course booking API concurrency", () => {
  beforeAll(async () => {
    await cleanupRunArtifacts();
    const product = await db.product.create({
      data: {
        slug: `${runId}-product`,
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
          email: `${runId}-student-${index}@example.invalid`,
          firstName: "Concurrency",
          lastName: `Student ${index}`,
          role: "STUDENT",
        },
      });
      studentIds.push(student.id);

      await db.order.create({
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
    }
  });

  afterAll(async () => {
    await cleanupRunArtifacts();
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
