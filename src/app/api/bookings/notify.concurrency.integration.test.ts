import { randomUUID } from "node:crypto";

import { addDays, addHours, addMinutes } from "date-fns";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  sessions: [] as Array<{ id: string; role: "STUDENT" | "TEACHER" | "ADMIN" }>,
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => {
    const session = authState.sessions.shift();
    if (!session) throw new Error("TEST_SESSION_QUEUE_EMPTY");
    return { user: session };
  }),
}));

vi.mock("@/lib/auth/otp-store", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/auth/otp-store")>();
  return { ...original, allowRateLimitedAction: vi.fn(async () => true) };
});

vi.mock("@/lib/sms/client", () => ({
  sendSmsMessage: vi.fn(async () => true),
}));

import { PATCH as adminPatch } from "@/app/api/admin/bookings/[id]/route";
import { PATCH } from "@/app/api/bookings/[id]/route";
import { POST as createBooking } from "@/app/api/bookings/route";
import { GET as teacherFeed } from "@/app/api/teachers/calendar/[token]/route";
import { loadAvailability } from "@/lib/bookings/availability";
import { runCoreCron } from "@/lib/cron/jobs";
import { db } from "@/lib/db";
import { dispatchNotifications } from "@/lib/notifications/dispatch";

const runIntegration = process.env.RUN_DB_INTEGRATION === "1";
const runId = process.env.INTEGRATION_RUN_ID?.trim() || "it-booking-notify";
let teacherUserId = "";
let teacherId = "";
let otherTeacherId = "";
let otherTeacherUserId = "";
let locationId = "";
let adminId = "";
let localCounter = 0;

function nextTag() {
  localCounter += 1;
  return `${runId}-${localCounter}`;
}

async function cleanupRunArtifacts() {
  const runUsers = await db.user.findMany({
    where: { email: { startsWith: `${runId}-` } },
    select: { id: true },
  });
  const runUserIds = runUsers.map((user) => user.id);
  const runTeacherProfiles = await db.teacherProfile.findMany({
    where: { slug: { startsWith: `${runId}-` } },
    select: { id: true },
  });
  const runTeacherIds = runTeacherProfiles.map((profile) => profile.id);
  await db.notification.deleteMany({
    where: { userId: { in: runUserIds } },
  });
  await db.creditTransaction.deleteMany({
    where: { studentId: { in: runUserIds } },
  });
  await db.booking.deleteMany({
    where: {
      OR: [
        { studentId: { in: runUserIds } },
        { teacherId: { in: runTeacherIds } },
        { idempotencyKey: { startsWith: `${runId}-` } },
      ],
    },
  });
  await db.teacherAvailability.deleteMany({
    where: { teacherId: { in: runTeacherIds } },
  });
  await db.teacherLocation.deleteMany({
    where: { teacherId: { in: runTeacherIds } },
  });
  await db.teacherProfile.deleteMany({
    where: { id: { in: runTeacherIds } },
  });
  await db.location.deleteMany({
    where: { slug: { startsWith: `${runId}-` } },
  });
  await db.user.deleteMany({
    where: { id: { in: runUserIds } },
  });
}

describe.skipIf(!runIntegration)("booking notification coverage", () => {
  beforeAll(async () => {
    await cleanupRunArtifacts();
    const location = await db.location.create({
      data: {
        slug: `${runId}-location`,
        name: "Notify fixture",
        address: "Testvägen 3",
        city: "Stockholm",
        postalCode: "111 33",
        lat: 59.33,
        lng: 18.07,
      },
    });
    locationId = location.id;
    const teacher = await db.user.create({
      data: {
        email: `${runId}-teacher@example.invalid`,
        phone: "+46700000001",
        firstName: "Sara",
        lastName: "Teacher",
        role: "TEACHER",
        teacherProfile: {
          create: {
            slug: `${runId}-teacher`,
            languages: ["sv"],
            transmissions: ["MANUAL"],
            locations: { create: { locationId } },
            availability: {
              create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
                dayOfWeek,
                startTime: "08:00",
                endTime: "18:00",
                locationId,
              })),
            },
          },
        },
      },
      include: { teacherProfile: true },
    });
    teacherUserId = teacher.id;
    teacherId = teacher.teacherProfile!.id;
    const other = await db.user.create({
      data: {
        email: `${runId}-other@example.invalid`,
        phone: "+46700000002",
        firstName: "Amir",
        lastName: "Other",
        role: "TEACHER",
        teacherProfile: {
          create: {
            slug: `${runId}-other`,
            languages: ["sv"],
            transmissions: ["MANUAL"],
            locations: { create: { locationId } },
            availability: {
              create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
                dayOfWeek,
                startTime: "08:00",
                endTime: "18:00",
                locationId,
              })),
            },
          },
        },
      },
      include: { teacherProfile: true },
    });
    otherTeacherUserId = other.id;
    otherTeacherId = other.teacherProfile!.id;
    const admin = await db.user.create({
      data: {
        email: `${runId}-admin@example.invalid`,
        firstName: "Ada",
        lastName: "Admin",
        role: "ADMIN",
      },
    });
    adminId = admin.id;
  });

  afterAll(async () => {
    await cleanupRunArtifacts();
  });

  async function student(credits: number) {
    const number = String(localCounter + 1).padStart(4, "0");
    const tag = nextTag();
    const created = await db.user.create({
      data: {
        email: `${tag}@example.invalid`,
        phone: `+467900${number}`,
        firstName: "Nora",
        lastName: "Student",
        role: "STUDENT",
        ...(credits
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
    return created.id;
  }

  async function slot() {
    const slots = await loadAvailability({
      teacherId,
      from: addDays(new Date(), 20),
      to: addDays(new Date(), 27),
      lessonMinutes: 50,
      now: new Date(),
      minNoticeHours: 12,
    });
    const found = slots?.[0];
    if (!found) throw new Error("TEST_SLOT_MISSING");
    return found.startsAt;
  }

  it("texts the student and teacher for a credit booking, and nobody for a hold", async () => {
    const chargedStudent = await student(1);
    const holdStudent = await student(0);
    const firstSlot = await slot();
    authState.sessions = [
      { id: chargedStudent, role: "STUDENT" },
      { id: holdStudent, role: "STUDENT" },
    ];
    const charged = await createBooking(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": `${runId}-charged`,
        },
        body: JSON.stringify({
          teacherId,
          startsAt: firstSlot.toISOString(),
          lessonMinutes: 50,
          locationId,
        }),
      }),
    );
    expect(charged.status).toBe(201);
    const second = await loadAvailability({
      teacherId,
      from: addDays(new Date(), 20),
      to: addDays(new Date(), 27),
      lessonMinutes: 50,
      now: new Date(),
      minNoticeHours: 12,
    });
    const hold = await createBooking(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": `${runId}-hold`,
        },
        body: JSON.stringify({
          teacherId,
          startsAt: second?.[0]?.startsAt.toISOString(),
          lessonMinutes: 50,
          locationId,
        }),
      }),
    );
    expect(hold.status).toBe(201);
    const sms = await db.notification.findMany({
      where: {
        userId: { in: [chargedStudent, teacherUserId, holdStudent] },
        channel: "SMS",
      },
    });
    expect(
      sms.filter((item) => item.userId === chargedStudent).map((item) => item.template),
    ).toContain("booking_confirmed");
    expect(
      sms.filter((item) => item.userId === teacherUserId).map((item) => item.template),
    ).toContain("teacher_booking_new");
    expect(sms.filter((item) => item.userId === holdStudent)).toHaveLength(0);
  });

  it("rejects a student reschedule inside 24 hours", async () => {
    const studentId = await student(0);
    const startsAt = addHours(new Date(), 2);
    const booking = await db.booking.create({
      data: {
        studentId,
        teacherId,
        locationId,
        startsAt,
        endsAt: addMinutes(startsAt, 50),
        creditCharged: true,
        status: "CONFIRMED",
      },
    });
    const next = await slot();
    authState.sessions = [{ id: studentId, role: "STUDENT" }];
    const response = await PATCH(
      new Request(`http://localhost/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          startsAt: next.toISOString(),
        }),
      }),
      { params: Promise.resolve({ id: booking.id }) },
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "OUTSIDE_CANCELLATION_WINDOW" },
    });
  });

  it("notifies both teachers and the student when an admin reassigns", async () => {
    const studentId = await student(1);
    const startsAt = await slot();
    authState.sessions = [{ id: studentId, role: "STUDENT" }];
    const created = await createBooking(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": `${runId}-reassign`,
        },
        body: JSON.stringify({
          teacherId,
          startsAt: startsAt.toISOString(),
          lessonMinutes: 50,
          locationId,
        }),
      }),
    );
    const booking = (await created.json()) as { id: string };
    const otherSlots = await loadAvailability({
      teacherId: otherTeacherId,
      from: addDays(new Date(), 20),
      to: addDays(new Date(), 27),
      lessonMinutes: 50,
      now: new Date(),
      minNoticeHours: 0,
    });
    const target = otherSlots?.[0];
    expect(target).toBeTruthy();
    authState.sessions = [{ id: adminId, role: "ADMIN" }];
    const response = await adminPatch(
      new Request(`http://localhost/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "reassign",
          teacherId: otherTeacherId,
          startsAt: target!.startsAt.toISOString(),
          reason: "Byte av lärare",
        }),
      }),
      { params: Promise.resolve({ id: booking.id }) },
    );
    expect(response.status, await response.clone().text()).toBe(200);
    const templates = await db.notification.findMany({
      where: {
        userId: { in: [studentId, teacherUserId, otherTeacherUserId] },
        template: {
          in: [
            "booking_moved",
            "teacher_booking_cancelled",
            "teacher_booking_new",
          ],
        },
      },
    });
    expect(templates.some((item) => item.userId === studentId && item.channel === "SMS")).toBe(true);
    expect(
      templates.some(
        (item) =>
          item.userId === teacherUserId &&
          item.template === "teacher_booking_cancelled",
      ),
    ).toBe(true);
    expect(
      templates.some(
        (item) =>
          item.userId === otherTeacherUserId &&
          item.template === "teacher_booking_new",
      ),
    ).toBe(true);
  });

  it("sends one reminder for a lesson booked well ahead, and another after a move", async () => {
    const studentId = await student(0);
    const now = new Date("2026-10-01T08:00:00.000Z");
    const startsAt = addHours(now, 13);
    await db.booking.create({
      data: {
        studentId,
        teacherId,
        locationId,
        startsAt,
        endsAt: addMinutes(startsAt, 50),
        creditCharged: true,
        status: "CONFIRMED",
      },
    });
    await runCoreCron(now, { onlyStudentIds: [studentId] });
    expect(
      await db.notification.count({
        where: { userId: studentId, template: "booking_reminder_24h" },
      }),
    ).toBe(0);

    const ahead = addDays(now, 3);
    const early = await db.booking.create({
      data: {
        studentId,
        teacherId,
        locationId,
        startsAt: ahead,
        endsAt: addMinutes(ahead, 50),
        creditCharged: true,
        status: "CONFIRMED",
        createdAt: addDays(ahead, -4),
      },
    });
    const insideWindow = addHours(ahead, -20);
    await runCoreCron(insideWindow, {
      onlyStudentIds: [studentId],
      onlyBookingIds: [early.id],
    });
    await runCoreCron(insideWindow, {
      onlyStudentIds: [studentId],
      onlyBookingIds: [early.id],
    });
    expect(
      await db.notification.count({
        where: { userId: studentId, template: "booking_reminder_24h" },
      }),
    ).toBe(1);
    await db.booking.update({
      where: { id: early.id },
      data: { startsAt: addHours(ahead, 2), endsAt: addMinutes(addHours(ahead, 2), 50) },
    });
    await runCoreCron(addHours(ahead, 2 - 20), {
      onlyStudentIds: [studentId],
      onlyBookingIds: [early.id],
    });
    expect(
      await db.notification.count({
        where: { userId: studentId, template: "booking_reminder_24h" },
      }),
    ).toBe(2);
  });

  it("marks a moved confirmation stale and serves the teacher feed without phone numbers", async () => {
    const studentId = await student(0);
    const startsAt = addDays(new Date(), 10);
    const booking = await db.booking.create({
      data: {
        studentId,
        teacherId,
        locationId,
        startsAt,
        endsAt: addMinutes(startsAt, 50),
        creditCharged: true,
        status: "CONFIRMED",
        studentNote: "secret note",
      },
    });
    const note = await db.notification.create({
      data: {
        userId: studentId,
        channel: "SMS",
        template: "booking_confirmed",
        locale: "sv",
        payload: { bookingId: booking.id, startsAt: startsAt.toISOString() },
        sendAfter: new Date(),
      },
    });
    await db.booking.update({
      where: { id: booking.id },
      data: {
        startsAt: addHours(startsAt, 2),
        endsAt: addMinutes(addHours(startsAt, 2), 50),
      },
    });
    await dispatchNotifications([note.id], new Date());
    const stale = await db.notification.findUniqueOrThrow({
      where: { id: note.id },
    });
    expect(stale.error).toBe("STALE");

    const token = `${runId}${randomUUID().replaceAll("-", "")}`.slice(0, 43);
    await db.teacherProfile.update({
      where: { id: teacherId },
      data: { calendarToken: token },
    });
    await db.booking.create({
      data: {
        studentId,
        teacherId,
        locationId,
        startsAt: addDays(new Date(), 4),
        endsAt: addMinutes(addDays(new Date(), 4), 50),
        creditCharged: false,
        holdExpiresAt: addHours(new Date(), 1),
        status: "CONFIRMED",
      },
    });
    const missing = await teacherFeed(new Request("http://localhost"), {
      params: Promise.resolve({ token: "a".repeat(43) }),
    });
    expect(missing.status).toBe(404);
    const feed = await teacherFeed(new Request("http://localhost"), {
      params: Promise.resolve({ token }),
    });
    expect(feed.status).toBe(200);
    const body = await feed.text();
    expect(body).not.toContain("+46");
    expect(body).not.toContain("secret note");
    expect(body).not.toContain("Student");
    expect(body).toContain("Nora");
  });
});
