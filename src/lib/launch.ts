export type TheoryMode = "off" | "free" | "full";

export function bookingEnabled() {
  return process.env.BOOKING_ENABLED === "1";
}

export function instructorsEnabled() {
  return process.env.INSTRUCTORS_ENABLED === "1";
}

export function theoryMode(
  environment: Record<string, string | undefined> = process.env,
): TheoryMode {
  const value = environment.THEORY_MODE;
  if (value === "off" || value === "full") return value;
  return "free";
}

export function theoryNavVisible(
  environment: Record<string, string | undefined> = process.env,
) {
  return theoryMode(environment) !== "off";
}

export function theorySalesOpen(
  environment: Record<string, string | undefined> = process.env,
) {
  return theoryMode(environment) === "full";
}
