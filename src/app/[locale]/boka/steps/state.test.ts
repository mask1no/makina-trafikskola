import { describe, expect, it } from "vitest";

import { bookingReducer, initialBookingState, type BookingState } from "./state";

function baseState(overrides: Partial<BookingState> = {}): BookingState {
  return {
    ...initialBookingState({
      locale: "sv",
      locations: [],
      teachers: [],
      initiallyAuthenticated: false,
    }),
    ...overrides,
  };
}

describe("booking pickup reducer", () => {
  it("clears coordinates when the user types pickup text", () => {
    const state = baseState({
      pickupAddress: "Centralvagen 5",
      pickupCoordinates: { lat: 59.33, lng: 18.07 },
    });
    const next = bookingReducer(state, {
      type: "pickupTyped",
      value: "Centralvagen 5, Upplands Vasby",
    });
    expect(next.pickupAddress).toBe("Centralvagen 5, Upplands Vasby");
    expect(next.pickupCoordinates).toBeNull();
  });

  it("sets both address and coordinates when a suggestion is selected", () => {
    const next = bookingReducer(baseState(), {
      type: "pickupSelected",
      value: "Centralvagen 5, 194 77 Upplands Vasby, Sweden",
      coordinates: { lat: 59.5181, lng: 17.9113 },
    });
    expect(next.pickupAddress).toBe(
      "Centralvagen 5, 194 77 Upplands Vasby, Sweden",
    );
    expect(next.pickupCoordinates).toEqual({ lat: 59.5181, lng: 17.9113 });
  });
});
