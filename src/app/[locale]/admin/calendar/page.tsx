import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { getTranslations } from "next-intl/server";

import { formatDate, formatLessonTime } from "@/lib/format/datetime";
import { db } from "@/lib/db";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

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
  const formatDay = (date: Date) =>
    formatDate(date, params.locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  const teacherOptions = teachers.map((teacher) => ({
    id: teacher.id,
    name: `${teacher.user.firstName} ${teacher.user.lastName}`,
  }));

  return (
    <section>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          <>
          <LinkButton
            variant="tertiary"
            href={`/${params.locale}/admin/calendar?week=${addDateKey(weekStartKey, -7)}`}
          >
            {t("previous")}
          </LinkButton>
          <LinkButton
            variant="tertiary"
            href={`/${params.locale}/admin/calendar?week=${addDateKey(weekStartKey, 7)}`}
          >
            {t("next")}
          </LinkButton>
          </>
        }
      />

      <div className="mt-6 grid gap-4 md:hidden">
        {days.map((day) => {
          const dayBookings = teachers.flatMap((teacher) =>
            teacher.bookings
              .filter(
                (booking) =>
                  formatInTimeZone(booking.startsAt, TIME_ZONE, "yyyy-MM-dd") === day,
              )
              .map((booking) => ({ booking, teacher })),
          );
          return (
            <section key={day} className="rounded-md border border-border bg-card p-4 shadow-soft">
              <h2 className="font-black">
                {formatDay(fromZonedTime(`${day}T12:00:00`, TIME_ZONE))}
              </h2>
              <div className="mt-3 grid gap-3">
                {dayBookings.map(({ booking, teacher }) => (
                  <article key={booking.id} className="rounded-sm border border-border bg-card-muted p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black numbers-ltr">{formatLessonTime(booking.startsAt, params.locale)}</p>
                        <p className="mt-1 font-bold">{booking.student.firstName} {booking.student.lastName}</p>
                      </div>
                      <p className="text-sm text-ink-muted">{teacher.user.firstName} {teacher.user.lastName}</p>
                    </div>
                    {booking.location ? <p className="mt-2 text-sm text-ink-muted">{booking.location.name}</p> : null}
                    {booking.status === "CONFIRMED" ? (
                      <AdminBookingControls
                        bookingId={booking.id}
                        startsAt={booking.startsAt.toISOString()}
                        teachers={teacherOptions}
                        currentTeacherId={teacher.id}
                      />
                    ) : (
                      <p className="mt-2 text-sm text-ink-muted">{t("completed")}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-md border border-border bg-card shadow-soft md:block">
        <div className="grid min-w-[76rem] grid-cols-[12rem_repeat(7,minmax(9rem,1fr))]">
          <div className="border-b border-e border-border p-3 font-bold">
            {t("instructor")}
          </div>
          {days.map((day) => (
            <div
              key={day}
              className="border-b border-e border-border p-3 text-center font-bold last:border-e-0"
            >
              {formatDay(fromZonedTime(`${day}T12:00:00`, TIME_ZONE))}
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
                            {formatLessonTime(booking.startsAt, params.locale)}
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
