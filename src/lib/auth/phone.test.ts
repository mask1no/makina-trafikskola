import { describe, expect, it } from "vitest";

import { normalizePhoneToE164, normalizeSwedishPhone } from "./phone";

describe("normalizePhoneToE164", () => {
  it("keeps valid E.164 numbers", () => {
    expect(normalizePhoneToE164("+46701234567")).toBe("+46701234567");
  });

  it("converts Swedish local numbers", () => {
    expect(normalizePhoneToE164("0701234567")).toBe("+46701234567");
    expect(normalizePhoneToE164("070-123 45 67")).toBe("+46701234567");
    expect(normalizePhoneToE164("(070) 123-45-67")).toBe("+46701234567");
  });

  it("accepts 00 and bare country-code forms", () => {
    expect(normalizePhoneToE164("0046701234567")).toBe("+46701234567");
    expect(normalizePhoneToE164("46701234567")).toBe("+46701234567");
  });

  it("accepts Swedish mobiles and rejects other countries", () => {
    expect(normalizeSwedishPhone("0701234567")).toBe("+46701234567");
    expect(normalizeSwedishPhone("701234567")).toBe("+46701234567");
    expect(normalizeSwedishPhone("+46 70 123 45 67")).toBe("+46701234567");
    expect(normalizeSwedishPhone("+14155552671")).toBeNull();
  });

  it("rejects incomplete or invalid values", () => {
    expect(normalizePhoneToE164("")).toBeNull();
    expect(normalizePhoneToE164("123")).toBeNull();
    expect(normalizePhoneToE164("+0123")).toBeNull();
  });
});
