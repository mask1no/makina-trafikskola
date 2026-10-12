import { describe, expect, it } from "vitest";

import {
  catalogueLessonValueOre,
  completedLessonPayOre,
} from "./places";

describe("admin place money", () => {
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
});
