import { Prisma, PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function main() {
  const product = await db.product.create({
    data: {
      slug: `course-concurrency-${suffix}`,
      kind: "COURSE_SEAT",
      active: true,
      priceOre: 10000,
      includesRisk1: true,
      translations: {
        create: {
          locale: "sv",
          name: "Concurrency test",
          features: [],
        },
      },
    },
  });
  const course = await db.course.create({
    data: { kind: "RISK1", productId: product.id },
  });
  const occasions = await Promise.all(
    [1, 2].map((day) =>
      db.courseOccasion.create({
        data: {
          courseId: course.id,
          startsAt: new Date(`2099-01-0${day}T10:00:00Z`),
          endsAt: new Date(`2099-01-0${day}T12:00:00Z`),
          capacity: 1,
          venueName: "Test",
          venueAddress: "Test",
        },
      }),
    ),
  );
  const students = await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      db.user.create({
        data: {
          email: `course-concurrency-${suffix}-${index}@example.test`,
          firstName: "Course",
          lastName: `Student ${index}`,
        },
      }),
    ),
  );
  const itemIds = new Map<string, string>();
  for (const student of students) {
    const order = await db.order.create({
      data: {
        studentId: student.id,
        status: "PAID",
        paidAt: new Date("2026-01-01T00:00:00Z"),
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
            productId: product.id,
            quantity: 1,
            unitPriceOre: product.priceOre,
            vatRatePct: 25,
            productNameSnapshot: "Concurrency test",
          },
        },
      },
      include: { items: true },
    });
    itemIds.set(student.id, order.items[0]!.id);
  }

  async function reserve(
    studentId: string,
    occasionId: string,
  ): Promise<boolean> {
    try {
      return await db.$transaction(
        async (tx) => {
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(${"course-occasion:" + occasionId})
          )
        `;
        const occasion = await tx.courseOccasion.findUniqueOrThrow({
          where: { id: occasionId },
          include: { course: true },
        });
        if (
          (await tx.courseBooking.count({
            where: {
              occasionId,
              status: { in: ["CONFIRMED", "COMPLETED"] },
            },
          })) >= occasion.capacity
        ) {
          return false;
        }
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(
              ${"course-entitlement:" + studentId + ":" + occasion.course.kind}
            )
          )
        `;
        const itemId = itemIds.get(studentId)!;
        const used = await tx.courseBooking.count({
          where: {
            sourceOrderItemId: itemId,
            status: { in: ["CONFIRMED", "COMPLETED"] },
            occasion: { course: { kind: occasion.course.kind } },
          },
        });
        if (used >= 1) return false;
        await tx.courseBooking.create({
          data: {
            studentId,
            occasionId,
            sourceOrderItemId: itemId,
            status: "CONFIRMED",
          },
        });
        return true;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        return false;
      }
      throw error;
    }
  }

  const capacityResults = await Promise.all(
    students.map((student) => reserve(student.id, occasions[0]!.id)),
  );
  if (capacityResults.filter(Boolean).length !== 1) {
    throw new Error("COURSE_CAPACITY_RACE_FAILED");
  }

  const winner = students[capacityResults.findIndex(Boolean)]!;
  await db.courseBooking.deleteMany({
    where: { occasionId: occasions[0]!.id },
  });
  const redemptionResults = await Promise.all(
    occasions.map((occasion) => reserve(winner.id, occasion.id)),
  );
  if (redemptionResults.filter(Boolean).length !== 1) {
    throw new Error("COURSE_ENTITLEMENT_RACE_FAILED");
  }

  console.log(
    "Course concurrency passed: one seat and one entitlement redemption.",
  );
}

main()
  .finally(async () => {
    const users = await db.user.findMany({
      where: { email: { startsWith: `course-concurrency-${suffix}-` } },
      select: { id: true },
    });
    const userIds = users.map(({ id }) => id);
    await db.courseBooking.deleteMany({
      where: { studentId: { in: userIds } },
    });
    await db.courseOccasion.deleteMany({
      where: { course: { product: { slug: `course-concurrency-${suffix}` } } },
    });
    await db.course.deleteMany({
      where: { product: { slug: `course-concurrency-${suffix}` } },
    });
    await db.payment.deleteMany({
      where: { order: { studentId: { in: userIds } } },
    });
    await db.order.deleteMany({ where: { studentId: { in: userIds } } });
    await db.product.deleteMany({
      where: { slug: `course-concurrency-${suffix}` },
    });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
