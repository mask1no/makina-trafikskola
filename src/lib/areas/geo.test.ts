import { describe, expect, it } from "vitest";

import { boundaryLatLngs, pointInGeoJson } from "./geo";

const square = {
  type: "Polygon",
  coordinates: [[
    [18, 59],
    [18.2, 59],
    [18.2, 59.2],
    [18, 59.2],
    [18, 59],
  ]],
};

describe("pointInGeoJson", () => {
  it("accepts a point inside a polygon and rejects one outside", () => {
    expect(pointInGeoJson({ lng: 18.1, lat: 59.1 }, square)).toBe(true);
    expect(pointInGeoJson({ lng: 17, lat: 59.1 }, square)).toBe(false);
  });

  it("turns a polygon ring into map positions", () => {
    expect(boundaryLatLngs(square)[0]?.[0]).toEqual({ lat: 59, lng: 18 });
  });
});
