import { getTranslations } from "next-intl/server";

import { ForgotPasswordForm } from "../auth-ui";

export default async function ForgotPasswordPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const [t, authT] = await Promise.all([
    getTranslations("auth.forgot"),
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
        <div className="mx-auto mt-8 w-full max-w-[420px] rounded-lg border border-border bg-card p-5 sm:p-6">
          <ForgotPasswordForm locale={params.locale} />
        </div>
      </div>
    </div>
  );
}
