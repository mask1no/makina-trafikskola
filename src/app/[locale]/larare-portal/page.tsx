import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Textarea } from "@/components/Textarea";
import { formatLessonDateTime, formatLessonTime } from "@/lib/format/datetime";
import { displayPhone, telHref } from "@/lib/format/phone";
import { db } from "@/lib/db";

import {
  blockAvailability,
  createCalendarToken,
  reportLesson,
  rotateCalendarToken,
} from "./actions";
import { CalendarLink } from "./CalendarLink";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Europe/Stockholm";

export default async function TeacherPortal(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ view?: string; error?: string }>;
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const view = searchParams.view === "week" ? "week" : "today";
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/${params.locale}/logga-in?callbackUrl=${encodeURIComponent(`/${params.locale}/larare-portal`)}`,
    );
  }
  if (!["TEACHER", "ADMIN"].includes(session.user.role)) {
    redirect(`/${params.locale}`);
  }

  const [t, teacher] = await Promise.all([
    getTranslations("teacherPortal"),
    db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        calendarToken: true,
        user: { select: { phone: true } },
      },
    }),
  ]);
  if (!teacher) {
    return <p className="mx-auto max-w-3xl px-4 py-12">{t("noProfile")}</p>;
  }

  const now = new Date();
  const localDay = formatInTimeZone(now, TIME_ZONE, "yyyy-MM-dd");
  const dayStart = fromZonedTime(`${localDay}T00:00:00`, TIME_ZONE);
  const rangeEndKey = formatInTimeZone(
    addDays(now, view === "week" ? 6 : 0),
    TIME_ZONE,
    "yyyy-MM-dd",
  );
  const dayEnd = fromZonedTime(`${rangeEndKey}T23:59:59.999`, TIME_ZONE);
  const lessons = await db.booking.findMany({
    where: {
      teacherId: teacher.id,
      startsAt: { gte: dayStart, lte: dayEnd },
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    orderBy: { startsAt: "asc" },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, phone: true },
      },
      location: { select: { name: true, address: true } },
      lessonReport: true,
    },
  });
  const previousNotes = await Promise.all(
    lessons.map((lesson) =>
      db.booking.findFirst({
        where: {
          studentId: lesson.student.id,
          teacherId: teacher.id,
          startsAt: { lt: lesson.startsAt },
          lessonReport: { isNot: null },
        },
        orderBy: { startsAt: "desc" },
        select: { lessonReport: { select: { summary: true, nextFocus: true } } },
      }),
    ),
  );
  const pupils = await db.user.findMany({
    where: {
      deletedAt: null,
      bookings: {
        some: {
          teacherId: teacher.id,
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      bookings: {
        where: { teacherId: teacher.id },
        select: { startsAt: true, status: true },
        orderBy: { startsAt: "asc" },
      },
    },
  });
  const formatSlot = (date: Date) =>
    view === "week"
      ? formatLessonDateTime(date, params.locale)
      : formatLessonTime(date, params.locale);
  const tomorrow = formatInTimeZone(addDays(now, 1), TIME_ZONE, "yyyy-MM-dd");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <section>
        {searchParams.error === "LESSON_NOT_STARTED" ? (
          <Notice tone="danger" className="mt-4">{t("lessonNotStarted")}</Notice>
        ) : null}
        {!teacher.user.phone ? (
          <Notice tone="danger" className="mt-4">{t("noPhone")}</Notice>
        ) : null}
        <PageHeader
          eyebrow={t("eyebrow")}
          title={view === "week" ? t("weekTitle") : t("title")}
          description={t(view === "week" ? "weekCount" : "lessonCount", { count: lessons.length, n: String(lessons.length) })}
        />
        <div className="mt-6 grid grid-cols-2 gap-2">
          {(["today", "week"] as const).map((value) => (
            <Link
              key={value}
              href={`/${params.locale}/larare-portal${value === "week" ? "?view=week" : ""}`}
              aria-current={view === value ? "page" : undefined}
              className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border bg-card px-3 text-sm font-bold aria-[current=page]:border-ink aria-[current=page]:bg-surface aria-[current=page]:text-ink-inverse"
            >
              {t(`views.${value}`)}
            </Link>
          ))}
        </div>
        <div className="relative mt-8 grid gap-4 sm:before:absolute sm:before:bottom-6 sm:before:start-[3.45rem] sm:before:top-6 sm:before:w-px sm:before:bg-border">
          {lessons.map((lesson, index) => {
            const pickup = lesson.pickupAddress;
            const address = pickup ?? lesson.location?.address;
            const previous = previousNotes[index]?.lessonReport;
            const mapsHref = address
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
              : null;
            return (
              <article key={lesson.id} className="relative min-w-0 rounded-md border border-border bg-card p-5 shadow-soft sm:ms-28 sm:p-6">
                <p className="text-sm font-black numbers-ltr sm:absolute sm:end-[calc(100%+1.25rem)] sm:top-4 sm:rounded-sm sm:border sm:border-border sm:bg-card sm:px-2 sm:py-1" dir="ltr">
                    <bdi>{formatSlot(lesson.startsAt)}</bdi>
                </p>
                <span aria-hidden="true" className="absolute top-7 hidden size-3 rounded-full border-2 border-card bg-accent sm:block sm:-start-[5.2rem]" />
                <div className="min-w-0">
                    <h2 className="break-words text-lg font-bold">
                      {lesson.student.firstName} {lesson.student.lastName}
                    </h2>
                    {!lesson.creditCharged ? (
                      <Badge className="mt-2" tone="danger">{t("awaitingPayment")}</Badge>
                    ) : null}
                    <div className="mt-2 grid text-sm">
                      {lesson.student.phone ? (
                        <a className="inline-flex min-h-11 items-center font-bold underline" href={telHref(lesson.student.phone)} dir="ltr">
                          <bdi>{displayPhone(lesson.student.phone)}</bdi>
                        </a>
                      ) : null}
                      {mapsHref ? (
                        <a
                          className="inline-flex min-h-11 items-center break-words font-bold underline"
                          href={mapsHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {pickup ?? lesson.location?.name ?? address}
                        </a>
                      ) : null}
                      <a
                        href={`#lesson-report-${lesson.id}`}
                        className="inline-flex min-h-11 items-center font-bold underline"
                      >
                        {lesson.status === "COMPLETED" ? t("updateReport") : t("completeLesson")}
                      </a>
                    </div>
                </div>
                <div className="mt-4 min-w-0 rounded-sm bg-page p-4">
                  <p className="text-sm font-bold">{t("previousNote")}</p>
                  <p className="mt-1 truncate text-sm text-ink-muted">
                    {previous?.nextFocus ?? previous?.summary ?? t("noPreviousNote")}
                  </p>
                </div>
                {lesson.creditCharged ? (
                <form id={`lesson-report-${lesson.id}`} action={reportLesson} className="mt-4 grid scroll-mt-24 gap-3">
                  <input type="hidden" name="bookingId" value={lesson.id} />
                  <input type="hidden" name="locale" value={params.locale} />
                  <Textarea
                    id={`summary-${lesson.id}`}
                    name="summary"
                    label={t("summary")}
                    defaultValue={lesson.lessonReport?.summary ?? ""}
                    className="min-h-24"
                  />
                  <Input
                    id={`focus-${lesson.id}`}
                    name="nextFocus"
                    label={t("nextFocus")}
                    defaultValue={lesson.lessonReport?.nextFocus ?? ""}
                  />
                  <Button type="submit">
                    {lesson.status === "COMPLETED" ? t("updateReport") : t("completeLesson")}
                  </Button>
                </form>
                ) : null}
              </article>
            );
          })}
          {!lessons.length ? (
            <div className="relative z-10 bg-page"><EmptyState title={view === "week" ? t("weekEmpty") : t("empty")} description={t(view === "week" ? "weekCount" : "lessonCount", { count: 0, n: "0" })} /></div>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black">{t("students.title")}</h2>
        <div className="mt-4 grid gap-3">
          {pupils.map((pupil) => {
            const done = pupil.bookings.filter((booking) => booking.status === "COMPLETED").length;
            const nextLesson = pupil.bookings.find(
              (booking) => booking.status === "CONFIRMED" && booking.startsAt > now,
            );
            return (
              <article key={pupil.id} className="rounded-md border border-border bg-card p-4 shadow-soft">
                <h3 className="text-lg font-bold">
                  {pupil.firstName} {pupil.lastName}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {t("students.lessonsDone", { count: done, n: String(done) })}
                </p>
                <p className="mt-1 break-words text-sm text-ink">
                  {nextLesson
                    ? t.rich("students.nextLesson", {
                        when: formatLessonDateTime(nextLesson.startsAt, params.locale),
                        time: (chunks) => <bdi>{chunks}</bdi>,
                      })
                    : t("students.noNext")}
                </p>
              </article>
            );
          })}
          {!pupils.length ? (
            <EmptyState title={t("students.empty")} description={t("students.noNext")} />
          ) : null}
        </div>
      </section>

      <section className="mt-10 rounded-md border border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 className="text-xl font-bold">{t("calendar.title")}</h2>
        <p className="mt-2 text-sm text-ink-muted">{t("calendar.description")}</p>
        <p className="mt-2 text-sm text-ink-muted">{t("calendar.delay")}</p>
        {teacher.calendarToken ? (
          <>
            <CalendarLink
              url={`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/teachers/calendar/${teacher.calendarToken}`}
              label={t("calendar.copy")}
            />
            <form action={rotateCalendarToken} className="mt-3">
              <Button type="submit" variant="tertiary">{t("calendar.rotate")}</Button>
            </form>
          </>
        ) : (
          <form action={createCalendarToken} className="mt-4">
            <Button type="submit">{t("calendar.create")}</Button>
          </form>
        )}
      </section>

      <section className="mt-10 rounded-md border border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 className="text-xl font-bold">{t("block.title")}</h2>
        <p className="mt-2 text-sm text-ink-muted">{t("block.description")}</p>
        <form action={blockAvailability} className="mt-5 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="locale" value={params.locale} />
          <div className="sm:col-span-2">
            <Input id="block-date" name="date" type="date" label={t("block.date")} defaultValue={tomorrow} required />
          </div>
          <Input id="block-start" name="startTime" type="time" label={t("block.start")} />
          <Input id="block-end" name="endTime" type="time" label={t("block.end")} />
          <div className="sm:col-span-2">
            <Input id="block-reason" name="reason" label={t("block.reason")} />
          </div>
          <Button className="sm:col-span-2" type="submit">
            {t("block.submit")}
          </Button>
        </form>
      </section>
    </div>
  );
}
