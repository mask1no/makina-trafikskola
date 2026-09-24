import { defineRouting } from "next-intl/routing";

export const locales = ["sv", "en", "ti", "ar", "so"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "sv",
  localePrefix: "always",
  localeDetection: false,
});

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
