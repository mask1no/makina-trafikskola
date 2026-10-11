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
      className="fixed inset-x-3 bottom-[calc(var(--tab-bar-height)+var(--safe-bottom)+0.75rem)] z-50 mx-auto flex max-w-2xl flex-col gap-3 rounded-md border border-[var(--line)] bg-card p-3 text-ink shadow-float sm:inset-x-4 sm:flex-row sm:items-center md:bottom-4"
    >
      <div className="min-w-0 flex-1">
        <h2 className="sr-only">{t("title")}</h2>
        <p className="text-small leading-5 text-ink-muted">
          {t("description")}{" "}
          <Link className="font-bold text-ink underline underline-offset-4" href={`/${locale}/cookies`}>
            {t("readMore")}
          </Link>
        </p>
      </div>
      <form action={saveCookieConsent} className="shrink-0">
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          name="consent"
          value="necessary"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-surface px-5 text-small font-bold text-ink-inverse shadow-soft"
        >
          {t("ok")}
        </button>
      </form>
    </aside>
  );
}
