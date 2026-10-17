import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    theoryAccess: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  };
  return {
    auth: vi.fn(),
    findStudent: vi.fn(),
    transaction: vi.fn(),
    tx,
  };
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findFirst: mocks.findStudent },
    $transaction: mocks.transaction,
  },
}));

import { POST } from "./route";

const STUDENT_ID = "clstudent0000000000000001";
const ADMIN_ID = "cladmin000000000000000001";

function request(body: unknown) {
  return new Request(`http://localhost/api/admin/students/${STUDENT_ID}/theory`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("admin theory grant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: ADMIN_ID, role: "ADMIN" } });
    mocks.findStudent.mockResolvedValue({ id: STUDENT_ID });
    mocks.transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => Promise<unknown>) =>
        callback(mocks.tx),
    );
    mocks.tx.theoryAccess.findFirst.mockResolvedValue(null);
  });

  it("refuses a teacher", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "clteacher00000000000000001", role: "TEACHER" } });
    const response = await POST(request({ action: "grant", note: "Old site" }), {
      params: Promise.resolve({ id: STUDENT_ID }),
    });
    expect(response.status).toBe(403);
    expect(mocks.findStudent).not.toHaveBeenCalled();
  });

  it("grants lifetime theory and writes an audit note", async () => {
    const response = await POST(request({ action: "grant", note: "Paid on the old site" }), {
      params: Promise.resolve({ id: STUDENT_ID }),
    });
    expect(response.status).toBe(200);
    expect(mocks.tx.theoryAccess.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: STUDENT_ID,
        expiresAt: null,
      }),
    });
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: ADMIN_ID,
        action: "theory.grant",
        after: { note: "Paid on the old site", action: "grant" },
      }),
    });
  });

  it("does not create a second theory row when access is already active", async () => {
    mocks.tx.theoryAccess.findFirst.mockResolvedValue({ expiresAt: null });
    const response = await POST(request({ action: "grant", note: "Again" }), {
      params: Promise.resolve({ id: STUDENT_ID }),
    });
    expect(await response.json()).toEqual({ status: "already_active" });
    expect(mocks.tx.theoryAccess.create).not.toHaveBeenCalled();
  });
});
