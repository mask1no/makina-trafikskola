import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    user: { findFirst: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  return {
    auth: vi.fn(),
    transaction: vi.fn(),
    tx,
  };
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: { $transaction: mocks.transaction },
}));

import { PATCH } from "./route";

const STUDENT_ID = "clstudent0000000000000001";
const ADMIN_ID = "cladmin000000000000000001";

function request(body: unknown) {
  return new Request(`http://localhost/api/admin/students/${STUDENT_ID}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("admin student edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: ADMIN_ID, role: "ADMIN" } });
    mocks.transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => Promise<unknown>) =>
        callback(mocks.tx),
    );
    mocks.tx.user.findFirst
      .mockResolvedValueOnce({
        id: STUDENT_ID,
        firstName: "Ada",
        lastName: "Student",
        email: "old@example.com",
        phone: "+46701111111",
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mocks.tx.user.update.mockResolvedValue({
      id: STUDENT_ID,
      firstName: "Ada",
      lastName: "Student",
      email: "new@example.com",
      phone: "+46702222222",
    });
  });

  it("normalises phone, updates fields and writes a masked audit log", async () => {
    const response = await PATCH(
      request({ email: "New@Example.com", phone: "0702222222" }),
      { params: Promise.resolve({ id: STUDENT_ID }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "new@example.com",
          phone: "+46702222222",
        }),
      }),
    );
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: ADMIN_ID,
        action: "admin.student_updated",
        before: expect.objectContaining({
          email: "o***@example.com",
          phone: expect.stringMatching(/^\+46/),
          firstName: "A***",
        }),
        after: expect.objectContaining({
          email: "n***@example.com",
          phone: expect.stringMatching(/^\+46/),
        }),
      }),
    });
  });

  it("forbids non-staff", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "clstudent0000000000000099", role: "STUDENT" },
    });
    const response = await PATCH(request({ firstName: "X" }), {
      params: Promise.resolve({ id: STUDENT_ID }),
    });
    expect(response.status).toBe(403);
  });
});

