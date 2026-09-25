export type Product = {
  id: string;
  kind: "SINGLE_LESSON" | "TEST_LESSON";
  active: boolean;
  lessonMinutes: number;
  name: string;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type Teacher = {
  id: string;
  name: string;
  languages: string[];
  locationIds: string[];
  markers: { lat: number; lng: number }[];
};

export type Slot = { startsAt: string; endsAt: string };

export type Booking = {
  id: string;
  startsAt: string;
  holdExpiresAt: string | null;
  creditCharged: boolean;
};

export type BookingKind = "single" | "credits" | "test";
export type PlaceMode = "school" | "pickup";

export type BookingState = {
  step: number;
  kind: BookingKind;
  placeMode: PlaceMode;
  locationId: string;
  pickupAddress: string;
  pickupCoordinates: { lat: number; lng: number } | null;
  language: string;
  teacherId: string;
  view: "list" | "map";
  slots: Slot[];
  selectedDate: string;
  selectedSlot: string;
  loadingSlots: boolean;
  authenticated: boolean;
  busy: boolean;
  error: string;
  booking: Booking | null;
  paymentUnavailable: boolean;
  creditBalance: number | null;
  loadingCredits: boolean;
  termsAccepted: boolean;
  withdrawalAcknowledged: boolean;
};

export type BookingAction =
  | { type: "patch"; patch: Partial<BookingState> }
  | { type: "step"; update: (current: number) => number };

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  if (action.type === "step") {
    return { ...state, step: action.update(state.step) };
  }
  return { ...state, ...action.patch };
}

export function initialBookingState(input: {
  locale: string;
  locations: Location[];
  teachers: Teacher[];
  initialTeacherId?: string;
  initiallyAuthenticated: boolean;
}): BookingState {
  const initialTeacher = input.teachers.find(
    (teacher) => teacher.id === input.initialTeacherId,
  );
  return {
    step: 0,
    kind: "single",
    placeMode: "school",
    locationId: input.locations[0]?.id ?? "",
    pickupAddress: "",
    pickupCoordinates: null,
    language: initialTeacher?.languages.includes(input.locale)
      ? input.locale
      : initialTeacher?.languages[0] ?? input.locale,
    teacherId: input.initialTeacherId ?? "",
    view: "list",
    slots: [],
    selectedDate: "",
    selectedSlot: "",
    loadingSlots: false,
    authenticated: input.initiallyAuthenticated,
    busy: false,
    error: "",
    booking: null,
    paymentUnavailable: false,
    creditBalance: null,
    loadingCredits: false,
    termsAccepted: false,
    withdrawalAcknowledged: false,
  };
}
