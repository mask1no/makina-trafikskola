import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db";

import { requireStudent } from "../_lib";

export const dynamic = "force-dynamic";

export default async function TheoryPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const studentId = await requireStudent(params.locale);
  const now = new Date();
  const [t, access, attempts, correct] = await Promise.all([
    getTranslations("student.theory"),
    db.theoryAccess.findFirst({
      where: { studentId, expiresAt: { gt: now } },
      orderBy: { expiresAt: "desc" },
    }),
    db.theoryAttempt.count({ where: { studentId } }),
    db.theoryAttempt.count({ where: { studentId, correct: true } }),
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-md border border-border bg-card p-5">
          <h2 className="font-bold">{t("access")}</h2>
          <p className="mt-3 text-ink-muted">
            {access
              ? t("activeUntil", { date: formatter.format(access.expiresAt) })
              : t("inactive")}
          </p>
        </article>
        <article className="rounded-md border border-border bg-card p-5">
          <h2 className="font-bold">{t("progress")}</h2>
          <p className="mt-3 text-3xl font-black" dir="ltr">
            {correct}/{attempts}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{t("correct")}</p>
        </article>
      </div>
      {!access ? (
        <p className="mt-5 rounded-md border border-border bg-card p-5 text-ink-muted">
          {t("provisional")}
        </p>
      ) : null}
    </section>
  );
}
