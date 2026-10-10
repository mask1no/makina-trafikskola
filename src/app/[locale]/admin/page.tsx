import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { getTranslations } from "next-intl/server";

import { LocationCards } from "@/app/[locale]/admin/LocationCards";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { locationSummaries } from "@/lib/admin/place-query";
import { db } from "@/lib/db";
import { formatLessonTime, stockholmParts } from "@/lib/format/datetime";
import { formatPrice } from "@/lib/pricing/format";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Europe/Stockholm";

function stockholmMonthStart(now: Date, monthOffset: number) {
  const parts = stockholmParts(now);
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1 + monthOffset, 1));
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
  const localDay = formatInTimeZone(now, TIME_ZONE, "yyyy-MM-dd");
  const dayStart = fromZonedTime(`${localDay}T00:00:00`, TIME_ZONE);
  const dayEnd = fromZonedTime(`${localDay}T23:59:59.999`, TIME_ZONE);
  const counted = { in: ["CONFIRMED", "COMPLETED"] as ["CONFIRMED", "COMPLETED"] };

  const [
    t,
    places,
    lessonsToday,
    bookingsToday,
    bookingsMonth,
    revenueToday,
    revenueTotal,
    teachers,
    accounts,
    rating,
  ] = await Promise.all([
    getTranslations("admin.dashboard"),
    locationSummaries(),
    db.booking.findMany({
      where: {
        startsAt: { gte: dayStart, lte: dayEnd },
        status: counted,
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
      where: { startsAt: { gte: dayStart, lte: dayEnd }, status: counted },
    }),
    db.booking.count({
      where: { startsAt: { gte: thisMonth, lt: nextMonth }, status: counted },
    }),
    db.payment.aggregate({
      where: { status: "SUCCEEDED", order: { paidAt: { gte: dayStart, lte: dayEnd } } },
      _sum: { amountOre: true, refundedOre: true },
    }),
    db.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amountOre: true, refundedOre: true },
    }),
    db.teacherProfile.count({ where: { active: true } }),
    db.user.count({ where: { role: "STUDENT", deletedAt: null } }),
    db.review.aggregate({
      where: { published: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const placeT = await getTranslations("admin.places");
  const revenue = (row: { _sum: { amountOre: number | null; refundedOre: number | null } }) =>
    (row._sum.amountOre ?? 0) - (row._sum.refundedOre ?? 0);
  const ratingCount = rating._count._all;
  const ratingValue =
    ratingCount > 0 && rating._avg.rating != null ? rating._avg.rating.toFixed(1) : "–";

  return (
    <section>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard size="sm" label={t("bookingsToday")} value={bookingsToday} />
        <StatCard size="sm" label={t("bookingsMonth")} value={bookingsMonth} />
        <StatCard size="sm" label={t("revenueToday")} value={formatPrice(revenue(revenueToday), params.locale)} />
        <StatCard size="sm" label={t("revenueTotal")} value={formatPrice(revenue(revenueTotal), params.locale)} />
        <StatCard size="sm" label={t("teachers")} value={teachers} />
        <StatCard size="sm" label={t("accounts")} value={accounts} />
        <StatCard
          size="sm"
          label={t("rating")}
          value={ratingValue}
          detail={ratingCount > 0 ? t("ratingDetail", { count: ratingCount }) : t("ratingEmpty")}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-black">{t("placesTitle")}</h2>
        <p className="mt-2 max-w-[70ch] text-sm leading-6 text-ink-muted">{t("placesDescription")}</p>
        <div className="mt-4">
          <LocationCards
            locale={params.locale}
            locations={places}
            teachersLabel={(count) => placeT("teachers", { count })}
            bookingsLabel={(count) => placeT("bookings", { count })}
            detailsLabel={placeT("viewDetails")}
          />
        </div>
      </div>

      <Card className="mt-8">
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
