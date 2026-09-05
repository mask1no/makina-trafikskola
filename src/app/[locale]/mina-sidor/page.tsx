import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getAvailableCreditBalance } from "@/lib/credits/ledger";
import { db } from "@/lib/db";

import { requireStudent } from "./_lib";

export const dynamic = "force-dynamic";

export default async function StudentDashboard(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const studentId = await requireStudent(params.locale);
  const now = new Date();
  const [t, nextBooking, credits, theoryAccess] = await Promise.all([
    getTranslations("student.overview"),
    db.booking.findFirst({
      where: { studentId, status: "CONFIRMED", startsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      include: { teacher: { include: { user: true } } },
    }),
    getAvailableCreditBalance(db, studentId, now),
    db.theoryAccess.findFirst({
      where: { studentId, expiresAt: { gt: now } },
      orderBy: { expiresAt: "desc" },
    }),
  ]);

  const date = nextBooking
    ? new Intl.DateTimeFormat(params.locale, {
        timeZone: "Europe/Stockholm",
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(nextBooking.startsAt)
    : null;

  return (
    <section>
      <h1 className="text-3xl font-black">{t("title")}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-md border border-border bg-card p-5">
          <h2 className="font-bold">{t("nextBooking")}</h2>
          {nextBooking ? (
            <>
              <p className="mt-3 text-lg font-bold">{date}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {nextBooking.teacher.user.firstName}{" "}
                {nextBooking.teacher.user.lastName}
              </p>
            </>
          ) : (
            <p className="mt-3 text-ink-muted">{t("noBooking")}</p>
          )}
          <Link className="mt-4 inline-flex min-h-11 items-center font-bold underline" href={`/${params.locale}/mina-sidor/bokningar`}>
            {t("viewBookings")}
          </Link>
        </article>
        <article className="rounded-md border border-border bg-card p-5">
          <h2 className="font-bold">{t("saldo")}</h2>
          <p className="mt-3 text-3xl font-black">{credits.balance}</p>
          <Link className="mt-4 inline-flex min-h-11 items-center font-bold underline" href={`/${params.locale}/mina-sidor/saldo`}>
            {t("viewSaldo")}
          </Link>
        </article>
        <article className="rounded-md border border-border bg-card p-5">
          <h2 className="font-bold">{t("theory")}</h2>
          <p className="mt-3 text-ink-muted">
            {theoryAccess ? t("theoryActive") : t("theoryInactive")}
          </p>
          <Link className="mt-4 inline-flex min-h-11 items-center font-bold underline" href={`/${params.locale}/mina-sidor/teori`}>
            {t("viewTheory")}
          </Link>
        </article>
      </div>
    </section>
  );
}
