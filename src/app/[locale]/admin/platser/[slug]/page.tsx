import { fromZonedTime } from "date-fns-tz";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { schoolLocations } from "@/lib/admin/place-query";
import { catalogueLessonValueOre, completedLessonPayOre } from "@/lib/admin/places";
import { db } from "@/lib/db";
import { formatLessonDateTime, stockholmParts } from "@/lib/format/datetime";
import { formatPrice } from "@/lib/pricing/format";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Europe/Stockholm";
const slugSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

function monthBoundary(now: Date, offset: number) {
  const parts = stockholmParts(now);
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1 + offset, 1));
  const key = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00`;
  return fromZonedTime(key, TIME_ZONE);
}

export default async function AdminPlacePage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const params = await props.params;
  const parsed = slugSchema.safeParse(params.slug);
  if (!parsed.success) notFound();

  const locations = await schoolLocations();
  const location = locations.find((item) => item.slug === parsed.data);
  if (!location) notFound();

  const now = new Date();
  const thisMonth = monthBoundary(now, 0);
  const monthEnd = monthBoundary(now, 1);

  const [t, teachers, completed, confirmed, monthBookings, recent, singleLesson] = await Promise.all([
    getTranslations("admin.places"),
    db.teacherProfile.findMany({
      where: { active: true, locations: { some: { locationId: location.id } } },
      orderBy: { user: { firstName: "asc" } },
      select: {
        id: true,
        languages: true,
        user: { select: { firstName: true, lastName: true } },
      },
    }),
    db.booking.findMany({
      where: { locationId: location.id, status: "COMPLETED" },
      select: { teacher: { select: { payRateOre: true } } },
    }),
    db.booking.count({
      where: { locationId: location.id, status: "CONFIRMED", startsAt: { gte: now } },
    }),
    db.booking.count({
      where: {
        locationId: location.id,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        startsAt: { gte: thisMonth, lt: monthEnd },
      },
    }),
    db.booking.findMany({
      where: { locationId: location.id, status: { in: ["CONFIRMED", "COMPLETED"] } },
      orderBy: { startsAt: "desc" },
      take: 12,
      select: {
        id: true,
        startsAt: true,
        status: true,
        student: { select: { firstName: true, lastName: true } },
        teacher: { select: { user: { select: { firstName: true } } } },
      },
    }),
    db.product.findUnique({
      where: { slug: "en-korlektion" },
      select: { priceOre: true },
    }),
  ]);

  const payOre = completedLessonPayOre(
    completed.map((lesson) => ({ payRateOre: lesson.teacher.payRateOre })),
  );
  const lessonValue = catalogueLessonValueOre(completed.length, singleLesson?.priceOre ?? 0);

  return (
    <section>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={location.name}
        description={`${location.address}, ${location.postalCode} ${location.city}`}
      />
      <p className="mt-3 max-w-[70ch] text-sm leading-6 text-ink-muted">{t("pickupNote")}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard size="sm" label={t("completed")} value={completed.length} />
        <StatCard size="sm" label={t("confirmed")} value={confirmed} />
        <StatCard size="sm" label={t("thisMonth")} value={monthBookings} />
        <StatCard
          size="sm"
          label={t("pay")}
          value={formatPrice(payOre, params.locale)}
          detail={payOre === 0 ? t("payEmpty") : undefined}
        />
        <StatCard
          size="sm"
          label={t("lessonValue")}
          value={formatPrice(lessonValue, params.locale)}
          detail={t("lessonValueDetail")}
        />
      </div>

      <h2 className="mt-8 text-xl font-black">{t("teachersTitle")}</h2>
      {teachers.length ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {teachers.map((teacher) => (
            <li key={teacher.id} className="rounded-md border border-border bg-card p-4">
              <p className="font-black">
                {teacher.user.firstName} {teacher.user.lastName}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{teacher.languages.join(", ")}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">{t("noTeachers")}</p>
      )}

      <h2 className="mt-8 text-xl font-black">{t("recent")}</h2>
      {recent.length ? (
        <ul className="mt-4 grid gap-2">
          {recent.map((booking) => (
            <li key={booking.id} className="rounded-md border border-border bg-card px-4 py-3 text-sm">
              <span className="numbers-ltr font-bold">
                {formatLessonDateTime(booking.startsAt, params.locale)}
              </span>
              {" · "}
              {booking.student.firstName} {booking.student.lastName}
              {" · "}
              {booking.teacher.user.firstName}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">{t("emptyBookings")}</p>
      )}
    </section>
  );
}
