import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { TheoryIcon, THEORY_CATEGORY_ICONS } from "@/components/TheoryIcon";
import { isLocale } from "@/i18n/routing";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FaktabankPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, categories] = await Promise.all([
    getTranslations("theory"),
    db.theoryCategory.findMany({
      where: { order: { lte: 9 } },
      orderBy: { order: "asc" },
      include: {
        translations: true,
        _count: { select: { questions: { where: { active: true } } } },
      },
    }),
  ]);

  return (
    <div className="section-shell">
      <div className="site-container max-w-6xl">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("hub.facts.title")}
          description={t("hub.facts.description")}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const content = resolveContent(category.translations, locale);
            if (!content.translation || category._count.questions === 0) return null;
            return (
              <Link
                key={category.id}
                href={`/${locale}/teori/faktabank/${category.slug}`}
                className="group flex min-h-48 flex-col rounded-md border border-border bg-card p-5 shadow-soft transition hover:border-accent"
              >
                <span className="grid size-12 place-items-center rounded-sm bg-accent-soft">
                  <TheoryIcon
                    name={THEORY_CATEGORY_ICONS[category.order - 1] ?? "facts"}
                    className="size-7"
                  />
                </span>
                <h2 className="mt-5 text-xl font-black">
                  {content.translation.name}
                </h2>
                <p className="numbers-ltr mt-2 text-sm text-ink-muted">
                  {t("hub.facts.entries", {
                    count: category._count.questions,
                    n: String(category._count.questions),
                  })}
                </p>
                <span className="mt-auto pt-5 text-sm font-bold underline underline-offset-4">
                  {t("hub.facts.read")}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
