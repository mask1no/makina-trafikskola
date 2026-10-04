import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { db } from "@/lib/db";

import { VerifyPhoneForm } from "../auth-ui";

export default async function VerifyPhonePage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user.id) {
    redirect(`/${params.locale}/logga-in`);
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phoneVerifiedAt: true, googleSub: true },
  });
  if (!user?.googleSub) {
    redirect(`/${params.locale}/mina-sidor`);
  }
  if (user.phoneVerifiedAt) {
    redirect(safeRedirect(searchParams.next, params.locale));
  }

  const [t, authT] = await Promise.all([
    getTranslations("auth.verifyPhone"),
    getTranslations("auth"),
  ]);

  return (
    <div className="min-h-[70svh] bg-page">
      <div className="site-container max-w-md py-10 sm:py-16">
        <p className="brand-mark text-ink">{authT("context.eyebrow")}</p>
        <h1 className="mt-6 text-h2 font-black tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-[70ch] text-body leading-7 text-ink-muted">{t("description")}</p>
        <div className="mx-auto mt-8 w-full max-w-[420px] rounded-lg border border-border bg-card p-5 sm:p-6">
          <VerifyPhoneForm locale={params.locale} />
        </div>
      </div>
    </div>
  );
}
