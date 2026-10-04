import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
  findMany: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

vi.mock("@/lib/db", () => ({
  db: {
    review: {
      aggregate: mocks.aggregate,
      findMany: mocks.findMany,
    },
  },
}));

import {
  MIN_PUBLIC_REVIEWS,
  fetchPublishedReviewSummary,
  shouldShowPublicReviews,
} from "@/lib/reviews/public";

describe("shouldShowPublicReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false below the threshold", () => {
    expect(shouldShowPublicReviews(MIN_PUBLIC_REVIEWS - 1)).toBe(false);
  });

  it("returns true at and above the threshold", () => {
    expect(shouldShowPublicReviews(MIN_PUBLIC_REVIEWS)).toBe(true);
    expect(shouldShowPublicReviews(MIN_PUBLIC_REVIEWS + 1)).toBe(true);
  });

  it("returns an empty summary when the review query fails", async () => {
    mocks.aggregate.mockRejectedValue(new Error("db offline"));

    const first = await fetchPublishedReviewSummary();
    const second = await fetchPublishedReviewSummary();

    expect(first).toEqual({ count: 0, average: 0, latest: [] });
    expect(second).toEqual({ count: 0, average: 0, latest: [] });
    expect(mocks.captureException).toHaveBeenCalledTimes(1);
  });
});
