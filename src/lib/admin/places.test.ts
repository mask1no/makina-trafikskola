import { describe, expect, it } from "vitest";

import {
  catalogueLessonValueOre,
  completedLessonPayOre,
  isSchoolLocation,
  netOre,
} from "./places";

describe("admin place money", () => {
  it("keeps payment totals in integer öre after refunds", () => {
    expect(
      netOre([
        { amountOre: 79900, refundedOre: 0 },
        { amountOre: 229900, refundedOre: 10000 },
      ]),
    ).toBe(299800);
  });

  it("sums instructor pay and skips missing rates", () => {
    expect(
      completedLessonPayOre([
        { payRateOre: 35000 },
        { payRateOre: null },
        { payRateOre: 35000 },
      ]),
    ).toBe(70000);
  });

  it("values completed lessons at the single-lesson price", () => {
    expect(catalogueLessonValueOre(4, 79900)).toBe(319600);
    expect(catalogueLessonValueOre(-1, 79900)).toBe(0);
  });

  it("hides fixture locations", () => {
    expect(isSchoolLocation("farsta")).toBe(true);
    expect(isSchoolLocation("webhook-fixture")).toBe(false);
  });
});
