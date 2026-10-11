import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { isLocale } from "@/i18n/routing";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FaktabankCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; kategori: string }>;
}) {
  const { locale, kategori } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, category] = await Promise.all([
    getTranslations("theory"),
    db.theoryCategory.findUnique({
      where: { slug: kategori },
      include: {
        translations: true,
        questions: {
          where: { active: true },
          orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
          include: { translations: true },
        },
      },
    }),
  ]);
  if (!category) notFound();

  const categoryContent = resolveContent(category.translations, locale);
  if (!categoryContent.translation) notFound();
  const entries = category.questions.flatMap((question) => {
    const content = resolveContent(question.translations, locale);
    if (!content.translation?.explanation) return [];
    return [{
      id: question.id,
      title: content.translation.text,
      explanation: content.translation.explanation,
      source: question.sourceCitation,
      swedishOnly: content.swedishOnly,
    }];
  });

  return (
    <div className="section-shell">
      <div className="site-container max-w-4xl">
        <PageHeader
          eyebrow={t("hub.facts.title")}
          title={categoryContent.translation.name}
          description={t("hub.facts.categoryDescription")}
        />
        <ol className="mt-10 grid gap-4">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className="rounded-md border border-border bg-card p-5 shadow-soft sm:p-6"
            >
              <div className="flex items-start gap-4">
                <span className="numbers-ltr grid size-9 shrink-0 place-items-center rounded-full bg-accent font-black text-accent-ink">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-lg font-black">{entry.title}</h2>
                  <p className="mt-3 max-w-[70ch] leading-7 text-ink-muted">
                    {entry.explanation}
                  </p>
                  {entry.source ? (
                    <p className="mt-4 text-xs leading-5 text-ink-subtle">
                      <span className="font-bold">{t("hub.facts.source")}:</span>{" "}
                      {entry.source}
                    </p>
                  ) : null}
                  {entry.swedishOnly ? (
                    <p className="mt-2 text-xs text-ink-muted">{t("swedishOnly")}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
