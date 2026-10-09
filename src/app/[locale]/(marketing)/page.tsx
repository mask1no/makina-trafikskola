import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BenefitMarquee } from "@/components/BenefitMarquee";
import { SectionHeader } from "@/components/SectionHeader";
import { LinkButton } from "@/components/LinkButton";
import { ProductCard } from "@/components/ProductCard";
import { StaticMapArtwork } from "@/components/StaticMapArtwork";
import { TeacherCard } from "@/components/TeacherCard";
import { LazyTeacherMap } from "@/components/LazyTeacherMap";
import { isLocale, type Locale } from "@/i18n/routing";
import {
  bookingEnabled,
  instructorsEnabled,
  theoryNavVisible,
  theorySalesOpen,
} from "@/lib/launch";
import { isOpenNow, todayHours } from "@/lib/company/opening-hours";
import {
  COMING_SOON_TEACHING_LANGUAGES,
  formatLanguageList,
  offeredTeachingLanguages,
} from "@/lib/company/staff";
import { displayPhone, telHref } from "@/lib/format/phone";
import { benefitItems } from "@/lib/home/benefits";
import { googleMapsBrowserConfig } from "@/lib/maps/config";
import { activeTeacherLanguages } from "@/lib/teachers/query";
import { nextFreeSlots } from "@/lib/bookings/availability";
import { formatLessonDateTime } from "@/lib/format/datetime";
import { formatPrice } from "@/lib/pricing/format";
import { toProductCardModel } from "@/lib/products/card";
import {
  getPublishedReviewSummary,
  shouldShowPublicReviews,
} from "@/lib/reviews/public";
import { freeTheoryQuestionCount } from "@/lib/theory/questions";

import { getProducts, getTeachers } from "./_lib/data";

export const dynamic = "force-dynamic";

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

async function HomeHero({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const canBook = bookingEnabled();
  const now = new Date();
  const openNow = isOpenNow(now);
  const hoursToday = todayHours(now);
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
        className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_40%,transparent)_0%,color-mix(in_srgb,var(--surface)_68%,transparent)_42%,var(--surface)_100%)] lg:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--surface)_86%,transparent)_0%,color-mix(in_srgb,var(--surface)_60%,transparent)_44%,color-mix(in_srgb,var(--surface)_18%,transparent)_68%,transparent_100%)]"
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
              <a
                href={telHref(phone)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-sm border border-accent bg-accent px-5 text-small font-bold text-accent-ink md:w-auto"
              >
                {t.rich("shell.callName", {
                  phone: () => (
                    <bdi dir="ltr" className="numbers-ltr">
                      {displayPhone(phone)}
                    </bdi>
                  ),
                })}
              </a>
            )}
            <LinkButton
              variant="secondary-inverse"
              size="lg"
              className="w-full md:w-auto"
              href={`/${locale}/priser`}
            >
              {t("shell.seePrices")}
            </LinkButton>
          </div>
        </div>
        <aside className="rounded-lg border border-ink-inverse/15 bg-surface-raised p-6 text-ink-inverse">
          <Suspense fallback={null}>
            <LowestSinglePrice locale={locale} />
          </Suspense>
          <a className="mt-3 inline-flex min-h-11 items-center text-2xl font-black" href={telHref(phone)}>
            <bdi dir="ltr" className="numbers-ltr">{displayPhone(phone)}</bdi>
          </a>
          <p className="mt-4 text-small">
            <span className="font-black">{openNow ? t("shell.openNow") : t("shell.closed")}</span>
            {hoursToday ? <span className="numbers-ltr"> · {hoursToday.open}–{hoursToday.close}</span> : null}
          </p>
          <p className="mt-2 text-small text-ink-inverse-muted">{t("company.visitingAddress")}</p>
          <p className="mt-2 text-small font-bold">{t("home.hero.areas")}</p>
        </aside>
      </div>
    </section>
  );
}

export default async function MarketingHome(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = params.locale;
  if (!isLocale(locale)) return null;
  setRequestLocale(locale);
  return (
    <>
      <HomeHero locale={locale} />
      <HomeBelow params={{ locale }} />
    </>
  );
}

async function HomeBelow({
  params,
}: {
  params: { locale: Locale };
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations();
  const [products, teachers, freeQuestions, activeLanguages, reviewSummary] = await Promise.all([
    getProducts(params.locale),
    getTeachers(params.locale),
    freeTheoryQuestionCount(),
    activeTeacherLanguages(),
    getPublishedReviewSummary(),
  ]);
  const nextFree = await nextFreeSlots(
    teachers.slice(0, 4).map((teacher) => teacher.id),
    new Date(),
  );
  const offeredLanguages = offeredTeachingLanguages();
  const offeredLanguageNames = formatLanguageList(
    offeredLanguages,
    params.locale,
    (code) => t(`shell.languagePage.${code}`),
  );
  const comingSoonLanguageNames = formatLanguageList(
    COMING_SOON_TEACHING_LANGUAGES,
    params.locale,
    (code) => t(`shell.languagePage.${code}`),
  );
  const canBook = bookingEnabled();
  const showInstructors = instructorsEnabled() && teachers.length > 0;
  const singleLessons = products
    .filter((product) => product.kind === "SINGLE_LESSON")
    .sort((a, b) => a.priceOre - b.priceOre);
  const popular =
    products.find((product) => Boolean(product.badge)) ??
    products
      .filter(
        (product) =>
          product.kind === "GUARANTEE" ||
          (product.kind === "PACKAGE" &&
            (product.includesTheory || product.includesRisk1 || product.includesRisk2)),
      )
      .sort((a, b) => a.priceOre - b.priceOre)[0];
  const featuredProducts = [singleLessons[0], popular].filter(
    (product, index, list): product is NonNullable<typeof product> =>
      Boolean(product) && list.findIndex((item) => item?.id === product?.id) === index,
  );
  const productCardLabels = {
    kindLabel: (key: string) => t(`product.kind.${key}`),
    perLessonLabel: t("product.perLesson"),
    validityLabel: (count: number) => t("product.validityMonths", { count }),
    vatLabel: t("product.priceIncludesVat"),
    valueSeparatelyLabel: (price: string) => t("pricing.valueSeparately", { price }),
    savingsLabel: (percent: number) => t("product.save", { percent }),
    popularLabel: t("product.popular"),
    swedishOnlyLabel: t("common.swedishOnly"),
    unavailableLabel: t("product.notForSale"),
    detailsLabel: t("common.readMore"),
    featuredLabel: t("shell.mostChosen"),
    imageAlt: (slug: string) =>
      t.has(`product.images.${slug}`) ? t(`product.images.${slug}`) : undefined,
  };
  const benefitCards = benefitItems({
    bookingEnabled: canBook,
    products,
    hasRiskCourse: products.some(
      (product) =>
        product.kind === "COURSE_SEAT" &&
        (product.includesRisk1 || product.includesRisk2),
    ),
  }).map((item) => ({
    id: item.id,
    size: item.size,
    title: t(`home.benefits.${item.id}.title`),
    body:
      item.id === "local"
          ? t("home.benefits.local.body", {
              address: t("company.visitingAddress"),
            })
          : item.id === "language"
            ? t("home.benefits.language.body", {
                languages: offeredLanguageNames,
                comingSoonLanguages: comingSoonLanguageNames,
              })
            : t(`home.benefits.${item.id}.body`),
  }));
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
      languages: teacher.languages.map((language) => t(`shell.languagePage.${language}`)),
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
  const mapsConfig = googleMapsBrowserConfig();
  const faqItems = [
    {
      question: t("home.faq.cost.question"),
      answer: t("home.faq.cost.answer", {
        singlePrice: formatPrice(singleLesson?.priceOre ?? 0, params.locale),
        packagePrice: formatPrice(entryPackage?.priceOre ?? 0, params.locale),
      }),
    },
    ...(["languages", "pickup", "cancel", "late", "risk", "validity"] as const).map((key) => {
      const answer =
        key === "cancel" && !canBook
          ? (t.raw("home.faq.cancel.answerPhone") as string).replace(
              "<phone></phone>",
              displayPhone(t("company.phone")),
            )
          : key === "languages"
            ? t("home.faq.languages.answer", {
                languages: offeredLanguageNames,
                comingSoonLanguages: comingSoonLanguageNames,
              })
            : t(`home.faq.${key}.answer`);
      return {
        question: t(`home.faq.${key}.question`),
        answer,
        content:
          key === "cancel" && !canBook
            ? t.rich("home.faq.cancel.answerPhone", {
                phone: () => (
                  <bdi dir="ltr" className="numbers-ltr">
                    {displayPhone(t("company.phone"))}
                  </bdi>
                ),
              })
            : answer,
      };
    }),
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
      {shouldShowPublicReviews(reviewSummary.count) ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "DrivingSchool",
              name: t("company.legalName"),
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: reviewSummary.average.toFixed(1),
                reviewCount: reviewSummary.count,
                bestRating: "5",
                worstRating: "1",
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}

      <div className="relative z-20 mt-6 bg-page lg:mt-8">
        <BenefitMarquee
          label={t("home.benefits.label")}
          items={benefitCards}
        />
      </div>

      {showInstructors ? (
        <section className="section-shell">
        <div className="site-container">
          <SectionHeader
            eyebrow={t("home.teachers.eyebrow")}
            title={t("home.teachers.title")}
            intro={t("home.teachers.description")}
          />
          <nav className="mt-8 flex flex-wrap gap-2" aria-label={t("home.teachers.languageLabel")}>
            {activeLanguages.map((language) => (
              <Link
                key={language}
                href={`/${params.locale}/larare?language=${language}`}
                lang={language}
                className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-base font-bold transition hover:border-ink"
              >
                {t(`shell.languagePage.${language}`)}
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
                  languages={teacher.languages.map((language) => t(`shell.languagePage.${language}`))}
                  transmissions={teacher.transmissions.map((transmission) =>
                    t(`teacher.transmission.${transmission.toLowerCase()}`),
                  )}
                  locationNames={teacher.locations.map(({ location }) => location.name)}
                  experienceLabel={
                    teacher.yearsExperience > 0
                      ? t("teacher.yearsExperience", {
                          count: teacher.yearsExperience,
                          n: String(teacher.yearsExperience),
                        })
                      : ""
                  }
                  detailsLabel={t("teacher.viewProfile")}
                  nextFreeLabel={t("teacher.nextFree")}
                  nextFreeTime={
                    nextFree.get(teacher.id)
                      ? formatLessonDateTime(nextFree.get(teacher.id)!, params.locale)
                      : undefined
                  }
                  swedishOnly={teacher.swedishOnly}
                  swedishOnlyLabel={t("common.swedishOnly")}
                />
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-2xl font-black">{t("map.homeTeaserTitle")}</h3>
                <p className="mt-3 max-w-[70ch] text-body leading-7 text-ink-muted">
                  {t("map.homeTeaserDescription")}
                </p>
              </div>
              {mapsConfig.apiKey && mapsConfig.mapId && homeMapMarkers.length ? (
                <LazyTeacherMap
                  apiKey={mapsConfig.apiKey}
                  mapId={mapsConfig.mapId}
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
                  <StaticMapArtwork className="absolute inset-0 size-full" />
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
              <SectionHeader
                eyebrow={t("home.products.eyebrow")}
                title={t("home.products.title")}
              />
            </div>
            <Link className="min-h-11 py-3 font-bold underline underline-offset-4" href={`/${params.locale}/korlektioner`}>
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
            {featuredProducts.map((product) => (
            <div key={product.id} className="w-[85%] shrink-0 snap-start md:w-auto">
              <ProductCard
                {...toProductCardModel({
                  locale: params.locale,
                  bookingEnabled: canBook,
                  product,
                  featured: product.id === popular?.id,
                  labels: productCardLabels,
                })}
              />
            </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell border-y border-border bg-card">
        <div className="site-container">
          <SectionHeader eyebrow={t("home.journey.eyebrow")} title={t("home.journey.title")} />
          <ol className="mt-8 grid gap-6 md:mt-12 md:grid-cols-3 md:gap-8">
            {(canBook
              ? (["choose", "book", "learn"] as const)
              : (["choose", "call", "learn"] as const)).map((step, index) => (
              <li key={step} className="border-t border-border pt-4 md:pt-6">
                <span className="numbers-ltr text-small font-black text-accent">{index + 1}</span>
                <h3 className="mt-4 text-h3 font-black">{t(`home.journey.${step}.title`)}</h3>
                <p className="mt-3 max-w-[70ch] text-body leading-7 text-ink-muted">{t(`home.journey.${step}.description`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {theoryNavVisible() ? <section className="section-shell overflow-hidden">
        <div className="site-container">
          <div className="relative overflow-hidden rounded-lg bg-surface text-ink-inverse shadow-float">
            <div className="relative grid lg:grid-cols-[1.1fr_.9fr]">
              <div className="p-7 sm:p-10 lg:p-14">
                <p className="text-micro font-bold uppercase tracking-wider text-accent">
                {t("theory.teaser.eyebrow")}
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-black sm:text-5xl">
                  {t("theory.teaser.title")}
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-ink-inverse-muted">
                  {freeQuestions > 0
                    ? t("theory.teaser.description")
                    : t("home.theory.comingSoon")}
                </p>
                <ul className="mt-6 grid gap-3">
                  {(["categories", "practice", "languages"] as const)
                    .filter((item) => freeQuestions > 0 || item !== "practice")
                    .map(
                    (item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-small font-bold"
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
                        {item === "languages"
                          ? t("theory.teaser.features.languages", {
                              languages: offeredLanguageNames,
                              comingSoonLanguages: comingSoonLanguageNames,
                            })
                          : t(`theory.teaser.features.${item}`)}
                      </li>
                    ),
                  )}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  {freeQuestions > 0 ? (
                    <LinkButton href={`/${params.locale}/teori`}>
                      {t("theory.teaser.tryFree")}
                    </LinkButton>
                  ) : null}
                  {theorySalesOpen() && theoryProduct?.active ? (
                    <LinkButton
                      variant="secondary-inverse"
                      href={`/${params.locale}/paket/korkortsteori`}
                    >
                      {t("theory.teaser.buy")}
                    </LinkButton>
                  ) : (
                    <span className="inline-flex min-h-11 items-center text-small font-bold text-ink-inverse-muted">
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
                {theorySalesOpen() && theoryProduct ? (
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
      </section> : null}

      {shouldShowPublicReviews(reviewSummary.count) ? (
        <section className="section-shell border-t border-border bg-card">
          <div className="site-container">
            <SectionHeader
              eyebrow={t("home.reviews.eyebrow")}
              title={t("home.reviews.title")}
              intro={t("home.reviews.summary", {
                count: reviewSummary.count,
                average: reviewSummary.average.toFixed(1),
              })}
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {reviewSummary.latest.map((review) => (
                <article key={review.id} className="rounded-md border border-border bg-page p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{review.studentName}</p>
                    <p className="numbers-ltr text-small font-bold text-ink-muted">
                      {review.rating}/5
                    </p>
                  </div>
                  {review.comment ? (
                    <p className="mt-3 max-w-[70ch] text-body leading-7 text-ink-muted">{review.comment}</p>
                  ) : null}
                  <p className="mt-3 text-small text-ink-muted">
                    {new Intl.DateTimeFormat(params.locale, { dateStyle: "medium" }).format(review.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-shell border-t border-border">
        <div className="site-container grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <SectionHeader eyebrow={t("home.faq.eyebrow")} title={t("home.faq.title")} />
          <div className="divide-y divide-border border-y border-border">
            {faqItems.map((item) => (
              <details key={item.question} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 font-bold marker:hidden [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span aria-hidden="true" className="text-xl transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-3xl pb-6 leading-7 text-ink-muted">
                  {"content" in item ? item.content : item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
