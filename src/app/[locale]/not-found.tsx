import { getLocale, getTranslations } from "next-intl/server";

import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { bookingEnabled, instructorsEnabled } from "@/lib/launch";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations("errors");
  const shell = await getTranslations("shell");
  const base = `/${locale}`;
  const canBook = bookingEnabled();
  const showInstructors = instructorsEnabled();

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
        {showInstructors ? (
          <LinkButton href={`${base}/larare`} variant="tertiary">
            {shell("teachers")}
          </LinkButton>
        ) : null}
        {canBook ? (
          <LinkButton href={`${base}/boka`} variant="tertiary">
            {shell("book")}
          </LinkButton>
        ) : (
          <LinkButton href={`${base}/kontakt`} variant="tertiary">
            {shell("contact")}
          </LinkButton>
        )}
      </div>
    </div>
  );
}
