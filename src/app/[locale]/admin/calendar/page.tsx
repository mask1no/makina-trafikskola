import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db";

import { AdminBookingControls } from "./AdminBookingControls";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Europe/Stockholm";

function addDateKey(dateKey: string, days: number) {
  const value = new Date(`${dateKey}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function mondayFor(dateKey: string) {
  const value = new Date(`${dateKey}T12:00:00.000Z`);
  const day = value.getUTCDay();
  return addDateKey(dateKey, -(day === 0 ? 6 : day - 1));
}

export default async function AdminCalendarPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ week?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const today = formatInTimeZone(new Date(), TIME_ZONE, "yyyy-MM-dd");
  const requested = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.week ?? "")
    ? searchParams.week!
    : today;
  const weekStartKey = mondayFor(requested);
  const weekEndKey = addDateKey(weekStartKey, 7);
  const from = fromZonedTime(`${weekStartKey}T00:00:00`, TIME_ZONE);
  const to = fromZonedTime(`${weekEndKey}T00:00:00`, TIME_ZONE);
  const [t, teachers] = await Promise.all([
    getTranslations("admin.calendar"),
    db.teacherProfile.findMany({
      where: { active: true },
      orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
      select: {
        id: true,
        user: { select: { firstName: true, lastName: true } },
        bookings: {
          where: {
            startsAt: { gte: from, lt: to },
            status: { in: ["CONFIRMED", "COMPLETED"] },
          },
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            status: true,
            student: {
              select: { id: true, firstName: true, lastName: true },
            },
            location: { select: { name: true } },
          },
        },
      },
    }),
  ]);
  const days = Array.from({ length: 7 }, (_, index) =>
    addDateKey(weekStartKey, index),
  );
  const dayFormatter = new Intl.DateTimeFormat(params.locale, {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeFormatter = new Intl.DateTimeFormat(params.locale, {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  const teacherOptions = teachers.map((teacher) => ({
    id: teacher.id,
    name: `${teacher.user.firstName} ${teacher.user.lastName}`,
  }));

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ink-muted">{t("eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black">{t("title")}</h1>
          <p className="mt-2 text-ink-muted">{t("description")}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${params.locale}/admin/calendar?week=${addDateKey(weekStartKey, -7)}`}
            className="inline-flex min-h-11 items-center rounded-sm border border-border bg-card px-4 font-bold"
          >
            {t("previous")}
          </Link>
          <Link
            href={`/${params.locale}/admin/calendar?week=${addDateKey(weekStartKey, 7)}`}
            className="inline-flex min-h-11 items-center rounded-sm border border-border bg-card px-4 font-bold"
          >
            {t("next")}
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
        <div className="grid min-w-[76rem] grid-cols-[12rem_repeat(7,minmax(9rem,1fr))]">
          <div className="border-b border-e border-border p-3 font-bold">
            {t("instructor")}
          </div>
          {days.map((day) => (
            <div
              key={day}
              className="border-b border-e border-border p-3 text-center font-bold last:border-e-0"
            >
              {dayFormatter.format(fromZonedTime(`${day}T12:00:00`, TIME_ZONE))}
            </div>
          ))}
          {teachers.map((teacher) => (
            <div className="contents" key={teacher.id}>
              <div className="border-b border-e border-border p-3 font-bold">
                {teacher.user.firstName} {teacher.user.lastName}
              </div>
              {days.map((day) => {
                const bookings = teacher.bookings.filter(
                  (booking) =>
                    formatInTimeZone(booking.startsAt, TIME_ZONE, "yyyy-MM-dd") ===
                    day,
                );
                return (
                  <div
                    key={day}
                    className="min-h-32 border-b border-e border-border p-2 last:border-e-0"
                  >
                    <div className="grid gap-2">
                      {bookings.map((booking) => (
                        <article
                          key={booking.id}
                          className="rounded-sm border border-border bg-page p-2 text-sm"
                        >
                          <p className="font-black" dir="ltr">
                            {timeFormatter.format(booking.startsAt)}
                          </p>
                          <p className="mt-1 font-bold">
                            {booking.student.firstName}{" "}
                            {booking.student.lastName}
                          </p>
                          {booking.location ? (
                            <p className="mt-1 text-xs text-ink-muted">
                              {booking.location.name}
                            </p>
                          ) : null}
                          {booking.status === "CONFIRMED" ? (
                            <AdminBookingControls
                              bookingId={booking.id}
                              startsAt={booking.startsAt.toISOString()}
                              teachers={teacherOptions}
                              currentTeacherId={teacher.id}
                            />
                          ) : (
                            <p className="mt-2 text-xs text-ink-muted">
                              {t("completed")}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {!teachers.length ? (
        <p className="mt-6 rounded-md border border-border bg-card p-6 text-ink-muted">
          {t("empty")}
        </p>
      ) : null}
    </section>
  );
}
