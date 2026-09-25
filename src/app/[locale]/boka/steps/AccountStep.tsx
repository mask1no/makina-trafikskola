"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { SignupForm } from "../../(auth)/auth-ui";

export function AccountStep({
  locale,
  googleEnabled,
  onAuthenticated,
}: {
  locale: string;
  googleEnabled: boolean;
  onAuthenticated: () => void | Promise<void>;
}) {
  const t = useTranslations("booking");
  return (
    <section>
      <h2 className="text-3xl font-black">{t("account.title")}</h2>
      <p className="mt-2 leading-7 text-ink-muted">{t("account.description")}</p>
      <div className="mt-6">
        <SignupForm
          locale={locale}
          googleEnabled={googleEnabled}
          onAuthenticated={onAuthenticated}
        />
      </div>
      <Link
        href={`/${locale}/logga-in?next=${encodeURIComponent(`/${locale}/boka`)}`}
        className="mt-4 flex min-h-11 items-center justify-center text-sm font-bold underline underline-offset-4"
      >
        {t("account.emailLink")}
      </Link>
    </section>
  );
}
