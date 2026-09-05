import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { addMinutes } from "date-fns";

import { isBookingExclusionViolation } from "../src/lib/bookings/errors";

const db = new PrismaClient();
const fixture = `booking-race-${randomUUID()}`;
const teacherUserId = randomUUID();
const teacherId = randomUUID();
const studentIds = Array.from({ length: 20 }, () => randomUUID());
const startsAt = new Date("2035-01-15T10:00:00.000Z");
const endsAt = addMinutes(startsAt, 50);

async function createBooking(studentId: string, idempotencyKey: string) {
  const existing = await db.booking.findUnique({ where: { idempotencyKey } });
  if (existing) return { kind: "existing" as const, booking: existing };

  try {
    const booking = await db.booking.create({
      data: {
        studentId,
        teacherId,
        startsAt,
        endsAt,
        creditCharged: false,
        holdExpiresAt: addMinutes(startsAt, 15),
        idempotencyKey,
      },
    });
    return { kind: "created" as const, booking };
  } catch (error) {
    if (isBookingExclusionViolation(error)) {
      return { kind: "conflict" as const };
    }
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  try {
    await db.user.create({
      data: {
        id: teacherUserId,
        email: `${fixture}-teacher@example.invalid`,
        firstName: "Concurrency",
        lastName: "Teacher",
        role: "TEACHER",
        teacherProfile: {
          create: {
            id: teacherId,
            slug: fixture,
            languages: ["sv"],
            transmissions: ["MANUAL"],
          },
        },
      },
    });
    await db.user.createMany({
      data: studentIds.map((id, index) => ({
        id,
        email: `${fixture}-student-${index}@example.invalid`,
        firstName: "Concurrency",
        lastName: `Student ${index}`,
        role: "STUDENT" as const,
      })),
    });

    const attempts = await Promise.all(
      studentIds.map((studentId, index) =>
        createBooking(studentId, `${fixture}:${index}`),
      ),
    );
    const created = attempts.filter((result) => result.kind === "created");
    const conflicts = attempts.filter((result) => result.kind === "conflict");
    if (created.length !== 1 || conflicts.length !== 19) {
      throw new Error(
        `Expected 1 booking and 19 conflicts; got ${created.length} and ${conflicts.length}`,
      );
    }

    const winner = created[0].booking;
    const retry = await createBooking(winner.studentId, winner.idempotencyKey!);
    if (retry.kind !== "existing" || retry.booking.id !== winner.id) {
      throw new Error("Idempotent retry did not return the original booking");
    }

    console.log(
      "PASS: 20 parallel attempts produced 1 booking and 19 conflicts; idempotent retry returned the original booking.",
    );
  } finally {
    await db.booking.deleteMany({
      where: { idempotencyKey: { startsWith: fixture } },
    });
    await db.teacherProfile.deleteMany({ where: { id: teacherId } });
    await db.user.deleteMany({
      where: { id: { in: [teacherUserId, ...studentIds] } },
    });
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
