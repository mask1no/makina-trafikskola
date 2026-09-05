import { getTranslations } from "next-intl/server";

import { AuthForm } from "../AuthForm";

export default async function LoginPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations("auth.login");
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-black">{t("title")}</h1>
        <p className="mt-2 text-ink-muted">{t("description")}</p>
        <div className="mt-6">
          <AuthForm locale={params.locale} mode="login" />
        </div>
      </div>
    </div>
  );
}
