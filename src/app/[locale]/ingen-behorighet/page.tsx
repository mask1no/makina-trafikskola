import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

function dashboardPath(locale: string, role: string | undefined) {
  if (role === "ADMIN") return `/${locale}/admin`;
  if (role === "TEACHER") return `/${locale}/larare-portal`;
  if (role === "STUDENT") return `/${locale}/mina-sidor`;
  return `/${locale}`;
}

export default async function NoAccessPage(
  props: {
    params: Promise<{ locale: string }>;
  },
) {
  const params = await props.params;
  const [t, shell, session] = await Promise.all([
    getTranslations("errors"),
    getTranslations("shell"),
    auth(),
  ]);
  const home = `/${params.locale}`;
  const dashboard = dashboardPath(params.locale, session?.user.role);

  return (
    <div className="site-container max-w-3xl py-16 sm:py-24">
      <PageHeader title={t("forbiddenTitle")} description={t("forbiddenDescription")} />
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href={home}>{shell("home")}</LinkButton>
        {dashboard !== home ? (
          <LinkButton href={dashboard} variant="tertiary">
            {t("forbiddenDashboard")}
          </LinkButton>
        ) : null}
      </div>
    </div>
  );
}
