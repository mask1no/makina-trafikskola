import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { Badge } from "@/components/Badge";
import { CallButton } from "@/components/ContactButtons";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";
import { formatStockholm } from "@/lib/format/datetime";
import { formatPrice } from "@/lib/pricing/format";

import { CourseBookingControl } from "../kurser/CourseBookingControl";

export async function CourseOccasions({ locale }: { locale: string }) {
  const holdMinutes = Math.max(
    1,
    Number.parseInt(process.env.BOOKING_HOLD_MINUTES ?? "15", 10) || 15,
  );
  const now = new Date();
  const courseKinds = ["RISK1", "RISK2"] as const;
  const holdCutoff = new Date(now.getTime() - holdMinutes * 60_000);
  const [session, t, authT, company, occasions] = await Promise.all([
    auth(),
    getTranslations("courses"),
    getTranslations("auth"),
    getTranslations("company"),
    db.courseOccasion.findMany({
      where: {
        cancelled: false,
        startsAt: { gt: now },
        course: { kind: { in: [...courseKinds] } },
      },
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
  ]);
  const formatOccasion = (date: Date) =>
    formatStockholm(date, locale, {
      dateStyle: "long",
      timeStyle: "short",
    });
  const authenticated = session?.user?.role === "STUDENT";
  const nextByKind = new Map<string, (typeof occasions)[number]>();
  for (const occasion of occasions) {
    if (!nextByKind.has(occasion.course.kind)) {
      nextByKind.set(occasion.course.kind, occasion);
    }
  }
  const shown = ["RISK1", "RISK2"].flatMap((kind) => {
    const occasion = nextByKind.get(kind);
    return occasion ? [occasion] : [];
  });
  if (!shown.length) return null;

  return (
    <div className="mt-8 grid gap-5">
      <h3 className="text-xl font-black">{t("title")}</h3>
      {shown.map((occasion) => {
        const content = resolveContent(
          occasion.course.product.translations,
          locale,
        );
        if (!content.translation) return null;
        const seatsLeft = Math.max(
          0,
          occasion.capacity - occasion._count.bookings,
        );
        const kindLabel = t(`kind.${occasion.course.kind}`);
        const showKind = kindLabel !== content.translation.name;
        return (
          <article
            key={occasion.id}
            className="rounded-lg border border-border bg-card p-6 shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                {showKind ? <Badge>{kindLabel}</Badge> : null}
                <h4 className={`${showKind ? "mt-1" : ""} text-xl font-black`}>
                  {content.translation.name}
                </h4>
              </div>
              <strong className="[direction:ltr]">
                {formatPrice(occasion.course.product.priceOre, locale)}
              </strong>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="font-bold">{t("when")}</dt>
                <dd>
                  {formatOccasion(occasion.startsAt)}
                  {"–"}
                  {formatStockholm(occasion.endsAt, locale, { timeStyle: "short" })}
                </dd>
              </div>
              <div>
                <dt className="font-bold">{t("language")}</dt>
                <dd>{occasion.language}</dd>
              </div>
              <div>
                <dt className="font-bold">{t("venue")}</dt>
                <dd>
                  {occasion.venueName}
                  {occasion.venueAddress ? (
                    <>
                      <br />
                      {occasion.venueAddress}
                    </>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="font-bold">{t("seats")}</dt>
                <dd>{t("seatsLeft", { count: seatsLeft, n: String(seatsLeft) })}</dd>
              </div>
            </dl>
            {seatsLeft > 0 && occasion.course.product.active ? (
              <CourseBookingControl
                occasionId={occasion.id}
                disabled={false}
                authenticated={authenticated}
                signInHref={`/${locale}/logga-in?next=${encodeURIComponent(`/${locale}/priser#courses`)}`}
                accountRequired={authT("purchaseGate")}
                signInToBuy={authT("signInToBuy")}
              />
            ) : seatsLeft === 0 ? (
              <p className="mt-5 text-sm font-black text-ink-muted">
                {t("seatsLeft", { count: 0, n: "0" })}
              </p>
            ) : (
              <CallButton phone={company("phone")} className="mt-5">
                {t("callToBook")}
              </CallButton>
            )}
          </article>
        );
      })}
    </div>
  );
}
