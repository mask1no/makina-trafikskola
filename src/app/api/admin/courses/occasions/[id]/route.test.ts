import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  occasionFindFirst: vi.fn(),
  courseFindFirst: vi.fn(),
  occasionUpdate: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    courseOccasion: {
      findFirst: mocks.occasionFindFirst,
      update: mocks.occasionUpdate,
    },
    course: { findFirst: mocks.courseFindFirst },
    auditLog: { create: mocks.auditCreate },
    $transaction: mocks.transaction,
  },
}));

import { PATCH } from "./route";

const occasionId = "clh1234567890123456789012";

function request(body: unknown) {
  return new Request(`http://localhost/api/admin/courses/occasions/${occasionId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("admin course occasion cancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.occasionFindFirst.mockResolvedValue({
      id: occasionId,
      cancelled: false,
      courseId: "clh2234567890123456789012",
      startsAt: new Date("2026-11-01T08:00:00.000Z"),
      endsAt: new Date("2026-11-01T12:00:00.000Z"),
      venueName: "Old venue",
      venueAddress: "Old address",
      capacity: 12,
      language: "sv",
      course: { id: "course-1", kind: "RISK1", productId: "product-1" },
      _count: { bookings: 0 },
    });
    mocks.occasionUpdate.mockResolvedValue({ id: occasionId });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    mocks.transaction.mockResolvedValue([]);
  });

  it("validates params and body before auth", async () => {
    const response = await PATCH(request({ action: "delete" }), {
      params: Promise.resolve({ id: "bad" }),
    });
    expect(response.status).toBe(400);
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("verifies the Risk course occasion then audits cancellation", async () => {
    const response = await PATCH(request({ action: "cancel", confirm: true }), {
      params: Promise.resolve({ id: occasionId }),
    });
    expect(response.status).toBe(200);
    expect(mocks.occasionFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: occasionId,
        course: { kind: { in: ["RISK1", "RISK2"] } },
      },
    }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        actorId: "admin-1",
        action: "courseOccasion.cancel",
      }),
    }));
  });

  it("refuses cancellation while participants remain booked", async () => {
    mocks.occasionFindFirst.mockResolvedValueOnce({
      id: occasionId,
      cancelled: false,
      courseId: "clh2234567890123456789012",
      course: { id: "course-1", kind: "RISK1", productId: "product-1" },
      _count: { bookings: 2 },
    });

    const response = await PATCH(request({ action: "cancel", confirm: true }), {
      params: Promise.resolve({ id: occasionId }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "COURSE_OCCASION_HAS_BOOKINGS" },
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("verifies the linked product and audits edits", async () => {
    const courseId = "clh3234567890123456789012";
    mocks.courseFindFirst.mockResolvedValue({
      id: courseId,
      kind: "RISK2",
      productId: "product-2",
    });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        courseOccasion: { update: mocks.occasionUpdate },
        auditLog: { create: mocks.auditCreate },
      }),
    );
    const response = await PATCH(request({
      action: "edit",
      courseId,
      startsAt: "2026-11-02T08:00:00.000Z",
      endsAt: "2026-11-02T13:00:00.000Z",
      venueName: "New venue",
      venueAddress: "New address",
      capacity: 20,
      language: "en",
    }), { params: Promise.resolve({ id: occasionId }) });

    expect(response.status).toBe(200);
    expect(mocks.courseFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: courseId, product: { kind: "COURSE_SEAT" } }),
    }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "courseOccasion.update" }),
    }));
  });
});
