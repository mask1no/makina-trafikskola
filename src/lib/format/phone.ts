function compactPhone(phone: string) {
  return phone.trim().replace(/[^\d+]/g, "");
}

export function telHref(phone: string) {
  const digits = compactPhone(phone);
  if (!digits) return "tel:";
  if (digits.startsWith("+") || digits.startsWith("0")) return `tel:${digits}`;
  return `tel:${phone.trim()}`;
}

/** National Swedish grouping when the number is a +46 or 0-prefixed number. */
export function displayPhone(phone: string) {
  const digits = compactPhone(phone);
  const local = digits.startsWith("+46")
    ? `0${digits.slice(3)}`
    : digits.startsWith("0")
      ? digits
      : null;

  if (local && /^07\d{8}$/.test(local)) {
    return `${local.slice(0, 3)}-${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
  }

  return phone.trim();
}
