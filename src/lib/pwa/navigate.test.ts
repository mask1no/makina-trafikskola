import { describe, expect, it } from "vitest";

import { offlineLocale, serviceWorkerShouldHandle } from "./navigate";

describe("service worker navigation policy", () => {
  it("leaves API calls and login on the network", () => {
    expect(serviceWorkerShouldHandle({ mode: "navigate", pathname: "/api/bookings" })).toBe(false);
    expect(serviceWorkerShouldHandle({ mode: "navigate", pathname: "/sv/logga-in" })).toBe(false);
    expect(serviceWorkerShouldHandle({ mode: "cors", pathname: "/sv" })).toBe(false);
  });

  it("may fall back only for ordinary page navigations", () => {
    expect(serviceWorkerShouldHandle({ mode: "navigate", pathname: "/sv/boka" })).toBe(true);
    expect(offlineLocale("/am/boka")).toBe("am");
    expect(offlineLocale("/unknown")).toBe("sv");
  });
});
