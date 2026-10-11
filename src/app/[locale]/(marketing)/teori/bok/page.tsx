import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { TheoryIcon } from "@/components/TheoryIcon";
import { isLocale } from "@/i18n/routing";

export default async function TheoryBookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("theory");

  return (
    <div className="section-shell">
      <div className="site-container max-w-4xl">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("hub.book.title")}
          description={t("hub.book.description")}
        />
        <div className="mt-10 rounded-lg border border-border bg-card p-7 text-center shadow-soft sm:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent-soft">
            <TheoryIcon name="book" className="size-9" />
          </span>
          <div className="mt-5">
            <Badge>{t("hub.comingSoon")}</Badge>
          </div>
          <p className="mx-auto mt-4 max-w-[60ch] leading-7 text-ink-muted">
            {t("hub.book.pending")}
          </p>
        </div>
      </div>
    </div>
  );
}
