import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { EmptyState } from "@/components/EmptyState";
import { LinkButton } from "@/components/LinkButton";
import { TheoryHubNav } from "@/components/TheoryHubNav";
import { TheoryStepsPath } from "@/components/TheoryStepsPath";
import { isLocale } from "@/i18n/routing";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";
import { theoryMode, theorySalesOpen } from "@/lib/launch";
import { freeTheoryQuestionCount } from "@/lib/theory/questions";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "theory" });
  const mode = theoryMode();
  const comingSoon = mode === "off";
  const title = comingSoon ? t("comingSoonTitle") : t("title");
  const description = comingSoon
    ? t("comingSoonBody")
    : mode === "free"
      ? t("freeDescription")
      : t("description");
  const canonical = pageCanonical(locale, "/teori");
  return {
    title,
    description,
    alternates: { canonical },
    ...(comingSoon ? { robots: { index: false, follow: false } } : {}),
    ...withSocial({ title, description, canonical, locale }),
  };
}

export default async function TeoriPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  if (theoryMode() === "off") {
    const t = await getTranslations("theory");
    return (
      <div className="section-shell">
        <div className="site-container max-w-xl">
          <h1 className="text-h1 font-black">{t("comingSoonTitle")}</h1>
          <p className="mt-4 max-w-[70ch] leading-7 text-ink-muted">{t("comingSoonBody")}</p>
        </div>
      </div>
    );
  }
  const session = await auth();
  const [t, homeTheory, categories, freeQuestionCount, attempts] = await Promise.all([
    getTranslations("theory"),
    getTranslations("home.theory"),
    db.theoryCategory.findMany({
      where: { order: { lte: 9 } },
      orderBy: { order: "asc" },
      include: {
        translations: true,
        _count: {
          select: {
            questions: { where: { active: true, isFree: true } },
          },
        },
      },
    }),
    freeTheoryQuestionCount(),
    session?.user?.role === "STUDENT"
      ? db.theoryAttempt.findMany({
          where: { studentId: session.user.id },
          distinct: ["questionId"],
          select: { questionId: true, question: { select: { categoryId: true } } },
        })
      : Promise.resolve([]),
  ]);
  const available = categories.filter((category) => category._count.questions > 0);
  const attemptedByCategory = attempts.reduce<Record<string, number>>((counts, attempt) => {
    counts[attempt.question.categoryId] = (counts[attempt.question.categoryId] ?? 0) + 1;
    return counts;
  }, {});
  const hubItems = [
    {
      key: "steps" as const,
      href: `/${params.locale}/teori#steg-for-steg`,
      title: t("hub.steps.title"),
    },
    {
      key: "questions" as const,
      href: `/${params.locale}/teori/ovning`,
      title: t("hub.questions.title"),
    },
    {
      key: "signs" as const,
      href: `/${params.locale}/teori/vagmarkesspel`,
      title: t("hub.signs.title"),
    },
    {
      key: "facts" as const,
      href: `/${params.locale}/teori/faktabank`,
      title: t("hub.facts.title"),
    },
  ];
  const mappedSteps = available.flatMap((category) => {
    const content = resolveContent(category.translations, params.locale);
    if (!content.translation) return [];
    const attempted = Math.min(attemptedByCategory[category.id] ?? 0, 20);
    const done = session?.user?.role === "STUDENT" && attempted >= 20;
    return [{
      id: category.id,
      href: `/${params.locale}/teori/${category.slug}`,
      name: content.translation.name,
      questionsLabel: t("stepQuestions", { count: 20 }),
      swedishOnly: content.swedishOnly ? t("swedishOnly") : undefined,
      done,
      iconOrder: category.order,
    }];
  });
  const nextStepId = mappedSteps.find((step) => !step.done)?.id;
  const steps = mappedSteps.map((step) => ({
    id: step.id,
    href: step.href,
    name: step.name,
    questionsLabel: step.questionsLabel,
    swedishOnly: step.swedishOnly,
    status: (step.done
      ? "done"
      : step.id === nextStepId
        ? "next"
        : "todo") as "next" | "done" | "todo",
    iconOrder: step.iconOrder,
  }));

  return (
    <div className="section-shell">
      <div className="site-container max-w-6xl">
        <TheoryHubNav
          label={t("hub.label")}
          items={hubItems}
          activeKey="steps"
        />

        <section id="steg-for-steg" className="scroll-mt-28 pt-8 text-center">
          <h1 className="section-title text-balance mx-auto max-w-3xl">
            {t("hub.steps.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-body leading-7 text-ink-muted">
            {theoryMode() === "free"
              ? t("freeDescription")
              : freeQuestionCount > 0
                ? t("hub.steps.description")
                : homeTheory("comingSoon")}
          </p>
          {freeQuestionCount > 0 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {available[0] ? (
                <LinkButton href={`/${params.locale}/teori/${available[0].slug}`}>
                  {t("startPractice")}
                </LinkButton>
              ) : null}
              <LinkButton href={`/${params.locale}/teori/ovning`} variant="secondary">
                {t("practiceAll", { count: freeQuestionCount })}
              </LinkButton>
            </div>
          ) : null}
        </section>

        {steps.length ? (
          <TheoryStepsPath steps={steps} doneLabel={t("stepDone")} />
        ) : (
          <div className="mt-10">
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          </div>
        )}
        {theorySalesOpen() ? (
          <div className="mt-8 flex justify-center">
            <LinkButton href={`/${params.locale}/teori/prov`} variant="secondary">
              {t("examLink")}
            </LinkButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}
