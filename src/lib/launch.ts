export type TheoryMode = "off" | "free" | "full";

export function bookingEnabled() {
  return process.env.BOOKING_ENABLED === "1";
}

export function instructorsEnabled() {
  return process.env.INSTRUCTORS_ENABLED === "1";
}

export function risk2Confirmed(
  environment: Record<string, string | undefined> = process.env,
) {
  return environment.RISK2_CONFIRMED === "1";
}

export function guaranteeConfirmed(
  environment: Record<string, string | undefined> = process.env,
) {
  return environment.GUARANTEE_CONFIRMED === "1";
}

export function productLaunchApproved(
  product: { kind: string; includesRisk2: boolean },
  environment: Record<string, string | undefined> = process.env,
) {
  if (product.kind === "GUARANTEE" && !guaranteeConfirmed(environment)) {
    return false;
  }
  if (product.includesRisk2 && !risk2Confirmed(environment)) {
    return false;
  }
  return true;
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
