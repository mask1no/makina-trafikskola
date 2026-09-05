import { getTranslations } from "next-intl/server";

import { getAvailableCreditBalance } from "@/lib/credits/ledger";
import { db } from "@/lib/db";

import { requireStudent } from "../_lib";

export const dynamic = "force-dynamic";

export default async function SaldoPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
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
  const formatter = new Intl.DateTimeFormat(params.locale, {
    timeZone: "Europe/Stockholm",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section>
      <h1 className="text-3xl font-black">{t("title")}</h1>
      <div className="mt-6 rounded-md border border-border bg-card p-6">
        <p className="text-sm font-bold text-ink-muted">{t("available")}</p>
        <p className="mt-2 text-4xl font-black">{credits.balance}</p>
        <p className="mt-1 text-sm text-ink-muted">{t("lessons")}</p>
      </div>
      <h2 className="mt-8 text-xl font-bold">{t("lots")}</h2>
      <div className="mt-4 grid gap-3">
        {lots.map((lot) => (
          <article key={lot.id} className="flex items-center justify-between rounded-md border border-border bg-card p-4">
            <div>
              <p className="font-bold">{t(`reasons.${lot.reason}`)}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {lot.expiresAt
                  ? t("expires", { date: formatter.format(lot.expiresAt) })
                  : t("noExpiry")}
              </p>
            </div>
            <span className="text-lg font-black">+{lot.delta}</span>
          </article>
        ))}
        {!lots.length ? <p className="text-ink-muted">{t("empty")}</p> : null}
      </div>
    </section>
  );
}
