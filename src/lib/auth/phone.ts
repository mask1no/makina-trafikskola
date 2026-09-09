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

  if (!/^\+[1-9]\d{7,14}$/.test(raw)) {
    return null;
  }

  return raw;
}

export const e164PhoneSchema = {
  regex: /^\+[1-9]\d{7,14}$/,
} as const;
