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
    searchParams: Promise<{ week?: string; teacher?: string }>;
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
  const selectedTeacher = teachers.some((teacher) => teacher.id === searchParams.teacher)
    ? searchParams.teacher
    : undefined;
  const visibleTeachers = selectedTeacher
    ? teachers.filter((teacher) => teacher.id === selectedTeacher)
    : teachers;
  const days = Array.from({ length: 7 }, (_, index) =>
    addDateKey(weekStartKey, index),
  );
  const hourStart = 7;
  const hourEnd = 21;
  const hourHeight = 48;
  const dayBookings = (day: string) =>
    visibleTeachers.flatMap((teacher) =>
      teacher.bookings
        .filter(
          (booking) =>
            formatInTimeZone(booking.startsAt, TIME_ZONE, "yyyy-MM-dd") === day,
        )
        .map((booking) => ({ booking, teacher })),
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
    <section className="flex flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          <>
          <LinkButton
            variant="tertiary"
            href={`/${params.locale}/admin/calendar?week=${addDateKey(weekStartKey, -7)}${selectedTeacher ? `&teacher=${selectedTeacher}` : ""}`}
          >
            {t("previous")}
          </LinkButton>
          <LinkButton
            variant="tertiary"
            href={`/${params.locale}/admin/calendar?week=${addDateKey(weekStartKey, 7)}${selectedTeacher ? `&teacher=${selectedTeacher}` : ""}`}
          >
            {t("next")}
          </LinkButton>
          </>
        }
      />

      <div className="order-2 mt-6 grid gap-4 xl:hidden">
        {days.map((day) => {
          const dayItems = visibleTeachers.flatMap((teacher) =>
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
                {dayItems.map(({ booking, teacher }) => (
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

      <div className="order-1 mt-6 overflow-x-auto rounded-md border border-border bg-card shadow-soft">
        <div className="grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] border-b border-border">
          <div />
          {days.map((day) => (
            <div key={day} className="border-s border-border px-2 py-3 text-center text-small font-bold">
              {formatDay(fromZonedTime(`${day}T12:00:00`, TIME_ZONE))}
            </div>
          ))}
        </div>
        <div className="grid min-w-[52rem] max-h-[42rem] grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] overflow-y-auto">
          <div>
            {Array.from({ length: hourEnd - hourStart }, (_, index) => (
              <div key={index} className="relative border-b border-border pe-2 text-end text-xs text-ink-muted" style={{ height: hourHeight }}>
                <span className="numbers-ltr absolute -top-2 end-2">{String(hourStart + index).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day} className="relative border-s border-border" style={{ height: (hourEnd - hourStart) * hourHeight }}>
              {Array.from({ length: hourEnd - hourStart }, (_, index) => (
                <div key={index} className="border-b border-border" style={{ height: hourHeight }} />
              ))}
              {dayBookings(day).map(({ booking, teacher }) => {
                const start = Number(formatInTimeZone(booking.startsAt, TIME_ZONE, "H")) * 60
                  + Number(formatInTimeZone(booking.startsAt, TIME_ZONE, "m"));
                const end = Number(formatInTimeZone(booking.endsAt, TIME_ZONE, "H")) * 60
                  + Number(formatInTimeZone(booking.endsAt, TIME_ZONE, "m"));
                const top = Math.max(0, (start - hourStart * 60) * (hourHeight / 60));
                const height = Math.max(28, (end - start) * (hourHeight / 60));
                return (
                  <article
                    key={booking.id}
                    className="absolute inset-x-1 overflow-hidden rounded-sm border border-border bg-accent-soft p-1 text-xs"
                    style={{ top, height }}
                  >
                    <p className="font-black" dir="ltr">{formatLessonTime(booking.startsAt, params.locale)}</p>
                    <p className="truncate font-bold">{booking.student.firstName} {booking.student.lastName}</p>
                    <p className="truncate text-ink-muted">{teacher.user.firstName}</p>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="order-3 mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href={`/${params.locale}/admin/calendar?week=${weekStartKey}`}
          className={`rounded-md border bg-card p-4 font-bold shadow-soft ${selectedTeacher ? "border-border" : "border-ink"}`}
        >
          {t("allTeachers")}
        </a>
        {teachers.map((teacher) => (
          <a
            key={teacher.id}
            href={`/${params.locale}/admin/calendar?week=${weekStartKey}&teacher=${teacher.id}`}
            className={`rounded-md border bg-card p-4 shadow-soft ${selectedTeacher === teacher.id ? "border-ink" : "border-border"}`}
          >
            <p className="font-black">{teacher.user.firstName} {teacher.user.lastName}</p>
            <p className="mt-1 text-small text-ink-muted">{t("lessonCount", { count: teacher.bookings.length })}</p>
          </a>
        ))}
      </div>
      {!teachers.length ? (
        <p className="mt-6 rounded-md border border-border bg-card p-6 text-ink-muted">
          {t("empty")}
        </p>
      ) : null}
    </section>
  );
}
