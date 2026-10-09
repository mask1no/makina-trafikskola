import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/auth";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { theoryMode } from "@/lib/launch";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";
import { presentQuestion } from "@/lib/theory/access";

import { StudyQuiz } from "../[kategori]/StudyQuiz";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "theory" });
  const title = t("startPractice");
  const description = t("freeIntro");
  const canonical = pageCanonical(locale, "/teori/ovning");
  const hidden = theoryMode() === "off";
  return {
    title,
    description,
    alternates: { canonical },
    ...(hidden ? { robots: { index: false, follow: false } } : {}),
    ...withSocial({ title, description, canonical, locale }),
  };
}

export default async function FreePracticePage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  if (theoryMode() === "off") redirect(`/${params.locale}/teori`);
  setRequestLocale(params.locale);
  const [t, session, questions] = await Promise.all([
    getTranslations("theory"),
    auth(),
    db.theoryQuestion.findMany({
      where: { active: true, isFree: true, imageUrl: null },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: {
        translations: true,
        category: { include: { translations: true } },
        answers: { orderBy: { order: "asc" }, include: { translations: true } },
      },
    }),
  ]);
  const presented = questions.flatMap((question) => {
    const value = presentQuestion(question, params.locale);
    return value ? [value] : [];
  });

  return (
    <div className="section-shell">
      <div className="site-container max-w-3xl">
        <PageHeader eyebrow={t("freeAccess")} title={t("practiceAll", { count: presented.length })} description={t("freeIntro")} />
        {presented.length ? (
          <StudyQuiz
            locale={params.locale}
            questions={presented}
            authenticated={session?.user?.role === "STUDENT"}
            bookHref={
              process.env.BOOKING_ENABLED === "1"
                ? `/${params.locale}/boka`
                : `/${params.locale}/kontakt`
            }
            copy={{
              questionNumber: t.raw("questionNumber"),
              submit: t("submitAnswer"),
              correct: t("correct"),
              incorrect: t("incorrect"),
              selectAnswer: t("selectAnswer"),
              signIn: t("signInToAnswer"),
              error: t("answerError"),
              imageMissing: t("imageMissing"),
              next: t("next"),
              score: t.raw("score"),
              reviewMistakes: t("reviewMistakes"),
              retry: t("retry"),
              bookLesson: t("bookLesson"),
            }}
          />
        ) : (
          <div className="mt-8">
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          </div>
        )}
      </div>
    </div>
  );
}
