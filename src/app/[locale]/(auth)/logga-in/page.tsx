import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { googleSignInEnabled } from "@/lib/auth/google";
import { safeRedirect } from "@/lib/auth/safe-redirect";

import { LoginForm } from "../auth-ui";

export default async function LoginPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
      error?: string;
      next?: string;
      callbackUrl?: string;
    }>;
  }
) {
  await connection();
  const params = await props.params;
  const searchParams = await props.searchParams;
  if ((await auth())?.user) {
    redirect(
      safeRedirect(
        searchParams.next ?? searchParams.callbackUrl,
        params.locale,
      ),
    );
  }
  const [t, authT] = await Promise.all([
    getTranslations("auth.login"),
    getTranslations("auth"),
  ]);
  const errorKey =
    searchParams.error === "AccessDenied"
      ? "accessDenied"
      : searchParams.error === "Configuration"
        ? "configuration"
        : searchParams.error
          ? "default"
          : null;
  return (
    <div className="min-h-[70svh] bg-page">
      <div className="site-container max-w-md py-10 sm:py-16">
        <p className="brand-mark text-ink">{authT("context.eyebrow")}</p>
        <h1 className="mt-6 text-h2 font-black tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-[70ch] text-body leading-7 text-ink-muted">{t("description")}</p>
        {errorKey ? (
          <p role="alert" className="mt-4 rounded-sm border border-danger bg-danger-soft p-4 text-small text-danger">
            {authT(`oauthError.${errorKey}`)}
          </p>
        ) : null}
        <div className="mx-auto mt-8 w-full max-w-[420px] rounded-lg border border-border bg-card p-5 sm:p-6">
          <LoginForm
            locale={params.locale}
            googleEnabled={googleSignInEnabled()}
          />
        </div>
        <p className="mt-10 text-small leading-6 text-ink-muted">{authT("support")}</p>
      </div>
    </div>
  );
}
