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
import { PATCH as patchBooking } from "@/app/api/bookings/[id]/route";
import { loadAvailability } from "@/lib/bookings/availability";
import { db } from "@/lib/db";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const fixture = `api-booking-race-${randomUUID()}`;
const studentIds: string[] = [];
const seededStudentIds: string[] = [];
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
      seededStudentIds.push(student.id);
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
      authState.studentIds = [...seededStudentIds];
      const responses = await Promise.all(
        seededStudentIds.map((_, index) =>
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

  async function createStudent(credits: number) {
    const student = await db.user.create({
      data: {
        email: `${fixture}-extra-${randomUUID()}@example.invalid`,
        firstName: "Concurrency",
        lastName: "Extra",
        role: "STUDENT",
        ...(credits > 0
          ? {
              credits: {
                create: {
                  delta: credits,
                  reason: "PURCHASE" as const,
                  expiresAt: addDays(new Date(), 365),
                },
              },
            }
          : {}),
      },
    });
    studentIds.push(student.id);
    return student.id;
  }

  async function openSlots(count: number) {
    const slots = await loadAvailability({
      teacherId,
      from: addDays(startsAt, -1),
      to: addDays(startsAt, 2),
      lessonMinutes: 50,
      now: new Date(),
      minNoticeHours: 12,
    });
    if (!slots || slots.length < count) {
      throw new Error(`TEST_SLOTS_SHORT:${slots?.length ?? 0}`);
    }
    return slots.slice(0, count);
  }

  function postBooking(
    studentId: string,
    slot: Date,
    idempotencyKey: string,
    requireCredit = false,
  ) {
    return POST(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          teacherId,
          startsAt: slot.toISOString(),
          lessonMinutes: 50,
          locationId,
          requireCredit,
        }),
      }),
    );
  }

  function cancelBooking(bookingId: string) {
    return patchBooking(
      new Request(`http://localhost/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      }),
      { params: Promise.resolve({ id: bookingId }) },
    );
  }

  it("charges one credit and holds the other three parallel slots", async () => {
    const studentId = await createStudent(1);
    const slots = await openSlots(4);
    authState.studentIds = [studentId, studentId, studentId, studentId];
    const responses = await Promise.all(
      slots.map((slot, index) =>
        postBooking(studentId, slot.startsAt, `${fixture}:split:${index}`),
      ),
    );
    const bodies = await Promise.all(
      responses.map(async (response) => ({
        status: response.status,
        body: (await response.json()) as {
          creditCharged?: boolean;
          holdExpiresAt?: string | null;
          error?: { code?: string };
        },
      })),
    );
    expect(
      bodies.map(({ status }) => status),
      JSON.stringify(bodies),
    ).toEqual([201, 201, 201, 201]);
    const charged = bodies.filter(({ body }) => body.creditCharged === true);
    const holds = bodies.filter(
      ({ body }) => body.creditCharged === false && body.holdExpiresAt,
    );
    expect(charged).toHaveLength(1);
    expect(holds).toHaveLength(3);
    const ledger = await db.creditTransaction.findMany({
      where: { studentId },
    });
    expect(ledger.reduce((sum, entry) => sum + entry.delta, 0)).toBe(0);
  });

  it("returns one booking when the same idempotency key is posted in parallel", async () => {
    const studentId = await createStudent(0);
    const [slot] = await openSlots(1);
    const idempotencyKey = `${fixture}:same-key`;
    authState.studentIds = [studentId, studentId, studentId, studentId];
    const responses = await Promise.all(
      [0, 1, 2, 3].map(() =>
        postBooking(studentId, slot.startsAt, idempotencyKey),
      ),
    );
    const bodies = await Promise.all(
      responses.map(async (response) => ({
        status: response.status,
        body: (await response.json()) as { id?: string; error?: { code?: string } },
      })),
    );
    expect(
      bodies.every(({ status }) => status === 200 || status === 201),
      JSON.stringify(bodies),
    ).toBe(true);
    const ids = bodies.map(({ body }) => body.id);
    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).toBeTruthy();
    expect(
      await db.booking.count({ where: { idempotencyKey } }),
    ).toBe(1);
  });

  it("rejects an idempotency key that belongs to another student", async () => {
    const studentA = await createStudent(0);
    const studentB = await createStudent(0);
    const [slot] = await openSlots(1);
    const idempotencyKey = `${fixture}:other-student`;
    authState.studentIds = [studentA];
    const created = await postBooking(studentA, slot.startsAt, idempotencyKey);
    expect(created.status).toBe(201);
    authState.studentIds = [studentB];
    const reused = await postBooking(studentB, slot.startsAt, idempotencyKey);
    expect(reused.status).toBe(409);
    await expect(reused.json()).resolves.toMatchObject({
      error: { code: "IDEMPOTENCY_KEY_REUSED" },
    });
  });

  it("refunds a credit booking once when two cancels race", async () => {
    const studentId = await createStudent(1);
    const [slot] = await openSlots(1);
    authState.studentIds = [studentId];
    const created = await postBooking(
      studentId,
      slot.startsAt,
      `${fixture}:cancel-once`,
      true,
    );
    expect(created.status).toBe(201);
    const booking = (await created.json()) as { id: string; creditCharged: boolean };
    expect(booking.creditCharged).toBe(true);

    authState.studentIds = [studentId, studentId];
    const responses = await Promise.all([
      cancelBooking(booking.id),
      cancelBooking(booking.id),
    ]);
    const outcomes = await Promise.all(
      responses.map(async (response) => ({
        status: response.status,
        body: (await response.json()) as { error?: { code?: string } },
      })),
    );
    const statuses = outcomes.map(({ status }) => status).sort();
    expect(statuses, JSON.stringify(outcomes)).toEqual([200, 409]);
    expect(
      outcomes.find(({ status }) => status === 409)?.body.error?.code,
    ).toBe("BOOKING_NOT_ACTIVE");
    expect(
      await db.creditTransaction.count({
        where: { bookingId: booking.id, reason: "CANCELLATION_REFUND" },
      }),
    ).toBe(1);
  });
});
