import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { theoryMode } from "@/lib/launch";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";
import { presentQuestion } from "@/lib/theory/access";
import { answerStreaks } from "@/lib/theory/streak";

import { RoadSignGame } from "./RoadSignGame";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [t, signCount] = await Promise.all([
    getTranslations({ locale, namespace: "theory.signGame" }),
    db.theoryQuestion.count({
      where: { active: true, isFree: true, category: { slug: "vagmarkesspel" } },
    }),
  ]);
  const description = t("description", { count: signCount });
  const canonical = pageCanonical(locale, "/teori/vagmarkesspel");
  return {
    title: t("title"),
    description,
    alternates: { canonical },
    ...withSocial({
      title: t("title"),
      description,
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

  const session = await auth();
  const [t, questions, savedAttempts] = await Promise.all([
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
    session?.user?.role === "STUDENT"
      ? db.theoryAttempt.findMany({
          where: {
            studentId: session.user.id,
            question: { category: { slug: "vagmarkesspel" } },
          },
          orderBy: { answeredAt: "asc" },
          select: { correct: true, questionId: true },
        })
      : Promise.resolve([] as { correct: boolean; questionId: string }[]),
  ]);
  const savedStreak = answerStreaks(savedAttempts);
  const presented = questions.flatMap((question) => {
    const value = presentQuestion(question, locale);
    return value ? [value] : [];
  });
  const answeredIds = new Set(savedAttempts.map((attempt) => attempt.questionId));
  const firstOpen = presented.findIndex((question) => !answeredIds.has(question.id));
  const startIndex = firstOpen < 0 ? 0 : firstOpen;

  return (
    <div className="section-shell">
      <div className="site-container max-w-5xl">
        <PageHeader
          eyebrow={t("hub.free")}
          title={t("signGame.title")}
          description={t("signGame.description", { count: presented.length })}
        />
        {presented.length ? (
          <RoadSignGame
            locale={locale}
            questions={presented}
            initialStreak={savedStreak.current}
            initialBest={savedStreak.best}
            startIndex={startIndex}
            copy={{
              progress: t.raw("signGame.progress"),
              streak: t.raw("signGame.streak"),
              best: t.raw("signGame.best"),
              correct: t("correct"),
              incorrect: t("incorrect"),
              next: t("next"),
              finish: t("signGame.finish"),
              score: t.raw("score"),
              retry: t("retry"),
              error: t("answerError"),
              history: t("signGame.history"),
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
