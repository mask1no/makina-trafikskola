import { describe, expect, it } from "vitest";

import { displayPhone, smsHref, telHref } from "./phone";

describe("phone links", () => {
  it("builds a tel href from spaced, dashed and E.164 numbers", () => {
    expect(telHref("070-097 04 83")).toBe("tel:0700970483");
    expect(telHref("+46 70 097 04 83")).toBe("tel:+46700970483");
    expect(telHref("")).toBe("tel:");
  });

  it("builds an sms href from spaced, dashed and E.164 numbers", () => {
    expect(smsHref("070-097 04 83")).toBe("sms:0700970483");
    expect(smsHref("+46 70 097 04 83")).toBe("sms:+46700970483");
    expect(smsHref("")).toBe("sms:");
  });

  it("displays Swedish mobiles in national groups", () => {
    expect(displayPhone("+46700970483")).toBe("070-097 04 83");
    expect(displayPhone("0700970483")).toBe("070-097 04 83");
    expect(displayPhone("070-097 04 83")).toBe("070-097 04 83");
    expect(displayPhone("+1 202 555 0100")).toBe("+1 202 555 0100");
  });
});
