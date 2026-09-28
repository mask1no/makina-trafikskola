import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
  hasTheoryAccess: vi.fn(),
  presentQuestion: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: { theoryQuestion: { findMany: mocks.findMany } },
}));
vi.mock("@/lib/theory/access", () => ({
  hasTheoryAccess: mocks.hasTheoryAccess,
  presentQuestion: mocks.presentQuestion,
}));

import { GET } from "./route";

describe("theory question access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(null);
    mocks.findMany.mockResolvedValue([{ id: "free-question" }]);
    mocks.presentQuestion.mockReturnValue({ id: "free-question" });
  });

  it("limits anonymous visitors to free questions", async () => {
    const response = await GET(
      new Request("http://localhost/api/theory/questions?locale=en"),
    );

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ active: true, isFree: true }),
      }),
    );
    await expect(response.json()).resolves.toEqual({
      mode: "study",
      access: "free",
      questions: [{ id: "free-question" }],
    });
  });

  it("allows paid students to fetch the active bank", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: "STUDENT" },
    });
    mocks.hasTheoryAccess.mockResolvedValue(true);

    const response = await GET(
      new Request(
        "http://localhost/api/theory/questions?locale=sv&category=del-1",
      ),
    );

    expect(mocks.hasTheoryAccess).toHaveBeenCalledWith(
      expect.anything(),
      "student-1",
      expect.any(Date),
    );
    const query = mocks.findMany.mock.calls[0]?.[0];
    expect(query.where).toEqual({
      active: true,
      category: { slug: "del-1" },
    });
    await expect(response.json()).resolves.toMatchObject({ access: "paid" });
  });

  it("rejects unsupported locales before querying content", async () => {
    const response = await GET(
      new Request("http://localhost/api/theory/questions?locale=de"),
    );

    expect(response.status).toBe(400);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
