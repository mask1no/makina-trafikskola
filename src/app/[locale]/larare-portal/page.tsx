import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

import { blockAvailability, reportLesson } from "./actions";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Europe/Stockholm";

export default async function TeacherPortal(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
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
      select: { id: true },
    }),
  ]);
  if (!teacher) {
    return <p className="mx-auto max-w-3xl px-4 py-12">{t("noProfile")}</p>;
  }

  const now = new Date();
  const localDay = formatInTimeZone(now, TIME_ZONE, "yyyy-MM-dd");
  const dayStart = fromZonedTime(`${localDay}T00:00:00`, TIME_ZONE);
  const dayEnd = fromZonedTime(`${localDay}T23:59:59.999`, TIME_ZONE);
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
  const timeFormatter = new Intl.DateTimeFormat(params.locale, {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  const tomorrow = formatInTimeZone(addDays(now, 1), TIME_ZONE, "yyyy-MM-dd");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <section>
        <p className="text-sm font-bold text-ink-muted">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black">{t("title")}</h1>
        <p className="mt-2 text-ink-muted">
          {t("lessonCount", { count: lessons.length })}
        </p>
        <div className="mt-6 grid gap-4">
          {lessons.map((lesson, index) => {
            const address = lesson.pickupAddress ?? lesson.location?.address;
            const previous = previousNotes[index]?.lessonReport;
            return (
              <article key={lesson.id} className="rounded-md border border-border bg-card p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <p className="text-2xl font-black" dir="ltr">
                    {timeFormatter.format(lesson.startsAt)}
                  </p>
                  <div>
                    <h2 className="text-lg font-bold">
                      {lesson.student.firstName} {lesson.student.lastName}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      {lesson.student.phone ? (
                        <a className="inline-flex min-h-11 items-center font-bold underline" href={`tel:${lesson.student.phone}`}>
                          {t("call")}
                        </a>
                      ) : null}
                      {address ? (
                        <a
                          className="inline-flex min-h-11 items-center font-bold underline"
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t("openAddress")}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-sm bg-page p-4">
                  <p className="text-sm font-bold">{t("previousNote")}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {previous?.nextFocus ?? previous?.summary ?? t("noPreviousNote")}
                  </p>
                </div>
                <form action={reportLesson} className="mt-4 grid gap-3">
                  <input type="hidden" name="bookingId" value={lesson.id} />
                  <input type="hidden" name="locale" value={params.locale} />
                  <label className="text-sm font-bold" htmlFor={`summary-${lesson.id}`}>
                    {t("summary")}
                  </label>
                  <textarea
                    id={`summary-${lesson.id}`}
                    name="summary"
                    defaultValue={lesson.lessonReport?.summary ?? ""}
                    className="min-h-24 rounded-sm border border-border bg-card p-3"
                  />
                  <label className="text-sm font-bold" htmlFor={`focus-${lesson.id}`}>
                    {t("nextFocus")}
                  </label>
                  <input
                    id={`focus-${lesson.id}`}
                    name="nextFocus"
                    defaultValue={lesson.lessonReport?.nextFocus ?? ""}
                    className="min-h-11 rounded-sm border border-border bg-card px-3"
                  />
                  <button className="min-h-11 rounded-sm bg-accent px-4 font-bold text-accent-ink" type="submit">
                    {lesson.status === "COMPLETED" ? t("updateReport") : t("completeLesson")}
                  </button>
                </form>
              </article>
            );
          })}
          {!lessons.length ? (
            <p className="rounded-md border border-border bg-card p-6 text-ink-muted">
              {t("empty")}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-10 rounded-md border border-border bg-card p-5">
        <h2 className="text-xl font-bold">{t("block.title")}</h2>
        <p className="mt-2 text-sm text-ink-muted">{t("block.description")}</p>
        <form action={blockAvailability} className="mt-5 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="locale" value={params.locale} />
          <div className="grid gap-2 sm:col-span-2">
            <label htmlFor="block-date" className="text-sm font-bold">{t("block.date")}</label>
            <input id="block-date" name="date" type="date" defaultValue={tomorrow} required className="min-h-11 rounded-sm border border-border px-3" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="block-start" className="text-sm font-bold">{t("block.start")}</label>
            <input id="block-start" name="startTime" type="time" className="min-h-11 rounded-sm border border-border px-3" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="block-end" className="text-sm font-bold">{t("block.end")}</label>
            <input id="block-end" name="endTime" type="time" className="min-h-11 rounded-sm border border-border px-3" />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <label htmlFor="block-reason" className="text-sm font-bold">{t("block.reason")}</label>
            <input id="block-reason" name="reason" className="min-h-11 rounded-sm border border-border px-3" />
          </div>
          <button className="min-h-11 rounded-sm bg-accent px-4 font-bold text-accent-ink sm:col-span-2" type="submit">
            {t("block.submit")}
          </button>
        </form>
      </section>
    </div>
  );
}
