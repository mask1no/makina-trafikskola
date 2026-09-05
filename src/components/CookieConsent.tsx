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
      className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-3xl rounded-md border border-border bg-surface p-5 text-ink-inverse shadow-xl md:bottom-4"
    >
      <h2 className="text-lg font-bold">{t("title")}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        {t("description")}{" "}
        <Link className="font-bold underline" href={`/${locale}/cookies`}>
          {t("readMore")}
        </Link>
      </p>
      <form action={saveCookieConsent} className="mt-4 flex flex-wrap gap-3">
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          name="consent"
          value="necessary"
          className="min-h-11 rounded-sm border border-card/40 px-4 font-bold"
        >
          {t("necessary")}
        </button>
        <button
          type="submit"
          name="consent"
          value="accepted"
          className="min-h-11 rounded-sm bg-accent px-4 font-bold text-accent-ink"
        >
          {t("accept")}
        </button>
      </form>
    </aside>
  );
}
