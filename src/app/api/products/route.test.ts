import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    product: { findMany: mocks.findMany },
  },
}));

import { GET } from "./route";

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMany.mockResolvedValue([]);
  });

  it("only queries active products", async () => {
    const response = await GET(new Request("http://localhost/api/products?locale=sv"));

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } }),
    );
  });

  it("rejects unsupported locales before querying", async () => {
    const response = await GET(new Request("http://localhost/api/products?locale=de"));

    expect(response.status).toBe(400);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
