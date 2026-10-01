import { describe, expect, it } from "vitest";

import { benefitItems } from "./benefits";

const lesson = {
  kind: "SINGLE_LESSON",
  priceOre: 79900,
  includesRisk1: false,
  includesRisk2: false,
};

describe("benefitItems", () => {
  it("always includes the standing facts and omits products that do not exist", () => {
    expect(benefitItems({ bookingEnabled: false, products: [lesson] }).map((item) => item.id)).toEqual([
      "language",
      "pickup",
      "lesson",
      "prices",
      "payment",
      "local",
    ]);
  });

  it("adds a priced test lesson, risk and guarantee only from real products", () => {
    const items = benefitItems({
      bookingEnabled: true,
      hasRiskCourse: false,
      products: [
        lesson,
        { kind: "TEST_LESSON", priceOre: 50000, includesRisk1: false, includesRisk2: false },
        { kind: "PACKAGE", priceOre: 1, includesRisk1: true, includesRisk2: false },
        { kind: "GUARANTEE", priceOre: 2, includesRisk1: false, includesRisk2: false },
      ],
    });
    expect(items.find((item) => item.id === "testLesson")).toMatchObject({
      size: "lg",
      priceOre: 50000,
    });
    expect(items.map((item) => item.id)).toContain("risk");
    expect(items.map((item) => item.id)).toContain("guarantee");
    expect(items.slice(-3).map((item) => item.id)).toEqual([
      "cancel",
      "reminder",
      "selfBook",
    ]);
  });
});
