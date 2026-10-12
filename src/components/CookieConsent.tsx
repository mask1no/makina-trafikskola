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
      className="fixed inset-x-3 bottom-[calc(var(--tab-bar-height)+var(--safe-bottom)+0.75rem)] z-50 mx-auto max-w-3xl rounded-md border border-ink-inverse/15 bg-surface text-ink-inverse shadow-float sm:inset-x-4 md:bottom-4"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-5">
        <p className="min-w-0 flex-1 text-small leading-5 text-ink-inverse-muted">
          {t("description")}{" "}
          <Link
            className="font-bold text-ink-inverse underline underline-offset-4"
            href={`/${locale}/cookies`}
          >
            {t("readMore")}
          </Link>
        </p>
        <form action={saveCookieConsent} className="shrink-0">
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            name="consent"
            value="necessary"
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-5 text-small font-extrabold text-accent-ink shadow-soft"
          >
            {t("ok")}
          </button>
        </form>
      </div>
    </aside>
  );
}
