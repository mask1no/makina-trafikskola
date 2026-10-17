import { addDays } from "date-fns";

export function creditValidityDays(
  environment: { CREDIT_VALIDITY_DAYS?: string } = process.env,
) {
  const parsed = Number(environment.CREDIT_VALIDITY_DAYS ?? "365");
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 3650 ? parsed : 365;
}

export function adminCreditExpiresAt(delta: number, now: Date, days = creditValidityDays()) {
  if (delta <= 0) return null;
  return addDays(now, days);
}
