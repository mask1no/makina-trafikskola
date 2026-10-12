import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: { order: { findFirst: mocks.findFirst } },
}));

import { GET } from "./route";

const ORDER_ID = "clorder000000000000000001";
const STUDENT_ID = "clstudent0000000000000001";

describe("student order status polling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: { id: STUDENT_ID, role: "STUDENT" },
    });
  });

  it("returns only the caller's order status for live polling", async () => {
    mocks.findFirst.mockResolvedValue({
      id: ORDER_ID,
      status: "PENDING",
      payment: { status: "PENDING" },
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: ORDER_ID }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: ORDER_ID,
      status: "PENDING",
      paymentStatus: "PENDING",
    });
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: ORDER_ID,
        studentId: STUDENT_ID,
      },
      select: {
        id: true,
        status: true,
        payment: { select: { status: true } },
      },
    });
  });
});
