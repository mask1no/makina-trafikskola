/** Mask email for audit logs: a***@example.com */
export function maskEmail(email: string | null | undefined) {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 1) || "*";
  return `${head}***@${domain}`;
}

/** Mask E.164 phone: +4670*****67 */
export function maskPhone(phone: string | null | undefined) {
  if (!phone) return null;
  if (phone.length <= 6) return "***";
  return `${phone.slice(0, 5)}${"*".repeat(Math.max(2, phone.length - 7))}${phone.slice(-2)}`;
}

export function maskName(firstName: string, lastName: string) {
  const first = firstName.trim();
  const last = lastName.trim();
  return {
    firstName: first ? `${first.slice(0, 1)}***` : "",
    lastName: last ? `${last.slice(0, 1)}***` : "",
  };
}
