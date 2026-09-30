import { describe, expect, it } from "vitest";

import { formatPrice, showPerLessonPrice, showValidity } from "./format";

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

describe("showPerLessonPrice", () => {
  const lesson = {
    lessonCredits: 3,
    kind: "PACKAGE",
    includesTheory: false,
    includesRisk1: false,
    includesRisk2: false,
  };

  it("shows a per-lesson price only for plain lesson products", () => {
    expect(showPerLessonPrice(lesson)).toBe(true);
    expect(showPerLessonPrice({ ...lesson, kind: "SINGLE_LESSON" })).toBe(true);
    expect(showPerLessonPrice({ ...lesson, kind: "TEST_LESSON" })).toBe(true);
  });

  it("hides it when the product includes more than lessons or has no credits", () => {
    expect(showPerLessonPrice({ ...lesson, includesTheory: true })).toBe(false);
    expect(showPerLessonPrice({ ...lesson, includesRisk1: true })).toBe(false);
    expect(showPerLessonPrice({ ...lesson, includesRisk2: true })).toBe(false);
    expect(showPerLessonPrice({ ...lesson, lessonCredits: 0 })).toBe(false);
    expect(showPerLessonPrice({ ...lesson, kind: "GUARANTEE" })).toBe(false);
    expect(showPerLessonPrice({ ...lesson, kind: "COURSE_SEAT" })).toBe(false);
    expect(showPerLessonPrice({ ...lesson, kind: "THEORY_ACCESS" })).toBe(false);
  });
});

describe("showValidity", () => {
  it("shows validity for lesson credits and guarantees only", () => {
    expect(showValidity("PACKAGE")).toBe(true);
    expect(showValidity("SINGLE_LESSON")).toBe(true);
    expect(showValidity("TEST_LESSON")).toBe(true);
    expect(showValidity("GUARANTEE")).toBe(true);
    expect(showValidity("COURSE_SEAT")).toBe(false);
    expect(showValidity("THEORY_ACCESS")).toBe(false);
  });
});
