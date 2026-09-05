"use client";

import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("language");

  return (
    <label className="relative inline-flex min-h-11 items-center text-sm font-semibold">
      <span className="sr-only">{t("label")}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute start-3 size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21M12 3C9.8 5.5 8.7 8.5 8.7 12S9.8 18.5 12 21" />
      </svg>
      <select
        value={currentLocale}
        aria-label={t("label")}
        className="min-h-11 max-w-32 rounded-sm border border-surface-soft bg-surface-raised ps-9 pe-8 text-ink-inverse outline-none transition hover:border-ink-muted focus:border-accent"
        onChange={(event) =>
          router.replace(pathname, { locale: event.target.value as Locale })
        }
      >
        {locales.map((locale) => (
          <option className="bg-surface text-ink-inverse" value={locale} key={locale}>
            {t(locale)}
          </option>
        ))}
      </select>
    </label>
  );
}
