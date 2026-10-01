import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LinkButton } from "@/components/LinkButton";
import { ProductCard } from "@/components/ProductCard";
import { StaticMapArtwork } from "@/components/StaticMapArtwork";
import { TeacherCard } from "@/components/TeacherCard";
import { TeacherMap } from "@/components/TeacherMap";
import { isLocale } from "@/i18n/routing";
import {
  bookingEnabled,
  instructorsEnabled,
} from "@/lib/launch";
import { formatPrice } from "@/lib/pricing/format";

import { getProducts, getTeachers } from "./_lib/data";

export const dynamic = "force-dynamic";

const LANGUAGE_FILTERS = ["sv", "en", "ti", "ar", "so"] as const;

function TrustIcon({
  kind,
}: {
  kind: "languages" | "pickup" | "lesson" | "pricing";
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="size-12"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {kind === "languages" ? (
        <>
          <circle cx="18" cy="24" r="8" />
          <circle cx="32" cy="20" r="6" />
          <path d="M8 40c1.2-6 5-9 10-9s8.8 3 10 9M26 40c.6-4 2.6-6 6-6 2.4 0 4.2 1 5.2 2.8" />
        </>
      ) : kind === "pickup" ? (
        <>
          <path d="M8 29h32l-3-10a5 5 0 0 0-5-4H16a5 5 0 0 0-5 4L8 29Z" />
          <path d="M7 29v7h5m29-7v7h-5M15 29h18" />
          <circle cx="14" cy="34" r="3" />
          <circle cx="34" cy="34" r="3" />
          <path d="M24 7c4 0 7 3 7 7 0 5-7 10-7 10s-7-5-7-10c0-4 3-7 7-7Z" />
          <circle cx="24" cy="14" r="2" />
        </>
      ) : kind === "lesson" ? (
        <>
          <circle cx="24" cy="24" r="17" />
          <path d="M24 14v11l7 4M18 5h12" />
        </>
      ) : (
        <>
          <path d="M13 7h22v34l-4-3-4 3-3-3-4 3-4-3-3 3V7Z" />
          <path d="M19 16h10M19 23h10M19 30h6" />
        </>
      )}
    </svg>
  );
}

export default async function MarketingHome(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) return null;
  setRequestLocale(params.locale);
  const t = await getTranslations();
  const [products, teachers] = await Promise.all([
    getProducts(params.locale),
    getTeachers(params.locale),
  ]);
  const canBook = bookingEnabled();
  const showInstructors = instructorsEnabled() && teachers.length > 0;
  const featuredSlugs = ["en-korlektion", "testlektion", "korpaket-b3"] as const;
  const featuredProducts = featuredSlugs.flatMap((slug) => {
    const product = products.find((item) => item.slug === slug);
    return product ? [product] : [];
  });
  const lessonImages: Record<(typeof featuredSlugs)[number], string> = {
    "en-korlektion": "/lessons/korlektion.jpg",
    testlektion: "/lessons/testlektion.jpg",
    "korpaket-b3": "/lessons/tre-lektioner.jpg",
  };
  const theoryProduct = products.find((product) => product.slug === "korkortsteori");
  const singleLesson = products.find((product) => product.slug === "en-korlektion");
  const entryPackage = products
    .filter((product) => product.kind === "PACKAGE")
    .sort((a, b) => a.priceOre - b.priceOre)[0];
  const homeMapMarkers = teachers.flatMap((teacher) =>
    teacher.locations.map(({ location }, index) => ({
      id: `${teacher.id}-${index}`,
      teacherId: teacher.id,
      title: `${teacher.user.firstName} ${teacher.user.lastName}`,
      position: { lat: location.lat, lng: location.lng },
      photoUrl: teacher.photoUrl,
      languages: teacher.languages.map((language) => t(`language.${language}`)),
      transmission: teacher.transmissions
        .map((item) => t(`teacher.transmission.${item.toLowerCase()}`))
        .join(", "),
      locationName: location.name,
    })),
  );
  const homeMapCenter = homeMapMarkers[0]?.position ?? {
    lat: 59.3293,
    lng: 18.0686,
  };
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const faqItems = [
    {
      question: t("home.faq.cost.question"),
      answer: t("home.faq.cost.answer", {
        singlePrice: formatPrice(singleLesson?.priceOre ?? 0, params.locale),
        packagePrice: formatPrice(entryPackage?.priceOre ?? 0, params.locale),
      }),
    },
    ...(["languages", "pickup", "cancel", "risk", "validity"] as const).map((key) => ({
      question: t(`home.faq.${key}.question`),
      answer: t(`home.faq.${key}.answer`),
    })),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />

      <section className="relative isolate flex min-h-[72svh] flex-col justify-end overflow-x-clip bg-surface text-ink-inverse sm:min-h-[68svh]">
        <Image
          src="/hero.jpg"
          alt=""
          priority
          fill
          sizes="100vw"
          className="rtl-no-mirror hero-pan object-cover object-[68%_center]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_55%,transparent)_0%,color-mix(in_srgb,var(--surface)_78%,transparent)_48%,var(--surface)_100%)]"
        />
        <div className="site-container relative z-10 flex flex-col justify-end pb-12 pt-24 sm:pb-16">
          <p className="brand-mark reveal text-accent">{t("home.hero.brand")}</p>
          <h1 className="display-title reveal reveal-delay-1 mt-5 max-w-4xl text-balance">
            {t("home.hero.title")}
          </h1>
          <p className="reveal reveal-delay-2 mt-5 max-w-xl text-lg leading-8 text-ink-inverse-muted sm:text-xl">
            {t("home.hero.description")}
          </p>
          <div className="reveal reveal-delay-3 mt-8 flex flex-wrap gap-3">
            <LinkButton
              href={`/${params.locale}/${canBook ? "boka" : "kontakt"}`}
            >
              {canBook ? t("common.bookNow") : t("shell.contact")}
            </LinkButton>
            {showInstructors ? (
              <LinkButton
                variant="secondary"
                className="border-ink-inverse/30 text-ink-inverse hover:bg-ink-inverse/10"
                href={`/${params.locale}/larare`}
              >
                {t("home.hero.findTeacher")}
              </LinkButton>
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-label={t("home.trust.label")}
        className="relative z-20 bg-page pb-10 sm:-mt-8"
      >
        <div className="site-container grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["languages", "pickup", "lesson", "pricing"] as const).map(
            (key, index) => (
              <article
                key={key}
                className="group min-h-56 rounded-lg border border-border bg-card p-6 shadow-card transition duration-700 ease-premium hover:-translate-y-1 hover:border-border-strong hover:shadow-float"
              >
                <span className="grid size-14 place-items-center rounded-md bg-accent-soft text-ink transition duration-700 ease-premium group-hover:bg-accent">
                  <TrustIcon kind={key} />
                </span>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-ink-subtle">
                  0{index + 1}
                </p>
                <h2 className="mt-2 text-xl font-black">
                  {t(`home.trust.${key}.title`)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {t(`home.trust.${key}.description`)}
                </p>
              </article>
            ),
          )}
        </div>
      </section>

      {showInstructors ? (
        <section className="section-shell">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              {t("home.teachers.eyebrow")}
            </p>
            <h2 className="section-title mt-3">{t("home.teachers.title")}</h2>
            <p className="mt-4 leading-7 text-ink-muted">{t("home.teachers.description")}</p>
          </div>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label={t("home.teachers.languageLabel")}>
            {LANGUAGE_FILTERS.map((language) => (
              <Link
                key={language}
                href={`/${params.locale}/larare?language=${language}`}
                lang={language}
                className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-base font-bold transition hover:border-ink"
              >
                {t(`language.${language}`)}
              </Link>
            ))}
          </nav>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div className="grid gap-5 sm:grid-cols-2">
              {teachers.slice(0, 4).map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  locale={params.locale}
                  slug={teacher.slug}
                  name={`${teacher.user.firstName} ${teacher.user.lastName}`}
                  photoUrl={teacher.photoUrl}
                  languages={teacher.languages.map((language) => t(`language.${language}`))}
                  transmissions={teacher.transmissions.map((transmission) =>
                    t(`teacher.transmission.${transmission.toLowerCase()}`),
                  )}
                  locationNames={teacher.locations.map(({ location }) => location.name)}
                  experienceLabel={t("teacher.yearsExperience", {
                    count: teacher.yearsExperience,
                  })}
                  detailsLabel={t("teacher.viewProfile")}
                  swedishOnly={teacher.swedishOnly}
                  swedishOnlyLabel={t("common.swedishOnly")}
                />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-2xl font-black">{t("map.homeTeaserTitle")}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-ink-muted">
                  {t("map.homeTeaserDescription")}
                </p>
              </div>
              {mapsKey && homeMapMarkers.length ? (
                <TeacherMap
                  apiKey={mapsKey}
                  bookingAvailable={canBook}
                  center={homeMapCenter}
                  label={t("map.interactiveLabel")}
                  missingKeyTitle={t("map.unavailableTitle")}
                  missingKeyDescription={t("map.unavailableDescription")}
                  fallbackHref={`/${params.locale}/larare`}
                  fallbackLabel={t("map.homeTeaserCta")}
                  markers={homeMapMarkers}
                />
              ) : (
                <Link
                  href={`/${params.locale}/larare`}
                  className="group relative min-h-[22rem] overflow-hidden bg-surface text-ink-inverse"
                  aria-label={t("map.homeTeaserCta")}
                >
                  <StaticMapArtwork className="absolute inset-0 size-full transition duration-700 ease-premium group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_5%,transparent)_0%,var(--surface)_92%)]" />
                </Link>
              )}
              <Link
                href={`/${params.locale}/larare`}
                className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
              >
                {t("map.homeTeaserCta")}
              </Link>
            </div>
          </div>
        </div>
        </section>
      ) : null}

      <section className="section-shell border-y border-border bg-card">
        <div className="site-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                {t("home.products.eyebrow")}
              </p>
              <h2 className="section-title mt-3">{t("home.products.title")}</h2>
            </div>
            <Link className="min-h-11 py-3 font-bold underline underline-offset-4" href={`/${params.locale}/korlektioner`}>
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                locale={params.locale}
                slug={product.slug}
                kind={product.kind}
                active={product.active}
                bookingEnabled={canBook}
                name={product.translation.name}
                description={product.translation.shortDesc}
                priceOre={product.priceOre}
                compareAtOre={product.compareAtOre}
                accentHex={product.accentHex}
                lessonCredits={product.lessonCredits}
                includesTheory={product.includesTheory}
                includesRisk1={product.includesRisk1}
                includesRisk2={product.includesRisk2}
                creditValidDays={product.creditValidDays}
                tierLabel={t(
                  `product.kind.${
                    product.kind === "PACKAGE" && product.slug.startsWith("intensiv")
                      ? "INTENSIVE_PACKAGE"
                      : product.kind
                  }`,
                )}
                perLessonLabel={t("product.perLesson")}
                validityLabel={t("product.validityMonths", {
                  count: Math.round(product.creditValidDays / 30),
                })}
                vatLabel={t("product.priceIncludesVat")}
                valueSeparatelyLabel={
                  product.kind !== "GUARANTEE" &&
                  product.compareAtOre &&
                  product.compareAtOre > product.priceOre
                    ? t("pricing.valueSeparately", {
                        price: formatPrice(product.compareAtOre, params.locale),
                      })
                    : undefined
                }
                badge={product.badge}
                badgeLabel={product.badge ? t("product.popular") : undefined}
                swedishOnly={product.swedishOnly}
                swedishOnlyLabel={t("common.swedishOnly")}
                unavailableLabel={t("product.notForSale")}
                detailsLabel={t("common.readMore")}
                imageSrc={
                  product.slug in lessonImages
                    ? lessonImages[product.slug as keyof typeof lessonImages]
                    : undefined
                }
                imageAlt={
                  product.slug in lessonImages
                    ? t(`product.images.${product.slug}`)
                    : undefined
                }
                savingsLabel={
                  product.kind !== "GUARANTEE" &&
                  product.compareAtOre &&
                  product.compareAtOre > product.priceOre
                    ? t("product.save", {
                        percent: Math.round(
                          (1 - product.priceOre / product.compareAtOre) * 100,
                        ),
                      })
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell bg-surface text-ink-inverse">
        <div className="site-container">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">{t("home.journey.eyebrow")}</p>
          <h2 className="section-title mt-3 max-w-2xl">{t("home.journey.title")}</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {(["choose", "book", "learn"] as const).map((step, index) => (
              <li key={step}>
                <span className="numbers-ltr text-sm font-black text-accent">0{index + 1}</span>
                <h3 className="mt-4 text-xl font-black">{t(`home.journey.${step}.title`)}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-inverse-muted">{t(`home.journey.${step}.description`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-shell overflow-hidden">
        <div className="site-container">
          <div className="relative overflow-hidden rounded-lg bg-surface text-ink-inverse shadow-float">
            <div
              aria-hidden="true"
              className="absolute -end-24 -top-32 size-80 rounded-full bg-accent opacity-15 blur-3xl"
            />
            <div className="relative grid lg:grid-cols-[1.1fr_.9fr]">
              <div className="p-7 sm:p-10 lg:p-14">
                <p className="text-sm font-bold uppercase tracking-wider text-accent">
                {t("theory.teaser.eyebrow")}
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-black sm:text-5xl">
                  {t("theory.teaser.title")}
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-ink-inverse-muted">
                  {t("theory.teaser.description")}
                </p>
                <ul className="mt-6 grid gap-3">
                  {(["categories", "practice", "languages"] as const).map(
                    (item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-sm font-bold"
                      >
                        <span
                          aria-hidden="true"
                          className="grid size-6 shrink-0 place-items-center rounded-full bg-success text-ink-inverse"
                        >
                          <svg
                            viewBox="0 0 16 16"
                            className="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m3.5 8.5 3 3 6-7" />
                          </svg>
                        </span>
                        {t(`theory.teaser.features.${item}`)}
                      </li>
                    ),
                  )}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <LinkButton href={`/${params.locale}/teori`}>
                    {t("theory.teaser.tryFree")}
                  </LinkButton>
                  {theoryProduct?.active ? (
                    <LinkButton
                      variant="secondary"
                      className="border-ink-inverse/30 text-ink-inverse hover:bg-ink-inverse/10"
                      href={`/${params.locale}/paket/korkortsteori`}
                    >
                      {t("theory.teaser.buy")}
                    </LinkButton>
                  ) : (
                    <span className="inline-flex min-h-11 items-center text-sm font-bold text-ink-inverse-muted">
                      {t("theory.teaser.pending")}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative min-h-80 border-t border-ink-inverse/10 bg-surface-raised lg:border-s lg:border-t-0">
                <Image
                  src="/illustration-theory.svg"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="rtl-no-mirror object-contain p-8 sm:p-12"
                />
                {theoryProduct ? (
                  <div className="absolute bottom-5 end-5 rounded-md bg-card p-4 text-ink shadow-card">
                    <p className="text-xs font-black uppercase tracking-wider text-ink-muted">
                      {t("theory.teaser.oneTime")}
                    </p>
                    <p className="numbers-ltr mt-1 text-2xl font-black">
                      {formatPrice(theoryProduct.priceOre, params.locale)}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell border-t border-border">
        <div className="site-container">
          <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            {t("home.faq.eyebrow")}
          </p>
          <h2 className="section-title mt-3">{t("home.faq.title")}</h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {faqItems.map((item) => (
              <details key={item.question} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 font-bold marker:hidden [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span aria-hidden="true" className="text-xl transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-3xl pb-6 leading-7 text-ink-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
