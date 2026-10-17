import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getAvailableCreditBalance } from "@/lib/credits/ledger";
import { formatStockholm } from "@/lib/format/datetime";
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
      where: {
        studentId,
        status: "CONFIRMED",
        startsAt: { gt: now },
        OR: [
          { creditCharged: true },
          { creditCharged: false, holdExpiresAt: { gt: now } },
        ],
      },
      orderBy: { startsAt: "asc" },
      include: { teacher: { include: { user: true } } },
    }),
    getAvailableCreditBalance(db, studentId, now),
    getActiveTheoryAccess(db, studentId, now),
  ]);

  const date = nextBooking
    ? formatStockholm(nextBooking.startsAt, params.locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const unpaidHold =
    Boolean(nextBooking) &&
    !nextBooking?.creditCharged &&
    Boolean(nextBooking?.holdExpiresAt && nextBooking.holdExpiresAt > now);
  const holdExpires = nextBooking?.holdExpiresAt
    ? formatStockholm(nextBooking.holdExpiresAt, params.locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <section>
      <PageHeader title={t("title")} />
      <div className="mt-8 grid gap-4">
        <article className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-8">
          <p className="text-sm font-bold text-ink-muted">
            {t(unpaidHold ? "paymentRequired" : "nextBooking")}
          </p>
          {nextBooking ? (
            <>
              <p className="mt-3 break-words text-3xl font-black tracking-tight sm:text-4xl">
                <bdi>{date}</bdi>
              </p>
              <p className="mt-2 text-lg text-ink-muted">
                <bdi>
                  {nextBooking.teacher.user.firstName}{" "}
                  {nextBooking.teacher.user.lastName}
                </bdi>
              </p>
              {unpaidHold && holdExpires ? (
                <p className="mt-4 rounded-sm border border-accent bg-accent-soft p-3 text-sm font-bold">
                  {t.rich("holdUntil", {
                    deadline: holdExpires,
                    time: (chunks) => <bdi>{chunks}</bdi>,
                  })}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-lg leading-7 text-ink-muted">{t("noBooking")}</p>
          )}
          <LinkButton className="mt-6" href={`/${params.locale}/mina-sidor/bokningar`}>
            {t("viewBookings")}
          </LinkButton>
        </article>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            size="sm"
            label={t("saldo")}
            value={t("lessonsLeft", { count: credits.balance, n: String(credits.balance) })}
            detail={<Link className="inline-flex min-h-11 items-center font-bold" href={`/${params.locale}/mina-sidor/lektioner`}>{t("viewSaldo")}</Link>}
          />
          <StatCard
            size="sm"
            label={t("theory")}
            value={theoryAccess ? t("theoryActive") : t("theoryInactive")}
            detail={<Link className="inline-flex min-h-11 items-center font-bold" href={`/${params.locale}/mina-sidor/teori`}>{t("viewTheory")}</Link>}
          />
        </div>
      </div>
    </section>
  );
}
