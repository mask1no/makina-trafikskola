import { describe, expect, it } from "vitest";

import { fanOutPositions } from "./place-teachers";

const school = { lat: 59.52, lng: 17.91 };

describe("fanOutPositions", () => {
  it("keeps a lone marker on its real coordinate", () => {
    const [placed] = fanOutPositions([
      { id: "a", position: school },
    ]);
    expect(placed?.displayPosition).toEqual(school);
  });

  it("separates people who share one school", () => {
    const placed = fanOutPositions([
      { id: "a", position: school },
      { id: "b", position: school },
      { id: "c", position: { ...school } },
      { id: "d", position: school },
    ]);
    const keys = placed.map(
      (marker) =>
        `${marker.displayPosition.lat.toFixed(5)}:${marker.displayPosition.lng.toFixed(5)}`,
    );
    expect(new Set(keys).size).toBe(4);
    for (const marker of placed) {
      expect(marker.displayPosition).not.toEqual(school);
    }
  });

  it("leaves markers at different places where they are", () => {
    const other = { lat: 59.33, lng: 18.07 };
    const placed = fanOutPositions([
      { id: "a", position: school },
      { id: "b", position: other },
    ]);
    expect(placed.find((marker) => marker.id === "a")?.displayPosition).toEqual(
      school,
    );
    expect(placed.find((marker) => marker.id === "b")?.displayPosition).toEqual(
      other,
    );
  });
});
