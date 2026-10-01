import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { getTranslations } from "next-intl/server";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { calculateAvailableCreditBalance } from "@/lib/credits/ledger";
import { db } from "@/lib/db";
import { formatLessonTime, stockholmParts } from "@/lib/format/datetime";
import { formatPrice } from "@/lib/pricing/format";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Europe/Stockholm";

function stockholmMonthStart(now: Date, monthOffset: number) {
  const parts = stockholmParts(now);
  const year = parts.year;
  const month = parts.month;
  const shifted = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
  const key = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00`;
  return fromZonedTime(key, TIME_ZONE);
}

export default async function AdminPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const now = new Date();
  const thisMonth = stockholmMonthStart(now, 0);
  const nextMonth = stockholmMonthStart(now, 1);
  const lastMonth = stockholmMonthStart(now, -1);
  const localDay = formatInTimeZone(now, TIME_ZONE, "yyyy-MM-dd");
  const dayStart = fromZonedTime(`${localDay}T00:00:00`, TIME_ZONE);
  const dayEnd = fromZonedTime(`${localDay}T23:59:59.999`, TIME_ZONE);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    t,
    thisPayments,
    lastPayments,
    lessonsToday,
    bookingsWeek,
    newStudents,
    creditRows,
    reviewsWaiting,
  ] = await Promise.all([
    getTranslations("admin.dashboard"),
    db.payment.findMany({
      where: {
        status: "SUCCEEDED",
        order: { paidAt: { gte: thisMonth, lt: nextMonth } },
      },
      select: { amountOre: true, refundedOre: true },
    }),
    db.payment.findMany({
      where: {
        status: "SUCCEEDED",
        order: { paidAt: { gte: lastMonth, lt: thisMonth } },
      },
      select: { amountOre: true, refundedOre: true },
    }),
    db.booking.findMany({
      where: {
        startsAt: { gte: dayStart, lte: dayEnd },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        student: { select: { firstName: true, lastName: true } },
        teacher: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
    db.booking.count({
      where: {
        status: "CONFIRMED",
        startsAt: { gt: now, lte: weekEnd },
      },
    }),
    db.user.count({
      where: {
        role: "STUDENT",
        deletedAt: null,
        createdAt: { gte: thisMonth, lt: nextMonth },
      },
    }),
    db.creditTransaction.findMany({
      select: {
        studentId: true,
        id: true,
        delta: true,
        reason: true,
        orderItemId: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    db.review.count({ where: { published: false } }),
  ]);

  const net = (rows: { amountOre: number; refundedOre: number }[]) =>
    rows.reduce((sum, row) => sum + row.amountOre - row.refundedOre, 0);
  const revenue = net(thisPayments);
  const previousRevenue = net(lastPayments);
  const revenueChange =
    previousRevenue === 0
      ? null
      : Math.round(((revenue - previousRevenue) / previousRevenue) * 100);
  const byStudent = new Map<string, typeof creditRows>();
  for (const row of creditRows) {
    const list = byStudent.get(row.studentId) ?? [];
    list.push(row);
    byStudent.set(row.studentId, list);
  }
  let creditsOutstanding = 0;
  for (const entries of byStudent.values()) {
    creditsOutstanding += calculateAvailableCreditBalance(entries, now).balance;
  }
  return (
    <section>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <StatCard
          label={t("revenue")}
          value={formatPrice(revenue, params.locale)}
          detail={
            revenueChange === null
              ? t("revenueNoCompare")
              : t("revenueCompare", {
                  percent: `${revenueChange > 0 ? "+" : ""}${revenueChange}%`,
                })
          }
        />
        <StatCard label={t("bookingsWeek")} value={bookingsWeek} />
        <StatCard label={t("newStudents")} value={newStudents} />
        <StatCard label={t("creditsOutstanding")} value={creditsOutstanding} />
        <StatCard label={t("reviewsWaiting")} value={reviewsWaiting} />
      </div>
      <Card className="mt-4">
        <h2 className="text-lg font-black">{t("lessonsToday")}</h2>
        {lessonsToday.length ? (
          <ul className="mt-4 grid gap-3">
            {lessonsToday.map((lesson) => (
              <li key={lesson.id} className="text-sm leading-6 text-ink">
                {t("lessonLine", {
                  time: formatLessonTime(lesson.startsAt, params.locale),
                  instructor: `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`,
                  student: `${lesson.student.firstName} ${lesson.student.lastName}`,
                })}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">{t("lessonsTodayEmpty")}</p>
        )}
      </Card>
    </section>
  );
}
