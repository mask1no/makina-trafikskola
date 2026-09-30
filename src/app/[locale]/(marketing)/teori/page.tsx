import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { LinkButton } from "@/components/LinkButton";
import { isLocale } from "@/i18n/routing";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "theory" });
  const title = t("title");
  const description = t("description");
  const canonical = pageCanonical(locale, "/teori");
  return {
    title,
    description,
    alternates: { canonical },
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
  const [t, categories] = await Promise.all([
    getTranslations("theory"),
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
  ]);
  const available = categories.filter((category) => category._count.questions > 0);
  const freeQuestionCount = available.reduce(
    (total, category) => total + category._count.questions,
    0,
  );

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
                {t("description")}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-inverse-muted">
                {t("licensingPending")}
              </p>
            </div>
            <div className="rounded-md border border-ink-inverse/15 bg-surface-raised p-5">
              <p className="numbers-ltr text-4xl font-black text-accent">
                {freeQuestionCount}
              </p>
              <p className="mt-1 max-w-40 text-sm font-bold text-ink-inverse-muted">
                {t("questionsAvailable")}
              </p>
            </div>
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
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {available.map((category) => {
              const content = resolveContent(category.translations, params.locale);
              if (!content.translation) return null;
              return (
                <Link
                  key={category.id}
                  href={`/${params.locale}/teori/${category.slug}`}
                    className="group flex min-h-52 flex-col justify-between rounded-lg border border-border bg-card p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-float"
                >
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid size-12 place-items-center rounded-full bg-accent text-lg font-black text-accent-ink">
                        {category.order}
                      </span>
                      <span
                        aria-hidden="true"
                        className="rtl-directional text-2xl transition group-hover:scale-110"
                      >
                        →
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{content.translation.name}</h3>
                      <p className="mt-2 text-sm text-ink-muted">
                        {t("freeCount", { count: category._count.questions })}
                      </p>
                      <p className="mt-4 font-bold underline underline-offset-4">
                        {t("startPractice")}
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
        <LinkButton
          href={`/${params.locale}/teori/prov`}
          className="mt-8"
        >
          {t("examLink")}
        </LinkButton>
      </div>
    </div>
  );
}
