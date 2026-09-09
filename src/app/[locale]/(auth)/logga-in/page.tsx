import { getTranslations } from "next-intl/server";

import { AuthForm } from "../AuthForm";

export default async function LoginPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const [t, authT] = await Promise.all([
    getTranslations("auth.login"),
    getTranslations("auth"),
  ]);
  return (
    <div className="min-h-[70svh] bg-page">
      <div className="site-container max-w-md py-10 sm:py-16">
        <p className="brand-mark text-ink">{authT("context.eyebrow")}</p>
        <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 leading-7 text-ink-muted">{t("description")}</p>
        <div className="mt-8">
          <AuthForm locale={params.locale} mode="login" />
        </div>
        <p className="mt-10 text-sm leading-6 text-ink-muted">{authT("support")}</p>
      </div>
    </div>
  );
}
