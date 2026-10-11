import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  courseFindFirst: vi.fn(),
  occasionCreate: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    course: { findFirst: mocks.courseFindFirst },
    courseOccasion: { create: mocks.occasionCreate },
    auditLog: { create: mocks.auditCreate },
    $transaction: mocks.transaction,
  },
}));

import { POST } from "./route";

const courseId = "clh1234567890123456789012";

function request(body: unknown) {
  return new Request("http://localhost/api/admin/courses/occasions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  courseId,
  startsAt: "2026-11-01T08:00:00.000Z",
  endsAt: "2026-11-01T12:00:00.000Z",
  venueName: "Makina",
  venueAddress: "Testvägen 1",
  capacity: 16,
  language: "sv",
};

describe("admin course occasions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.courseFindFirst.mockResolvedValue({
      id: courseId,
      kind: "RISK1",
      productId: "product-1",
    });
    mocks.occasionCreate.mockResolvedValue({ id: "occasion-1" });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        courseOccasion: { create: mocks.occasionCreate },
        auditLog: { create: mocks.auditCreate },
      }),
    );
  });

  it("parses before authenticating", async () => {
    const response = await POST(request({ ...validBody, capacity: 0 }));
    expect(response.status).toBe(400);
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("requires ADMIN before looking up the course", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });
    const response = await POST(request(validBody));
    expect(response.status).toBe(403);
    expect(mocks.courseFindFirst).not.toHaveBeenCalled();
  });

  it("verifies the linked course and writes an audit log", async () => {
    const response = await POST(request(validBody));
    expect(response.status).toBe(201);
    expect(mocks.courseFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: courseId,
        kind: { in: ["RISK1", "RISK2"] },
        product: { kind: "COURSE_SEAT" },
      }),
    }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        actorId: "admin-1",
        action: "courseOccasion.create",
        entityType: "CourseOccasion",
      }),
    }));
  });
});
