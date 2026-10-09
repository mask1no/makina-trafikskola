import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { theoryMode } from "@/lib/launch";
import { hasTheoryAccess, presentQuestion } from "@/lib/theory/access";

import { StudyQuiz } from "./StudyQuiz";

export const dynamic = "force-dynamic";

export default async function TeoriKategoriPage(
  props: {
    params: Promise<{ locale: string; kategori: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  if (theoryMode() === "off") redirect(`/${params.locale}/teori`);
  setRequestLocale(params.locale);
  const session = await auth();
  const now = new Date();
  const paid =
    session?.user?.role === "STUDENT" &&
    (await hasTheoryAccess(db, session.user.id, now));
  const [t, category] = await Promise.all([
    getTranslations("theory"),
    db.theoryCategory.findUnique({
      where: { slug: params.kategori },
      include: {
        translations: true,
        questions: {
          where: { active: true, ...(!paid ? { isFree: true } : {}) },
          orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
          include: {
            translations: true,
            category: { include: { translations: true } },
            answers: {
              orderBy: { order: "asc" },
              include: { translations: true },
            },
          },
        },
      },
    }),
  ]);
  if (!category) notFound();
  const presented = category.questions.flatMap((question) => {
    const value = presentQuestion(question, params.locale);
    return value ? [value] : [];
  });
  const title =
    presented[0]?.category.name ??
    category.translations.find((item) => item.locale === params.locale)?.name ??
    category.translations.find((item) => item.locale === "sv")?.name ??
    params.kategori;

  return (
    <div className="section-shell">
      <div className="site-container max-w-4xl">
        <PageHeader eyebrow={paid ? t("paidAccess") : t("freeAccess")} title={title} />
        {presented.length ? (
          <StudyQuiz
            locale={params.locale}
            questions={presented}
            authenticated={session?.user?.role === "STUDENT"}
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
            bookHref={`/${params.locale}/boka`}
          />
        ) : (
          <div className="mt-8">
            <EmptyState title={t("categoryEmptyTitle")} description={t("categoryEmptyDescription")} />
          </div>
        )}
      </div>
    </div>
  );
}
