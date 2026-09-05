import { getTranslations } from "next-intl/server";

import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";

export async function CompliancePage({
  namespace,
}: {
  namespace: "terms" | "privacy" | "cookies";
}) {
  const t = await getTranslations(`legal.${namespace}`);
  const sections = ["scope", "details", "rights"] as const;

  return (
    <article className="site-container max-w-4xl py-14 sm:py-20">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <Notice className="mt-8 border-accent" title={t("draftTitle")}>
        {t("draftNotice")}
      </Notice>
      <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card shadow-soft">
        {sections.map((section) => (
          <section className="border-b border-border p-6 last:border-b-0 sm:p-8" key={section}>
            <h2 className="text-xl font-black">{t(`${section}.title`)}</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-ink-muted">
              {t(`${section}.body`)}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
