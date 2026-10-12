import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { LinkButton } from "@/components/LinkButton";
import type { Locale } from "@/i18n/routing";
import { isOpenNow, nextOpening, todayHours } from "@/lib/company/opening-hours";
import { db } from "@/lib/db";
import { bookingEnabled } from "@/lib/launch";
import { formatPrice } from "@/lib/pricing/format";
import { isIntroOfferEligible } from "@/lib/products/intro-offer";

import { getProducts } from "../_lib/data";

export async function HomeHero({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [t, session, products] = await Promise.all([
    getTranslations(),
    auth(),
    getProducts(locale),
  ]);
  const canBook = bookingEnabled();
  const now = new Date();
  const openNow = isOpenNow(now);
  const hoursToday = todayHours(now);
  const opens = nextOpening(now);

  const introProduct = products.find(
    (product) => product.active && product.isIntroOffer,
  );
  let showIntroOffer = Boolean(introProduct);
  if (
    showIntroOffer &&
    session?.user?.id &&
    session.user.role === "STUDENT"
  ) {
    const student = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, phone: true },
    });
    showIntroOffer = student
      ? await isIntroOfferEligible(db, {
          userId: student.id,
          phone: student.phone,
        })
      : true;
  }

  return (
    <section className="relative isolate flex min-h-[60svh] flex-col justify-end overflow-x-clip bg-surface text-ink-inverse lg:min-h-[64svh] lg:max-h-[720px]">
      {/* TODO: replace /hero.jpg with a real school photo at least 2400px wide. */}
      <Image
        src="/hero.jpg"
        alt=""
        priority
        fetchPriority="high"
        quality={50}
        fill
        sizes="100vw"
        className="rtl-no-mirror hero-pan object-cover object-[center_30%] lg:object-[68%_center]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_42%,transparent)_0%,color-mix(in_srgb,var(--surface)_62%,transparent)_46%,color-mix(in_srgb,var(--surface)_28%,transparent)_100%)] lg:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--surface)_86%,transparent)_0%,color-mix(in_srgb,var(--surface)_55%,transparent)_42%,color-mix(in_srgb,var(--surface)_12%,transparent)_70%,transparent_100%)]"
      />
      <div className="site-container relative z-10 pb-10 pt-24 lg:pb-16">
        <div className="max-w-3xl">
          <p className="brand-mark text-accent">{t("home.hero.brand")}</p>
          <h1 className="mt-4 text-balance text-hero font-black tracking-[-0.055em] leading-[0.96]">
            {t("home.hero.title")}
          </h1>
          <p className="mt-4 max-w-[70ch] text-body leading-7 text-ink-inverse-muted">
            {t("home.hero.description")}
          </p>
          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            {canBook ? (
              <LinkButton href={`/${locale}/boka`} size="lg" className="w-full md:w-auto">
                {t("lessons.introOffer.book")}
              </LinkButton>
            ) : (
              <LinkButton href={`/${locale}/priser`} size="lg" className="w-full md:w-auto">
                {t("shell.seePrices")}
              </LinkButton>
            )}
            <Link
              href={canBook ? `/${locale}/priser` : `/${locale}/kontakt`}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-sm border border-[color-mix(in_srgb,var(--ink-inverse)_28%,transparent)] bg-[color-mix(in_srgb,var(--surface)_68%,transparent)] px-6 text-small font-bold text-ink-inverse shadow-soft backdrop-blur-xl md:w-auto"
            >
              {canBook ? t("shell.seePrices") : t("shell.contact")}
            </Link>
          </div>
          <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-5 text-ink-inverse-muted sm:text-small">
            <li className="inline-flex min-h-11 items-center gap-2">
              <span
                aria-hidden="true"
                className={`size-2 shrink-0 rounded-full ${
                  openNow ? "bg-success-strong" : "bg-ink-inverse-muted"
                }`}
              />
              {openNow && hoursToday ? (
                <span>
                  {t("home.hero.openUntil", { time: hoursToday.close })}
                </span>
              ) : (
                <span>
                  {t("shell.closed")}
                  {opens ? (
                    <>
                      {" · "}
                      {opens.sameDay
                        ? t("shell.opensAt", { time: opens.time })
                        : t("shell.opensOn", {
                            day: t(`shell.weekdayShort.${opens.weekday}`),
                            time: opens.time,
                          })}
                    </>
                  ) : null}
                </span>
              )}
            </li>
            <li className="inline-flex min-h-11 items-center gap-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-3.5 shrink-0 text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path
                  d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="10" r="2.25" />
              </svg>
              <span>{t("home.hero.areas")}</span>
            </li>
            {showIntroOffer && introProduct ? (
              <li className="inline-flex min-h-11 items-center gap-2">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-3.5 shrink-0 text-accent"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path
                    d="M4 8h16v10H4zM8 8V6.5A2.5 2.5 0 0 1 10.5 4h3A2.5 2.5 0 0 1 16 6.5V8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>
                  {t("home.hero.introOffer", {
                    price: formatPrice(introProduct.priceOre, locale),
                  })}
                </span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
