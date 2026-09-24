export function bookingEnabled() {
  return process.env.BOOKING_ENABLED === "1";
}

export function instructorsEnabled() {
  return process.env.INSTRUCTORS_ENABLED === "1";
}
