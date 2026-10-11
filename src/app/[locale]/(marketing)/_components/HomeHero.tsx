import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CallButton } from "@/components/ContactButtons";
import { LinkButton } from "@/components/LinkButton";
import type { Locale } from "@/i18n/routing";
import { bookingEnabled } from "@/lib/launch";
import { isOpenNow, nextOpening, todayHours } from "@/lib/company/opening-hours";
import { formatPrice } from "@/lib/pricing/format";

import { getProducts } from "../_lib/data";

async function LowestSinglePrice({ locale }: { locale: Locale }) {
  const [t, products] = await Promise.all([
    getTranslations(),
    getProducts(locale),
  ]);
  const cheapest = products
    .filter((product) => product.kind === "SINGLE_LESSON")
    .sort((a, b) => a.priceOre - b.priceOre)[0];
  if (!cheapest) return null;
  return (
    <p className="text-small font-bold text-ink-inverse-muted">
      {t("shell.fromPrice", { price: formatPrice(cheapest.priceOre, locale) })}
    </p>
  );
}

export async function HomeHero({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const canBook = bookingEnabled();
  const now = new Date();
  const openNow = isOpenNow(now);
  const hoursToday = todayHours(now);
  const opens = nextOpening(now);
  const phone = t("company.phone");

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
      <div className="site-container relative z-10 grid items-end gap-8 pb-10 pt-24 lg:grid-cols-2 lg:pb-16">
        <div>
          <p className="brand-mark text-accent">{t("home.hero.brand")}</p>
          <h1 className="mt-4 max-w-3xl text-balance text-hero font-black tracking-[-0.055em] leading-[0.96]">
            {t("home.hero.title")}
          </h1>
          <p className="mt-4 max-w-[70ch] text-body leading-7 text-ink-inverse-muted">
            {t("home.hero.description")}
          </p>
          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            {canBook ? (
              <LinkButton href={`/${locale}/boka`} size="lg" className="w-full md:w-auto">
                {t("common.bookNow")}
              </LinkButton>
            ) : (
              <CallButton phone={phone} size="hero" className="w-full md:w-auto">
                {t("shell.callUs")}
              </CallButton>
            )}
            <Link
              href={`/${locale}/priser`}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-sm border border-[color-mix(in_srgb,var(--ink-inverse)_28%,transparent)] bg-[color-mix(in_srgb,var(--surface)_68%,transparent)] px-6 text-small font-bold text-ink-inverse shadow-soft backdrop-blur-xl md:w-auto"
            >
              {t("shell.seePrices")}
            </Link>
          </div>
        </div>
        <aside className="rounded-lg border border-[color-mix(in_srgb,var(--ink-inverse)_34%,transparent)] bg-[color-mix(in_srgb,var(--ink-inverse)_14%,transparent)] p-6 text-ink-inverse shadow-soft backdrop-blur-2xl">
          <Suspense fallback={null}>
            <LowestSinglePrice locale={locale} />
          </Suspense>
          <CallButton phone={phone} size="small" className="mt-3 text-2xl">
            {t("shell.callUs")}
          </CallButton>
          <p className="mt-4 text-small">
            <span className="font-black">{openNow ? t("shell.openNow") : t("shell.closed")}</span>
            {openNow && hoursToday ? (
              <span className="numbers-ltr"> · {hoursToday.open}–{hoursToday.close}</span>
            ) : null}
            {!openNow && opens ? (
              <span>
                {" · "}
                {opens.sameDay
                  ? t("shell.opensAt", { time: opens.time })
                  : t("shell.opensOn", {
                      day: t(`shell.weekdayShort.${opens.weekday}`),
                      time: opens.time,
                    })}
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-small text-ink-inverse-muted">{t("home.hero.areas")}</p>
          <p className="mt-2 text-small font-bold">{t("home.hero.areas")}</p>
        </aside>
      </div>
    </section>
  );
}
