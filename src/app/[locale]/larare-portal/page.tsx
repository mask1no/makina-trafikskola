import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Textarea } from "@/components/Textarea";
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
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("lessonCount", { count: lessons.length })}
        />
        <div className="relative mt-8 grid gap-4 before:absolute before:bottom-6 before:start-[1.4rem] before:top-6 before:w-px before:bg-border sm:before:start-[3.45rem]">
          {lessons.map((lesson, index) => {
            const address = lesson.pickupAddress ?? lesson.location?.address;
            const previous = previousNotes[index]?.lessonReport;
            return (
              <article key={lesson.id} className="relative ms-12 rounded-md border border-border bg-card p-5 shadow-soft sm:ms-28 sm:p-6">
                <p className="absolute end-[calc(100%+1rem)] top-4 rounded-sm border border-border bg-card px-2 py-1 text-sm font-black numbers-ltr sm:end-[calc(100%+1.25rem)]" dir="ltr">
                    {timeFormatter.format(lesson.startsAt)}
                </p>
                <span aria-hidden="true" className="absolute -start-[1.95rem] top-7 size-3 rounded-full border-2 border-card bg-accent sm:-start-[5.2rem]" />
                <div className="flex flex-wrap items-start justify-between gap-4">
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
              </article>
            );
          })}
          {!lessons.length ? (
            <div className="relative z-10 bg-page"><EmptyState title={t("empty")} description={t("lessonCount", { count: 0 })} /></div>
          ) : null}
        </div>
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
