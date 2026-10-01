import { getTranslations } from "next-intl/server";

import { getAvailableCreditBalance } from "@/lib/credits/ledger";
import { formatDate } from "@/lib/format/datetime";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";

import { requireStudent } from "../_lib";

export const dynamic = "force-dynamic";

export default async function LessonsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const studentId = await requireStudent(params.locale);
  const now = new Date();
  const [t, credits, lots] = await Promise.all([
    getTranslations("student.saldo"),
    getAvailableCreditBalance(db, studentId, now),
    db.creditTransaction.findMany({
      where: {
        studentId,
        delta: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, delta: true, reason: true, expiresAt: true },
    }),
  ]);
  return (
    <section>
      <PageHeader title={t("title")} />
      <div className="mt-6 max-w-md">
        <StatCard
          label={t("available")}
          value={t("remaining", { count: credits.balance, n: String(credits.balance) })}
        />
      </div>
      <h2 className="mt-8 text-xl font-bold">{t("lots")}</h2>
      <div className="mt-4 overflow-hidden rounded-md border border-border bg-card shadow-soft">
        {lots.map((lot) => (
          <article key={lot.id} className="flex min-h-20 items-center justify-between gap-4 border-b border-border p-4 last:border-b-0">
            <div className="min-w-0">
              <p className="break-words font-bold">{t(`reasons.${lot.reason}`)}</p>
              <p className="mt-1 break-words text-sm text-ink-muted">
                {lot.expiresAt
                  ? t.rich("expires", {
                      date: formatDate(lot.expiresAt, params.locale),
                      time: (chunks) => <bdi>{chunks}</bdi>,
                    })
                  : t("noExpiry")}
              </p>
            </div>
            <span className="shrink-0 text-lg font-black text-success">
              {t("lotCount", { count: lot.delta, n: String(lot.delta) })}
            </span>
          </article>
        ))}
        {!lots.length ? <EmptyState title={t("empty")} description={t("remaining", { count: 0, n: "0" })} /> : null}
      </div>
    </section>
  );
}
