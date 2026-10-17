import { describe, expect, it } from "vitest";

import { currentTabHref } from "./current-tab";

const teacher = [
  { href: "/sv/larare-portal", exact: true },
  { href: "/sv/larare-portal?view=week", exact: true },
  { href: "/sv", exact: true },
];

const admin = [
  { href: "/sv/admin", exact: true },
  { href: "/sv/admin/calendar" },
  { href: "/sv/admin/students" },
];

describe("currentTabHref", () => {
  it("selects the teacher week tab only when that view is open", () => {
    expect(currentTabHref("/sv/larare-portal", "", teacher)).toBe(
      "/sv/larare-portal",
    );
    expect(currentTabHref("/sv/larare-portal", "view=week", teacher)).toBe(
      "/sv/larare-portal?view=week",
    );
    expect(currentTabHref("/sv/larare-portal", "view=office", teacher)).toBe(
      null,
    );
  });

  it("does not keep the admin overview selected on a deeper screen", () => {
    expect(currentTabHref("/sv/admin", "", admin)).toBe("/sv/admin");
    expect(currentTabHref("/sv/admin/calendar", "", admin)).toBe(
      "/sv/admin/calendar",
    );
    expect(currentTabHref("/sv/admin/students", "", admin)).toBe(
      "/sv/admin/students",
    );
    expect(currentTabHref("/sv/admin/produkter", "", admin)).toBe(null);
  });
});
