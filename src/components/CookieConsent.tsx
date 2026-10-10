import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { saveCookieConsent } from "@/app/[locale]/cookie-actions";

export async function CookieConsent({ locale }: { locale: string }) {
  if ((await cookies()).has("makina-cookie-consent")) return null;
  const t = await getTranslations("cookieConsent");

  return (
    <aside
      role="region"
      aria-label={t("title")}
      className="fixed inset-x-3 bottom-[calc(var(--tab-bar-height)+var(--safe-bottom)+0.75rem)] z-50 mx-auto grid max-w-3xl gap-3 rounded-lg border border-[var(--line)] bg-card p-3 text-ink shadow-float sm:inset-x-4 md:bottom-4 md:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.8fr)] md:p-4"
    >
      <div className="rounded-md bg-page p-4 sm:p-5">
        <h2 className="text-lg font-extrabold tracking-tight">{t("title")}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {t("description")}{" "}
          <Link className="font-bold text-ink underline underline-offset-4" href={`/${locale}/cookies`}>
            {t("readMore")}
          </Link>
        </p>
      </div>
      <form action={saveCookieConsent} className="flex items-stretch rounded-md bg-accent p-4 sm:p-5">
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          name="consent"
          value="necessary"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-surface px-4 text-sm font-bold text-ink-inverse shadow-soft"
        >
          {t("ok")}
        </button>
      </form>
    </aside>
  );
}
