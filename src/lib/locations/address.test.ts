import { describe, expect, it } from "vitest";

import { isAddressConfirmed, publicAddress } from "./address";

describe("unconfirmed addresses", () => {
  it("hides addresses that start with TODO", () => {
    expect(isAddressConfirmed("TODO Centralvägen 5")).toBe(false);
    expect(isAddressConfirmed("  todo: confirm later")).toBe(false);
    expect(publicAddress("TODO Centralvägen 5")).toBeNull();
  });

  it("keeps confirmed addresses unchanged", () => {
    expect(isAddressConfirmed("Centralvägen 5")).toBe(true);
    expect(publicAddress("Centralvägen 5")).toBe("Centralvägen 5");
  });
});
