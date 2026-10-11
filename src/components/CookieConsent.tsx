import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { saveCookieConsent } from "@/app/[locale]/cookie-actions";

export async function CookieConsent({ locale }: { locale: string }) {
  if ((await cookies()).has("makina-cookie-consent")) return null;
  const [t, privacy] = await Promise.all([
    getTranslations("cookieConsent"),
    getTranslations("legal.privacy"),
  ]);

  return (
    <aside
      role="region"
      aria-label={t("title")}
      className="fixed inset-x-3 bottom-[calc(var(--tab-bar-height)+var(--safe-bottom)+0.75rem)] z-50 mx-auto max-w-3xl overflow-hidden rounded-lg border border-ink-inverse/15 bg-surface text-ink-inverse shadow-float sm:inset-x-4 md:bottom-4"
    >
      <div className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-5">
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center rounded-md bg-accent text-accent-ink"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 3a9 9 0 1 0 9 9c-4.5.4-6.8-2.1-6.4-6.4A4.8 4.8 0 0 1 12 3Z" />
            <circle cx="8.5" cy="11" r=".8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="16" r=".8" fill="currentColor" stroke="none" />
            <circle cx="7.5" cy="16.5" r=".8" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <div className="min-w-0">
          <h2 className="font-black">{t("title")}</h2>
          <p className="mt-1 text-small leading-6 text-ink-inverse-muted">
            {t("description")}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-small">
            <Link className="font-bold underline underline-offset-4" href={`/${locale}/cookies`}>
              {t("readMore")}
            </Link>
            <Link className="font-bold underline underline-offset-4" href={`/${locale}/integritet`}>
              {privacy("title")}
            </Link>
          </div>
        </div>
        <form action={saveCookieConsent} className="shrink-0">
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            name="consent"
            value="necessary"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-accent px-5 text-small font-extrabold text-accent-ink shadow-soft sm:w-auto"
          >
            {t("necessary")}
          </button>
        </form>
      </div>
    </aside>
  );
}
