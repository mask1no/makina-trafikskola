import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { isLocale } from "@/i18n/routing";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/pricing/format";

import { CourseBookingControl } from "./CourseBookingControl";

export const dynamic = "force-dynamic";

export default async function KurserPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const holdMinutes = Math.max(
    1,
    Number.parseInt(process.env.BOOKING_HOLD_MINUTES ?? "15", 10) || 15,
  );
  const now = new Date();
  const holdCutoff = new Date(now.getTime() - holdMinutes * 60_000);
  const [t, authT, occasions, session] = await Promise.all([
    getTranslations("courses"),
    getTranslations("auth"),
    db.courseOccasion.findMany({
      where: { cancelled: false, startsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      include: {
        course: {
          include: {
            product: { include: { translations: true } },
          },
        },
        _count: {
          select: {
            bookings: {
              where: {
                OR: [
                  { status: { in: ["CONFIRMED", "COMPLETED"] } },
                  {
                    status: "PENDING_PAYMENT",
                    createdAt: { gt: holdCutoff },
                  },
                ],
              },
            },
          },
        },
      },
    }),
    auth(),
  ]);
  const formatter = new Intl.DateTimeFormat(params.locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Stockholm",
  });

  return (
    <div className="section-shell">
      <div className="site-container max-w-6xl">
        <div>
          <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        </div>
        {occasions.length ? (
          <div className="mt-12 grid gap-5">
            {occasions.map((occasion) => {
              const content = resolveContent(
                occasion.course.product.translations,
                params.locale,
              );
              if (!content.translation) return null;
              const seatsLeft = Math.max(
                0,
                occasion.capacity - occasion._count.bookings,
              );
              return (
                <article
                  key={occasion.id}
                  className="rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <Badge>
                        {t(`kind.${occasion.course.kind}`)}
                      </Badge>
                      <h2 className="mt-1 text-2xl font-black">
                        {content.translation.name}
                      </h2>
                    </div>
                    <strong className="[direction:ltr]">
                      {formatPrice(
                        occasion.course.product.priceOre,
                        params.locale,
                      )}
                    </strong>
                  </div>
                  <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div><dt className="font-bold">{t("when")}</dt><dd>{formatter.format(occasion.startsAt)}</dd></div>
                    <div><dt className="font-bold">{t("language")}</dt><dd>{occasion.language}</dd></div>
                    <div><dt className="font-bold">{t("venue")}</dt><dd>{occasion.venueName}</dd></div>
                    <div><dt className="font-bold">{t("seats")}</dt><dd>{t("seatsLeft", { count: seatsLeft })}</dd></div>
                  </dl>
                  {!occasion.course.product.active ? (
                    <p className="mt-5 rounded-sm border border-border bg-page p-3 text-sm text-ink-muted">
                      {t("inactive")}
                    </p>
                  ) : null}
                  <CourseBookingControl
                    occasionId={occasion.id}
                    disabled={seatsLeft === 0}
                    authenticated={session?.user.role === "STUDENT"}
                    signInHref={`/${params.locale}/logga-in?next=${encodeURIComponent(`/${params.locale}/kurser`)}`}
                    accountRequired={authT("purchaseGate")}
                    signInToBuy={authT("signInToBuy")}
                  />
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          </div>
        )}
      </div>
    </div>
  );
}
