import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db";
import { getActiveTheoryAccess } from "@/lib/theory/access";
import { answerStreaks } from "@/lib/theory/streak";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";

import { theoryNavVisible } from "@/lib/launch";
import { redirect } from "next/navigation";

import { requireStudent } from "../_lib";

export const dynamic = "force-dynamic";

export default async function TheoryPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  if (!theoryNavVisible()) redirect(`/${params.locale}/mina-sidor`);
  const studentId = await requireStudent(params.locale);
  const now = new Date();
  const [t, access, attempts, correct, signAttempts] = await Promise.all([
    getTranslations("student.theory"),
    getActiveTheoryAccess(db, studentId, now),
    db.theoryAttempt.count({ where: { studentId } }),
    db.theoryAttempt.count({ where: { studentId, correct: true } }),
    db.theoryAttempt.findMany({
      where: {
        studentId,
        question: { category: { slug: "vagmarkesspel" } },
      },
      orderBy: { answeredAt: "asc" },
      select: { correct: true },
    }),
  ]);
  const streaks = answerStreaks(signAttempts);

  return (
    <section>
      <PageHeader title={t("title")} />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("access")}
          value={access ? t("active") : t("inactive")}
          className="[&_[class*='text-3xl']]:text-lg"
        />
        <StatCard label={t("progress")} value={<span dir="ltr">{correct}/{attempts}</span>} detail={t("correct")} />
        <StatCard
          label={t("streak")}
          value={<span dir="ltr">{streaks.best}</span>}
          detail={t("streakNow", { count: streaks.current })}
        />
      </div>
      {!access ? (
        <Notice className="mt-5">{t("provisional")}</Notice>
      ) : null}
    </section>
  );
}
