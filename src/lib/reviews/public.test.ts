import { describe, expect, it } from "vitest";

import { MIN_PUBLIC_REVIEWS, shouldShowPublicReviews } from "@/lib/reviews/public";

describe("shouldShowPublicReviews", () => {
  it("returns false below the threshold", () => {
    expect(shouldShowPublicReviews(MIN_PUBLIC_REVIEWS - 1)).toBe(false);
  });

  it("returns true at and above the threshold", () => {
    expect(shouldShowPublicReviews(MIN_PUBLIC_REVIEWS)).toBe(true);
    expect(shouldShowPublicReviews(MIN_PUBLIC_REVIEWS + 1)).toBe(true);
  });
});
