export type Product = {
  id: string;
  kind: "SINGLE_LESSON" | "TEST_LESSON";
  active: boolean;
  lessonMinutes: number;
  name: string;
  priceLabel: string;
};

export type PackageOffer = {
  name: string;
  priceLabel: string;
  href: string;
};

export type Location = {
  id: string;
  name: string;
  city: string;
  status: "ACTIVE" | "COMING_SOON";
  officeAddress: string | null;
  lat: number;
  lng: number;
  boundary: unknown;
};

export type Teacher = {
  id: string;
  name: string;
  languages: string[];
  locationIds: string[];
  transmissions: string[];
  markers: { lat: number; lng: number }[];
};

export type Slot = { startsAt: string; endsAt: string };

export type Booking = {
  id: string;
  startsAt: string;
  holdExpiresAt: string | null;
  creditCharged: boolean;
};

export type Gearbox = "MANUAL" | "AUTOMATIC";
export type MeetMode = "pickup" | "office";

export type BookingState = {
  step: number;
  areaId: string;
  meet: MeetMode;
  gearbox: Gearbox | "";
  pickupAddress: string;
  pickupCoordinates: { lat: number; lng: number } | null;
  teacherId: string;
  slots: Slot[];
  previews: Record<string, Slot[]>;
  selectedDate: string;
  selectedSlot: string;
  loadingSlots: boolean;
  weekOpen: boolean;
  authenticated: boolean;
  busy: boolean;
  error: string;
  booking: Booking | null;
  paymentUnavailable: boolean;
  termsAccepted: boolean;
  withdrawalAcknowledged: boolean;
};

export type BookingAction =
  | { type: "patch"; patch: Partial<BookingState> }
  | { type: "step"; update: (current: number) => number }
  | { type: "pickupTyped"; value: string }
  | { type: "pickupSelected"; value: string; coordinates: { lat: number; lng: number } };

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  if (action.type === "pickupTyped") {
    return {
      ...state,
      pickupAddress: action.value,
      pickupCoordinates: null,
    };
  }
  if (action.type === "pickupSelected") {
    return {
      ...state,
      pickupAddress: action.value,
      pickupCoordinates: action.coordinates,
    };
  }
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
  const activeAreas = input.locations.filter((location) => location.status === "ACTIVE");
  const areaId =
    initialTeacher?.locationIds.find((locationId) =>
      activeAreas.some((location) => location.id === locationId),
    ) ??
    activeAreas[0]?.id ??
    "";
  const gearbox = (initialTeacher?.transmissions.find(
    (value): value is Gearbox => value === "MANUAL" || value === "AUTOMATIC",
  ) ?? "") as Gearbox | "";
  return {
    step: initialTeacher && areaId && gearbox ? 3 : 0,
    areaId,
    meet: "pickup",
    gearbox,
    pickupAddress: "",
    pickupCoordinates: null,
    teacherId: input.initialTeacherId ?? "",
    slots: [],
    previews: {},
    selectedDate: "",
    selectedSlot: "",
    loadingSlots: false,
    weekOpen: false,
    authenticated: input.initiallyAuthenticated,
    busy: false,
    error: "",
    booking: null,
    paymentUnavailable: false,
    termsAccepted: false,
    withdrawalAcknowledged: false,
  };
}
