import { describe, expect, it } from "vitest";

import { backupAgeHours, canonicalUrlStatus } from "./readiness";

describe("canonicalUrlStatus", () => {
  it("requires https and the same canonical host", () => {
    expect(
      canonicalUrlStatus(
        "https://www.makina.se",
        "https://www.makina.se",
      ).ok,
    ).toBe(true);
    expect(
      canonicalUrlStatus("http://www.makina.se", "https://www.makina.se").ok,
    ).toBe(false);
    expect(
      canonicalUrlStatus("https://makina.se", "https://www.makina.se").ok,
    ).toBe(false);
  });
});

describe("backupAgeHours", () => {
  it("returns an absolute age in hours without going below zero", () => {
    const now = new Date("2026-10-03T12:00:00.000Z");
    expect(
      backupAgeHours(new Date("2026-10-02T10:00:00.000Z"), now),
    ).toBe(26);
    expect(
      backupAgeHours(new Date("2026-10-03T13:00:00.000Z"), now),
    ).toBe(0);
  });
});
