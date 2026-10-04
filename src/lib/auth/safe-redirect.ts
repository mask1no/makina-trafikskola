import { isLocale, type Locale } from "@/i18n/routing";

function validPath(value: string, locale: Locale) {
  if (!value || value.length > 512) return false;
  if (/[\u0000-\u001f\u007f\s\\]/.test(value)) return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  return value === `/${locale}` || value.startsWith(`/${locale}/`);
}

export function safeRedirect(input: string | null | undefined, locale: string) {
  const supportedLocale: Locale = isLocale(locale) ? locale : "sv";
  const fallback = `/${supportedLocale}/mina-sidor`;
  if (!input || !validPath(input, supportedLocale)) return fallback;
  try {
    const decoded = decodeURIComponent(input);
    return validPath(decoded, supportedLocale) ? input : fallback;
  } catch {
    return fallback;
  }
}
