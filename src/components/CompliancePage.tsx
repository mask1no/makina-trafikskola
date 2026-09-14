import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/PageHeader";

export async function CompliancePage({
  namespace,
}: {
  namespace: "terms" | "privacy" | "cookies";
}) {
  const t = await getTranslations(`legal.${namespace}`);
  const sectionOrder = t.raw("sectionOrder") as string[];

  return (
    <article className="site-container max-w-4xl py-14 sm:py-20">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card shadow-soft">
        {sectionOrder.map((section) => (
          <section className="border-b border-border p-6 last:border-b-0 sm:p-8" key={section}>
            <h2 className="text-xl font-black">{t(`${section}.title`)}</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-ink-muted">
              {t(`${section}.body`)}
            </p>
          </section>
        ))}
        {namespace === "cookies" ? (
          <section className="p-6 sm:p-8">
            <h2 className="text-xl font-black">{t("table.caption")}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-start text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 pe-4 font-extrabold">{t("table.name")}</th>
                    <th className="py-3 pe-4 font-extrabold">{t("table.purpose")}</th>
                    <th className="py-3 font-extrabold">{t("table.duration")}</th>
                  </tr>
                </thead>
                <tbody className="text-ink-muted">
                  {(["session", "locale", "consent"] as const).map((row) => (
                    <tr className="border-b border-border last:border-b-0" key={row}>
                      <td className="py-3 pe-4 font-semibold text-ink numbers-ltr">{t(`table.rows.${row}.name`)}</td>
                      <td className="py-3 pe-4 leading-6">{t(`table.rows.${row}.purpose`)}</td>
                      <td className="py-3 leading-6">{t(`table.rows.${row}.duration`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
