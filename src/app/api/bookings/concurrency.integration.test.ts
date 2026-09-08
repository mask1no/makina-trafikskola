import { randomUUID } from "node:crypto";

import { addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ studentIds: [] as string[] }));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => {
    const id = authState.studentIds.shift();
    if (!id) throw new Error("TEST_SESSION_QUEUE_EMPTY");
    return { user: { id, role: "STUDENT" } };
  }),
}));

vi.mock("@/lib/auth/otp-store", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/auth/otp-store")>();
  return { ...original, allowRateLimitedAction: vi.fn(async () => true) };
});

vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotifications: vi.fn(async () => undefined),
}));

import { POST } from "@/app/api/bookings/route";
import { loadAvailability } from "@/lib/bookings/availability";
import { db } from "@/lib/db";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const fixture = `api-booking-race-${randomUUID()}`;
const studentIds: string[] = [];
let teacherUserId = "";
let teacherId = "";
let locationId = "";
let startsAt: Date;

describe.skipIf(!runIntegration)("booking API concurrency", () => {
  beforeAll(async () => {
    const future = addDays(new Date(), 14);
    future.setUTCMinutes(0, 0, 0);
    startsAt = future;
    const stockholmDay = toZonedTime(
      startsAt,
      "Europe/Stockholm",
    ).getDay();

    const location = await db.location.create({
      data: {
        slug: fixture,
        name: "Concurrency fixture",
        address: "Testvägen 1",
        city: "Stockholm",
        postalCode: "111 11",
        lat: 59.3293,
        lng: 18.0686,
      },
    });
    locationId = location.id;

    const teacher = await db.user.create({
      data: {
        email: `${fixture}-teacher@example.invalid`,
        firstName: "Concurrency",
        lastName: "Teacher",
        role: "TEACHER",
        teacherProfile: {
          create: {
            slug: fixture,
            languages: ["sv"],
            transmissions: ["MANUAL"],
            locations: { create: { locationId } },
            availability: {
              create: {
                dayOfWeek: stockholmDay,
                startTime: "00:00",
                endTime: "23:59",
                locationId,
              },
            },
          },
        },
      },
      include: { teacherProfile: true },
    });
    teacherUserId = teacher.id;
    teacherId = teacher.teacherProfile!.id;
    const slots = await loadAvailability({
      teacherId,
      from: addDays(future, -1),
      to: addDays(future, 1),
      lessonMinutes: 50,
      now: new Date(),
      minNoticeHours: 12,
    });
    if (!slots?.[0]) throw new Error("TEST_SLOT_NOT_CREATED");
    startsAt = slots[0].startsAt;

    for (let index = 0; index < 20; index += 1) {
      const student = await db.user.create({
        data: {
          email: `${fixture}-student-${index}@example.invalid`,
          firstName: "Concurrency",
          lastName: `Student ${index}`,
          role: "STUDENT",
          credits: {
            create: {
              delta: 1,
              reason: "PURCHASE",
              expiresAt: addDays(new Date(), 365),
            },
          },
        },
      });
      studentIds.push(student.id);
    }
  });

  afterAll(async () => {
    await db.creditTransaction.deleteMany({
      where: { studentId: { in: studentIds } },
    });
    await db.booking.deleteMany({
      where: { studentId: { in: studentIds } },
    });
    await db.notification.deleteMany({
      where: { userId: { in: studentIds } },
    });
    if (teacherId) {
      await db.teacherAvailability.deleteMany({ where: { teacherId } });
      await db.teacherLocation.deleteMany({ where: { teacherId } });
      await db.teacherProfile.delete({ where: { id: teacherId } });
    }
    if (locationId) {
      await db.location.delete({ where: { id: locationId } });
    }
    await db.user.deleteMany({
      where: { id: { in: [...studentIds, teacherUserId] } },
    });
  });

  it(
    "accepts exactly one of twenty requests for the same slot",
    async () => {
      authState.studentIds = [...studentIds];
      const responses = await Promise.all(
        studentIds.map((_, index) =>
          POST(
            new Request("http://localhost/api/bookings", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "idempotency-key": `${fixture}:${index}`,
              },
              body: JSON.stringify({
                teacherId,
                startsAt: startsAt.toISOString(),
                lessonMinutes: 50,
                locationId,
                requireCredit: true,
              }),
            }),
          ),
        ),
      );

      const statuses = responses.map(({ status }) => status);
      expect(
        statuses.filter((status) => status === 201),
        `Unexpected statuses: ${statuses.join(", ")}`,
      ).toHaveLength(1);
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
            "SLOT_TAKEN",
        ),
      ).toBe(true);
    },
    30_000,
  );
});
