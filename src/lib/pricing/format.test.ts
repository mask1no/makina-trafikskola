import { describe, expect, it } from "vitest";

import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats whole kronor from integer öre with non-breaking spaces", () => {
    expect(formatPrice(1_845_000, "sv")).toBe("18\u00A0450\u00A0kr");
  });

  it("keeps öre and uses the locale decimal separator", () => {
    expect(formatPrice(123_45, "sv")).toBe("123,45\u00A0kr");
    expect(formatPrice(123_45, "en")).toBe("123.45\u00A0kr");
  });

  it("rejects non-integer amounts", () => {
    expect(() => formatPrice(12.5, "sv")).toThrow(
      "PRICE_MUST_BE_INTEGER_ORE",
    );
  });
});
