import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { isLocale } from "@/i18n/routing";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "theory.hub.ebook" });
  const canonical = pageCanonical(locale, "/teori/e-bok");
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical },
    ...withSocial({
      title: t("title"),
      description: t("description"),
      canonical,
      locale,
    }),
  };
}

export default async function EbookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("theory.hub.ebook");
  const cards = [
    { title: t("ebookTitle"), body: t("ebookBody") },
    { title: t("audioTitle"), body: t("audioBody") },
  ];

  return (
    <div className="section-shell">
      <div className="site-container max-w-4xl text-center">
        <PageHeader eyebrow={t("soon")} title={t("title")} description={t("description")} />
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-lg border border-border bg-card p-7 text-center shadow-soft"
            >
              <Badge>{t("soon")}</Badge>
              <h2 className="mt-4 text-2xl font-black">{card.title}</h2>
              <p className="mt-3 leading-7 text-ink-muted">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
