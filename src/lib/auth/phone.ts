/**
 * Normalize user-entered phone numbers to E.164.
 * Swedish local numbers (07…) become +46…; already-international
 * numbers are cleaned. Returns null when the value is not usable.
 */
export function normalizePhoneToE164(input: string): string | null {
  let raw = input.trim().replace(/[\s\-().]/g, "");
  if (!raw) return null;

  if (raw.startsWith("00")) {
    raw = `+${raw.slice(2)}`;
  }

  if (/^0[1-9]\d{6,12}$/.test(raw)) {
    raw = `+46${raw.slice(1)}`;
  } else if (/^46\d{7,12}$/.test(raw)) {
    raw = `+${raw}`;
  }

  // +46 070… and +4607… are the same Swedish number as +467…
  if (raw.startsWith("+460")) {
    raw = `+46${raw.slice(4)}`;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(raw)) {
    return null;
  }

  return raw;
}

/** Swedish mobiles only. Accepts 070…, 70…, 0046… and +46… */
export function normalizeSwedishPhone(input: string): string | null {
  const compact = input.trim().replace(/[\s\-().]/g, "");
  const withTrunk = /^7\d{7,11}$/.test(compact) ? `0${compact}` : input;
  const phone = normalizePhoneToE164(withTrunk);
  if (!phone?.startsWith("+46")) return null;
  return phone;
}
