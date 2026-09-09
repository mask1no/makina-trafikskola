import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LinkButton } from "@/components/LinkButton";
import { ProductCard } from "@/components/ProductCard";
import { TeacherCard } from "@/components/TeacherCard";
import { isLocale } from "@/i18n/routing";
import { formatPrice } from "@/lib/pricing/format";

import { getProducts, getTeachers } from "./_lib/data";

export const dynamic = "force-dynamic";

const LANGUAGE_FILTERS = ["sv", "en", "ti", "ar", "so"] as const;

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
  const featuredProducts = products
    .filter((product) => ["PACKAGE", "SINGLE_LESSON", "TEST_LESSON"].includes(product.kind))
    .slice(0, 3);
  const theoryProduct = products.find((product) => product.slug === "korkortsteori");
  const singleLesson = products.find((product) => product.slug === "en-korlektion");
  const entryPackage = products
    .filter((product) => product.kind === "PACKAGE")
    .sort((a, b) => a.priceOre - b.priceOre)[0];
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

      <section className="relative isolate min-h-[100svh] overflow-hidden bg-surface text-ink-inverse">
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
        <div className="site-container relative z-10 flex min-h-[100svh] flex-col justify-end pb-14 pt-28 sm:pb-20">
          <p className="brand-mark reveal text-accent">{t("home.hero.brand")}</p>
          <h1 className="display-title reveal reveal-delay-1 mt-5 max-w-4xl text-balance">
            {t("home.hero.title")}
          </h1>
          <p className="reveal reveal-delay-2 mt-5 max-w-xl text-lg leading-8 text-ink-inverse-muted sm:text-xl">
            {t("home.hero.description")}
          </p>
          <div className="reveal reveal-delay-3 mt-8 flex flex-wrap gap-3">
            <LinkButton href={`/${params.locale}/boka`}>
              {t("common.bookNow")}
            </LinkButton>
            <LinkButton
              variant="secondary"
              className="border-ink-inverse/30 text-ink-inverse hover:bg-ink-inverse/10"
              href={`/${params.locale}/larare`}
            >
              {t("home.hero.findTeacher")}
            </LinkButton>
          </div>
        </div>
      </section>

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
            <Link
              href={`/${params.locale}/larare`}
              className="group relative min-h-[22rem] overflow-hidden bg-surface text-ink-inverse"
              aria-label={t("map.homeTeaserCta")}
            >
              <Image
                src="/hero.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="rtl-no-mirror object-cover object-[40%_center] opacity-70 transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_20%,var(--surface)_92%)]" />
              <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8">
                <h3 className="text-2xl font-black">{t("map.homeTeaserTitle")}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-ink-inverse-muted">
                  {t("map.homeTeaserDescription")}
                </p>
                <span className="mt-6 inline-flex min-h-11 items-center font-bold underline underline-offset-4">
                  {t("map.homeTeaserCta")}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

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
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                locale={params.locale}
                slug={product.slug}
                active={product.active}
                name={product.translation.name}
                description={product.translation.shortDesc}
                features={product.translation.features}
                priceOre={product.priceOre}
                compareAtOre={product.compareAtOre}
                accentHex={product.accentHex}
                lessonCredits={product.lessonCredits}
                creditValidDays={product.creditValidDays}
                tierLabel={t(
                  `product.kind.${
                    product.kind === "PACKAGE" && product.slug.startsWith("intensiv")
                      ? "INTENSIVE_PACKAGE"
                      : product.kind
                  }`,
                )}
                includedLabel={t("product.included")}
                perLessonLabel={t("product.perLesson")}
                validityLabel={t("product.validityMonths", {
                  count: Math.round(product.creditValidDays / 30),
                })}
                vatLabel={t("product.priceIncludesVat")}
                badge={product.badge}
                badgeLabel={product.badge ? t("product.popular") : undefined}
                swedishOnly={product.swedishOnly}
                swedishOnlyLabel={t("common.swedishOnly")}
                unavailableLabel={t("product.notForSale")}
                detailsLabel={t("common.readMore")}
                savingsLabel={product.compareAtOre && product.compareAtOre > product.priceOre
                  ? t("product.save", { percent: Math.round((1 - product.priceOre / product.compareAtOre) * 100) })
                  : undefined}
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

      <section className="section-shell">
        <div className="site-container">
          <div className="max-w-3xl border-y border-border py-10 sm:flex sm:items-end sm:justify-between sm:gap-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                {t("theory.teaser.eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-black">{t("theory.teaser.title")}</h2>
              <p className="mt-4 leading-7 text-ink-muted">{t("theory.teaser.description")}</p>
              {theoryProduct ? (
                <p className="numbers-ltr mt-5 text-3xl font-black">
                  {formatPrice(theoryProduct.priceOre, params.locale)}
                </p>
              ) : null}
            </div>
            <div className="mt-8 flex shrink-0 flex-wrap gap-3 sm:mt-0 sm:justify-end">
              <LinkButton href={`/${params.locale}/teori`}>
                {t("theory.teaser.tryFree")}
              </LinkButton>
              {theoryProduct?.active ? (
                <LinkButton variant="secondary" href={`/${params.locale}/paket/korkortsteori`}>
                  {t("theory.teaser.buy")}
                </LinkButton>
              ) : (
                <span className="inline-flex min-h-11 items-center text-sm font-bold text-ink-muted">
                  {t("theory.teaser.pending")}
                </span>
              )}
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
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 font-bold marker:hidden">
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
