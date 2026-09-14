import { getLocale, getTranslations } from "next-intl/server";

import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations("errors");
  const shell = await getTranslations("shell");
  const base = `/${locale}`;

  return (
    <div className="site-container max-w-3xl py-16 sm:py-24">
      <PageHeader
        eyebrow="404"
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
      />
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href={base}>{shell("home")}</LinkButton>
        <LinkButton href={`${base}/korlektioner`} variant="tertiary">
          {shell("lessons")}
        </LinkButton>
        <LinkButton href={`${base}/larare`} variant="tertiary">
          {shell("teachers")}
        </LinkButton>
        <LinkButton href={`${base}/boka`} variant="tertiary">
          {shell("book")}
        </LinkButton>
      </div>
    </div>
  );
}
