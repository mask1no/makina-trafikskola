import { getTranslations } from "next-intl/server";

export async function CompliancePage({
  namespace,
}: {
  namespace: "terms" | "privacy" | "cookies";
}) {
  const t = await getTranslations(`legal.${namespace}`);
  const sections = ["scope", "details", "rights"] as const;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
        {t("eyebrow")}
      </p>
      <h1 className="mt-2 text-4xl font-black">{t("title")}</h1>
      <div className="mt-6 rounded-md border border-accent bg-card p-5">
        <p className="font-bold">{t("draftTitle")}</p>
        <p className="mt-2 leading-7 text-ink-muted">{t("draftNotice")}</p>
      </div>
      <div className="mt-8 grid gap-8">
        {sections.map((section) => (
          <section key={section}>
            <h2 className="text-xl font-bold">{t(`${section}.title`)}</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-ink-muted">
              {t(`${section}.body`)}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
