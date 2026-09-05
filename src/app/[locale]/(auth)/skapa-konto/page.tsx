import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { AuthForm } from "../AuthForm";

export default async function RegisterPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const [t, authT] = await Promise.all([
    getTranslations("auth.register"),
    getTranslations("auth"),
  ]);
  return (
    <div className="site-container py-8 sm:py-12 lg:py-16">
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card lg:grid lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden bg-surface p-10 text-ink-inverse lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-bold text-ink-muted">{authT("context.eyebrow")}</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              {authT("context.title")}
            </h2>
            <ul className="mt-6 grid gap-3 text-sm leading-6 text-ink-muted">
              <li>{authT("context.bookings")}</li>
              <li>{authT("context.balance")}</li>
              <li>{authT("context.messages")}</li>
            </ul>
          </div>
          <Image
            src="/illustration-auth.svg"
            alt=""
            width={520}
            height={360}
            className="rtl-no-mirror mt-10 h-auto w-full"
          />
        </aside>
        <main className="p-5 sm:p-8 lg:p-12">
          <p className="text-sm font-bold text-ink-muted">{authT("secure")}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 leading-7 text-ink-muted">{t("description")}</p>
          <div className="mt-8">
            <AuthForm locale={params.locale} mode="register" />
          </div>
        </main>
      </div>
      <p className="mx-auto mt-5 max-w-2xl text-center text-sm text-ink-muted">
        {authT("support")}
      </p>
    </div>
  );
}
