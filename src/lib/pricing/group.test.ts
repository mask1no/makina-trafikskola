import { describe, expect, it } from "vitest";

import { groupProducts } from "./group";

const base = {
  includesTheory: false,
  includesRisk1: false,
  includesRisk2: false,
};

describe("groupProducts", () => {
  it("splits products into the public sections and drops empty ones", () => {
    const sections = groupProducts([
      { ...base, id: "theory", kind: "THEORY_ACCESS" },
      { ...base, id: "single", kind: "SINGLE_LESSON" },
      { ...base, id: "test", kind: "TEST_LESSON" },
      { ...base, id: "pack", kind: "PACKAGE" },
      { ...base, id: "risk", kind: "PACKAGE", includesRisk1: true },
      { ...base, id: "guarantee", kind: "GUARANTEE" },
      { ...base, id: "course", kind: "COURSE_SEAT" },
      { ...base, id: "unknown", kind: "OTHER" },
    ]);

    expect(sections.map((section) => section.key)).toEqual([
      "single",
      "packages",
      "intensive",
      "courses",
      "theory",
    ]);
    expect(sections[0]?.products.map((product) => product.id)).toEqual([
      "single",
      "test",
    ]);
    expect(sections[2]?.products.map((product) => product.id)).toEqual([
      "risk",
      "guarantee",
    ]);
  });

  it("omits a section that has no products", () => {
    expect(
      groupProducts([{ ...base, kind: "SINGLE_LESSON" }]).map(
        (section) => section.key,
      ),
    ).toEqual(["single"]);
  });
});
