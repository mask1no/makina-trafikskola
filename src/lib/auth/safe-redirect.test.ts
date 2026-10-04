import { describe, expect, it } from "vitest";

import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  it("accepts only paths under the requested supported locale", () => {
    expect(safeRedirect("/en/mina-sidor?tab=1", "en")).toBe(
      "/en/mina-sidor?tab=1",
    );
    expect(safeRedirect("/sv/mina-sidor", "en")).toBe("/en/mina-sidor");
  });

  it.each([
    "/\t/evil.com",
    "/%09/evil.com",
    "/%2F%2Fevil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "//evil.com",
    "/en\\evil",
  ])("rejects unsafe destination %s", (input) => {
    expect(safeRedirect(input, "en")).toBe("/en/mina-sidor");
  });

  it("rejects malformed encoding and oversized values", () => {
    expect(safeRedirect("/en/%", "en")).toBe("/en/mina-sidor");
    expect(safeRedirect(`/en/${"a".repeat(513)}`, "en")).toBe(
      "/en/mina-sidor",
    );
  });
});
