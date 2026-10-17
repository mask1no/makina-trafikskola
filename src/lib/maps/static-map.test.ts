import { describe, expect, it } from "vitest";

import { staticMapWithAreasUrl } from "./static-map";

const farsta = {
  type: "Polygon",
  coordinates: [[
    [18.05, 59.24],
    [18.12, 59.24],
    [18.12, 59.28],
    [18.05, 59.28],
    [18.05, 59.24],
  ]],
};

const vasby = {
  type: "Polygon",
  coordinates: [[
    [17.85, 59.5],
    [17.95, 59.5],
    [17.95, 59.55],
    [17.85, 59.55],
    [17.85, 59.5],
  ]],
};

describe("staticMapWithAreasUrl", () => {
  it("builds a Static Maps URL with filled gold paths for both areas", () => {
    const url = staticMapWithAreasUrl({
      apiKey: "test-key",
      areas: [
        { id: "a", name: "Farsta", boundary: farsta },
        { id: "b", name: "Upplands Väsby", boundary: vasby },
      ],
    });
    expect(url).toBeTruthy();
    expect(url).toContain("maps.googleapis.com/maps/api/staticmap");
    expect(url).toContain("path=");
    expect(url).toContain("fillcolor%3A0xF5B429");
    expect(url).toContain("key=test-key");
    expect(url?.match(/path=/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("returns null without a key or areas", () => {
    expect(staticMapWithAreasUrl({ apiKey: "", areas: [] })).toBeNull();
    expect(
      staticMapWithAreasUrl({
        apiKey: "k",
        areas: [{ id: "x", name: "X", boundary: null }],
      }),
    ).toBeNull();
  });
});
