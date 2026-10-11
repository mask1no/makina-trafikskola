import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { theoryMode } from "@/lib/launch";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";
import { presentQuestion } from "@/lib/theory/access";

import { RoadSignGame } from "./RoadSignGame";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "theory.signGame" });
  const canonical = pageCanonical(locale, "/teori/vagmarkesspel");
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

export default async function RoadSignGamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (theoryMode() === "off") redirect(`/${locale}/teori`);
  setRequestLocale(locale);

  const [t, questions] = await Promise.all([
    getTranslations("theory"),
    db.theoryQuestion.findMany({
      where: {
        active: true,
        isFree: true,
        category: { slug: "vagmarkesspel" },
      },
      orderBy: { sourceRef: "asc" },
      take: 300,
      include: {
        translations: true,
        category: { include: { translations: true } },
        answers: {
          orderBy: { order: "asc" },
          include: { translations: true },
        },
      },
    }),
  ]);
  const presented = questions.flatMap((question) => {
    const value = presentQuestion(question, locale);
    return value ? [value] : [];
  });

  return (
    <div className="section-shell">
      <div className="site-container max-w-5xl">
        <PageHeader
          eyebrow={t("hub.free")}
          title={t("signGame.title")}
          description={t("signGame.description")}
        />
        {presented.length ? (
          <RoadSignGame
            locale={locale}
            questions={presented}
            copy={{
              progress: t.raw("signGame.progress"),
              correct: t("correct"),
              incorrect: t("incorrect"),
              next: t("next"),
              finish: t("signGame.finish"),
              score: t.raw("score"),
              retry: t("retry"),
              error: t("answerError"),
            }}
          />
        ) : (
          <div className="mt-8">
            <EmptyState
              title={t("signGame.emptyTitle")}
              description={t("signGame.emptyDescription")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
