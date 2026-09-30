import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getAvailableCreditBalance } from "@/lib/credits/ledger";
import { db } from "@/lib/db";
import { getActiveTheoryAccess } from "@/lib/theory/access";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";

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
    getActiveTheoryAccess(db, studentId, now),
  ]);

  const date = nextBooking
    ? new Intl.DateTimeFormat(params.locale, {
        timeZone: "Europe/Stockholm",
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        numberingSystem: "latn",
      }).format(nextBooking.startsAt)
    : null;

  return (
    <section>
      <PageHeader title={t("title")} />
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <article className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-8">
          <p className="text-sm font-bold text-ink-muted">{t("nextBooking")}</p>
          {nextBooking ? (
            <>
              <p className="mt-3 break-words text-2xl font-black tracking-tight sm:text-3xl">
                <bdi dir="ltr">{date}</bdi>
              </p>
              <p className="mt-2 text-ink-muted">
                <bdi>
                  {nextBooking.teacher.user.firstName}{" "}
                  {nextBooking.teacher.user.lastName}
                </bdi>
              </p>
            </>
          ) : (
            <p className="mt-3 leading-7 text-ink-muted">{t("noBooking")}</p>
          )}
          <LinkButton className="mt-6" href={`/${params.locale}/mina-sidor/bokningar`}>
            {t("viewBookings")}
          </LinkButton>
        </article>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            label={t("saldo")}
            value={t("lessonsLeft", { count: credits.balance })}
            detail={<Link className="inline-flex min-h-11 items-center font-bold underline" href={`/${params.locale}/mina-sidor/lektioner`}>{t("viewSaldo")}</Link>}
          />
          <StatCard
            label={t("theory")}
            value={theoryAccess ? t("theoryActive") : t("theoryInactive")}
            className="[&_[class*='text-3xl']]:text-lg"
            detail={<Link className="inline-flex min-h-11 items-center font-bold underline" href={`/${params.locale}/mina-sidor/teori`}>{t("viewTheory")}</Link>}
          />
        </div>
      </div>
    </section>
  );
}
