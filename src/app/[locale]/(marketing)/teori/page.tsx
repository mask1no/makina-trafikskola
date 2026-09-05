import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
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
    <div className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-4xl font-black sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-muted">
          {t("description")}
        </p>
        <p className="mt-5 rounded-sm border border-border bg-card p-4 text-sm text-ink-muted">
          {t("licensingPending")}
        </p>

        {available.length ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {available.map((category) => {
              const content = resolveContent(category.translations, params.locale);
              if (!content.translation) return null;
              return (
                <Link
                  key={category.id}
                  href={`/${params.locale}/teori/${category.slug}`}
                  className="min-h-11 rounded-md border border-border bg-card p-6 hover:border-accent"
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
        <Link
          href={`/${params.locale}/teori/prov`}
          className="mt-8 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 font-bold text-accent-ink"
        >
          {t("examLink")}
        </Link>
      </div>
    </div>
  );
}
