"use client";

import { NextIntlClientProvider, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const messageLoaders = {
  ar: () => import("../../messages/ar.json"),
  en: () => import("../../messages/en.json"),
  so: () => import("../../messages/so.json"),
  sv: () => import("../../messages/sv.json"),
  ti: () => import("../../messages/ti.json"),
};

function ErrorContent({ reset }: { reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <main className="grid min-h-screen place-items-center bg-page p-6">
      <div className="max-w-md rounded-md border border-border bg-card p-6 text-center">
        <p role="alert">{t("UNKNOWN")}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 min-h-11 rounded-sm bg-accent px-5 font-bold text-accent-ink"
        >
          {t("UNKNOWN")}
        </button>
      </div>
    </main>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import("@sentry/nextjs").then((sdk) => sdk.captureException(error));
    }
  }, [error]);

  const locale =
    typeof document === "undefined"
      ? "sv"
      : document.documentElement.lang.split("-")[0];
  const selectedLocale =
    locale in messageLoaders ? (locale as keyof typeof messageLoaders) : "sv";
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    messageLoaders[selectedLocale]().then((module) => setMessages(module.default));
  }, [selectedLocale]);

  return (
    <html lang={selectedLocale} dir={selectedLocale === "ar" ? "rtl" : "ltr"}>
      <body>
        {messages ? (
          <NextIntlClientProvider locale={selectedLocale} messages={messages}>
            <ErrorContent reset={reset} />
          </NextIntlClientProvider>
        ) : null}
      </body>
    </html>
  );
}
