import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { EmptyState } from "@/components/EmptyState";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
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
    <div className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          {paid ? t("paidAccess") : t("freeAccess")}
        </p>
        <h1 className="mt-2 text-4xl font-black">{title}</h1>
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
            }}
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
