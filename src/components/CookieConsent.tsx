import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { saveCookieConsent } from "@/app/[locale]/cookie-actions";

export async function CookieConsent({ locale }: { locale: string }) {
  if ((await cookies()).has("makina-cookie-consent")) return null;
  const t = await getTranslations("cookieConsent");

  return (
    <aside
      aria-label={t("title")}
      className="fixed inset-x-4 bottom-20 z-50 ms-auto me-auto max-w-3xl rounded-lg border border-surface-soft bg-surface p-5 text-ink-inverse shadow-float sm:p-6 md:bottom-4"
    >
      <h2 className="text-lg font-extrabold tracking-tight">{t("title")}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-inverse-muted">
        {t("description")}{" "}
        <Link className="font-bold text-ink-inverse underline underline-offset-4" href={`/${locale}/cookies`}>
          {t("readMore")}
        </Link>
      </p>
      <form action={saveCookieConsent} className="mt-5 flex flex-wrap gap-3">
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          name="consent"
          value="necessary"
          className="min-h-11 rounded-sm border border-ink-muted px-4 text-sm font-bold transition hover:border-card hover:bg-surface-raised"
        >
          {t("necessary")}
        </button>
        <button
          type="submit"
          name="consent"
          value="accepted"
          className="min-h-11 rounded-sm border border-accent bg-accent px-4 text-sm font-bold text-accent-ink shadow-soft transition hover:border-accent-hover hover:bg-accent-hover"
        >
          {t("accept")}
        </button>
      </form>
    </aside>
  );
}
