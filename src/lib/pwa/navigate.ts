export const PWA_LOCALES = ["sv", "en", "ti", "ar", "am", "so"] as const;

export function serviceWorkerShouldHandle(request: {
  mode: string;
  pathname: string;
}) {
  if (request.mode !== "navigate") return false;
  if (request.pathname.startsWith("/api/")) return false;
  if (request.pathname.includes("/logga-in")) return false;
  return true;
}

export function offlineLocale(pathname: string) {
  const locale = pathname.split("/")[1] ?? "";
  return (PWA_LOCALES as readonly string[]).includes(locale) ? locale : "sv";
}
