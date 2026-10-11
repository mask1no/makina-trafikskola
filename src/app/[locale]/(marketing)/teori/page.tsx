import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { EmptyState } from "@/components/EmptyState";
import { LinkButton } from "@/components/LinkButton";
import { isLocale } from "@/i18n/routing";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";
import { theoryMode, theorySalesOpen } from "@/lib/launch";
import { freeTheoryQuestionCount } from "@/lib/theory/questions";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS = ["⚖️", "🛡️", "🧠", "🚗", "🌿", "🛣️", "🏙️", "🅿️", "🧭"];

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

  return (
    <div className="section-shell">
      <div className="site-container max-w-6xl">
        <div className="relative overflow-hidden rounded-lg bg-surface p-7 text-ink-inverse shadow-float sm:p-10 lg:p-14">
          <div
            aria-hidden="true"
            className="absolute -end-20 -top-20 size-64 rounded-full bg-accent opacity-15 blur-3xl"
          />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">
                {t("eyebrow")}
              </p>
              <h1 className="section-title text-balance mt-3">{t("title")}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink-inverse-muted sm:text-lg">
                {theoryMode() === "free"
                  ? t("freeDescription")
                  : freeQuestionCount > 0
                    ? t("description")
                    : homeTheory("comingSoon")}
              </p>
              {theoryMode() === "free" ? null : (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-inverse-muted">
                {t("licensingPending")}
              </p>
              )}
            </div>
            {freeQuestionCount > 0 ? (
            <div className="rounded-md border border-ink-inverse/15 bg-surface-raised p-5">
              <p className="numbers-ltr text-4xl font-black text-accent">
                {freeQuestionCount}
              </p>
              <p className="mt-1 max-w-40 text-sm font-bold text-ink-inverse-muted">
                {t("questionsAvailable")}
              </p>
            </div>
            ) : null}
          </div>
        </div>

        {available.length ? (
          <div className="mt-12">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-wider text-ink-muted">
                {t("freeAccess")}
              </p>
              <h2 className="mt-3 text-3xl font-black">{t("freeIntro")}</h2>
            </div>
            <div className="mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
            {available.map((category) => {
              const content = resolveContent(category.translations, params.locale);
              if (!content.translation) return null;
              return (
                <Link
                  key={category.id}
                  href={`/${params.locale}/teori/${category.slug}`}
                    className="group flex w-44 shrink-0 snap-start flex-col items-center text-center"
                >
                    <div className="relative grid size-36 place-items-center rounded-full border border-[var(--line)] bg-card shadow-card transition group-hover:border-accent">
                      <span aria-hidden="true" className="text-4xl">
                        {CATEGORY_ICONS[category.order - 1] ?? "📘"}
                      </span>
                      <span
                        aria-hidden="true"
                        className="rtl-directional absolute end-4 top-1/2 -translate-y-1/2 text-xl"
                      >
                        →
                      </span>
                    </div>
                    <div className="mt-3">
                      <h3 className="font-black">{content.translation.name}</h3>
                      <p className="numbers-ltr mt-1 text-sm text-ink-muted">
                        {session?.user?.role === "STUDENT"
                          ? t("categoryProgress", {
                              attempted: Math.min(attemptedByCategory[category.id] ?? 0, 20),
                              total: 20,
                            })
                          : t("freeCount", { count: category._count.questions, n: String(category._count.questions) })}
                      </p>
                    </div>
                  {content.swedishOnly ? (
                    <p className="mt-2 text-xs text-ink-muted">{t("swedishOnly")}</p>
                  ) : null}
                </Link>
              );
            })}
            </div>
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          </div>
        )}
        {freeQuestionCount > 0 ? (
          <div className="mt-8 flex flex-wrap gap-3">
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
        {theorySalesOpen() ? (
          <LinkButton href={`/${params.locale}/teori/prov`} className="mt-4" variant="secondary">
            {t("examLink")}
          </LinkButton>
        ) : null}
      </div>
    </div>
  );
}
