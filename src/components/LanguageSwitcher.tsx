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
    <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
      <span className="sr-only">{t("label")}</span>
      <span aria-hidden="true">◎</span>
      <select
        value={currentLocale}
        aria-label={t("label")}
        className="min-h-11 rounded-sm border border-card/30 bg-surface px-3 text-ink-inverse"
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
