import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/Badge";
import { CallButton } from "@/components/ContactButtons";
import { PageHeader } from "@/components/PageHeader";
import { isLocale } from "@/i18n/routing";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";
import { formatStockholm } from "@/lib/format/datetime";
import { formatPrice } from "@/lib/pricing/format";
import { risk2Confirmed } from "@/lib/launch";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";

import { CourseBookingControl } from "./CourseBookingControl";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "courses" });
  const title = t("title");
  const description = t("description");
  const canonical = pageCanonical(locale, "/kurser");
  return {
    title,
    description,
    alternates: { canonical },
    ...withSocial({ title, description, canonical, locale }),
  };
}

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
  const courseKinds = risk2Confirmed()
    ? (["RISK1", "RISK2"] as const)
    : (["RISK1"] as const);
  const holdCutoff = new Date(now.getTime() - holdMinutes * 60_000);
  const [session, t, authT, company, occasions, courses] = await Promise.all([
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
    db.course.findMany({
      where: { kind: { in: [...courseKinds] } },
      include: { product: { include: { translations: true } } },
    }),
  ]);
  const formatOccasion = (date: Date) =>
    formatStockholm(date, params.locale, {
      dateStyle: "long",
      timeStyle: "short",
    });
  const authenticated = session?.user?.role === "STUDENT";

  return (
    <div className="section-shell">
      <div className="site-container max-w-6xl">
        <div>
          <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {courseKinds.map((kind) => {
            const course = courses.find((item) => item.kind === kind);
            const upcoming = occasions.find((item) => item.course.kind === kind);
            return (
              <article key={kind} className="rounded-lg border border-border bg-card p-6 shadow-soft">
                <Badge>{t(`kind.${kind}`)}</Badge>
                <h2 className="mt-3 text-2xl font-black">{t(`kind.${kind}`)}</h2>
                <p className="mt-3 leading-7 text-ink-muted">{t(`info.${kind}`)}</p>
                {course ? (
                  <p className="numbers-ltr mt-5 text-xl font-black">
                    {formatPrice(course.product.priceOre, params.locale)}
                  </p>
                ) : null}
                <p className="mt-2 text-small font-bold text-ink-muted">
                  {upcoming ? formatOccasion(upcoming.startsAt) : t("soon")}
                </p>
                {!upcoming ? (
                  <CallButton phone={company("phone")} className="mt-5">
                    {t("callToBook")}
                  </CallButton>
                ) : null}
              </article>
            );
          })}
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
                    <div><dt className="font-bold">{t("when")}</dt><dd>{formatOccasion(occasion.startsAt)}</dd></div>
                    <div><dt className="font-bold">{t("language")}</dt><dd>{occasion.language}</dd></div>
                    <div><dt className="font-bold">{t("venue")}</dt><dd>{occasion.venueName}</dd></div>
                    <div><dt className="font-bold">{t("seats")}</dt><dd>{t("seatsLeft", { count: seatsLeft, n: String(seatsLeft) })}</dd></div>
                  </dl>
                  {!occasion.course.product.active ? (
                    <p className="mt-5 rounded-sm border border-border bg-page p-3 text-sm text-ink-muted">
                      {t("inactive")}
                    </p>
                  ) : null}
                  {seatsLeft > 0 && occasion.course.product.active ? (
                    <CourseBookingControl
                      occasionId={occasion.id}
                      disabled={false}
                      authenticated={authenticated}
                      signInHref={`/${params.locale}/logga-in?next=${encodeURIComponent(`/${params.locale}/kurser`)}`}
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
        ) : null}
      </div>
    </div>
  );
}
