import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { isLocale } from "@/i18n/routing";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  return (
    <div className="section-shell">
      <div className="site-container max-w-6xl">
        <div className="max-w-3xl">
            <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-muted">
              {t("licensingPending")}
            </p>
          </div>

        {available.length ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {available.map((category) => {
              const content = resolveContent(category.translations, params.locale);
              if (!content.translation) return null;
              return (
                <Link
                  key={category.id}
                  href={`/${params.locale}/teori/${category.slug}`}
                  className="group min-h-44 rounded-md border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card"
                >
                  <h2 className="text-xl font-black">{content.translation.name}</h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    {t("freeCount", { count: category._count.questions })}
                  </p>
                  {content.swedishOnly ? (
                    <p className="mt-2 text-xs text-ink-muted">{t("swedishOnly")}</p>
                  ) : null}
                </Link>
              );
            })}
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
