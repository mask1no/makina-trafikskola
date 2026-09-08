import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LinkButton } from "@/components/LinkButton";
import { ProductCard } from "@/components/ProductCard";
import { TeacherCard } from "@/components/TeacherCard";
import { TeacherMap } from "@/components/TeacherMap";
import { isLocale } from "@/i18n/routing";
import { formatPrice } from "@/lib/pricing/format";

import { getProducts, getTeachers } from "./_lib/data";

export const dynamic = "force-dynamic";

const LANGUAGE_FILTERS = ["sv", "en", "ti", "ar", "so"] as const;
// TODO: bekräfta med kunden
const UNVERIFIED_RATING = "4,8 ★ · 300+";

function TrustIcon({ name }: { name: "languages" | "pickup" | "lesson" | "pricing" }) {
  const paths = {
    languages: "M4 5h16M8 3v2c0 5-2 8-5 10m5-6c1 3 3 5 6 6m2-7 5 13m-8 0 5-13m-3 9h7",
    pickup: "M3 17h18M5 17V9l3-4h8l3 4v8M8 17a2 2 0 1 0 4 0m2 0a2 2 0 1 0 4 0M5 11h14",
    lesson: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2",
    pricing: "M4 7V4h16v3M5 7h14v13H5V7Zm3 4h8m-8 4h5",
  } as const;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6 shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    >
      <path d={paths[name]} />
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

      <section className="relative min-h-[78svh] overflow-hidden bg-surface text-ink-inverse">
        <div className="site-container grid min-h-[78svh] items-center md:grid-cols-[1.05fr_.95fr]">
          <div className="relative z-10 py-16 md:pe-10 md:py-20 lg:pe-16">
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.2em] text-accent">
              {t("home.hero.eyebrow")}
            </p>
            <h1 className="display-title max-w-3xl text-balance">
              {t("home.hero.title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-inverse-muted sm:text-xl">
              {t("home.hero.description")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={`/${params.locale}/boka`}>
                {t("common.bookNow")}
              </LinkButton>
              <LinkButton variant="secondary" className="text-ink-inverse" href={`/${params.locale}/larare`}>
                {t("home.hero.findTeacher")}
              </LinkButton>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-ink-inverse-muted">
              <span>{UNVERIFIED_RATING} {t("home.hero.reviews")}</span>
              <span aria-hidden="true">·</span>
              <span>{t("home.hero.pickupProof")}</span>
              <span aria-hidden="true">·</span>
              <span>{t("home.hero.languageProof")}</span>
            </div>
          </div>
          {/* TODO: byt mot kundens egen bild på deras bil */}
          <div className="absolute inset-0 md:relative md:inset-auto md:h-full md:min-h-[78svh] md:[margin-inline-end:min(0px,calc((80rem-100vw)/2))]">
            <Image
              src="/hero.jpg"
              alt=""
              priority
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="rtl-no-mirror object-cover object-[68%_center]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--surface)_8%,color-mix(in_srgb,var(--surface)_88%,transparent)_48%,transparent_100%)] md:hidden rtl:bg-[linear-gradient(270deg,var(--surface)_8%,color-mix(in_srgb,var(--surface)_88%,transparent)_48%,transparent_100%)]" />
            <div className="absolute bottom-6 start-6 hidden max-w-xs rounded-md border border-border bg-card p-5 text-ink shadow-float lg:block">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-muted">{t("home.hero.cardLabel")}</p>
              <p className="mt-2 text-xl font-black">{t("home.hero.cardTitle")}</p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{t("home.hero.cardDescription")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-surface-soft bg-surface-raised text-ink-inverse" aria-label={t("home.trust.label")}>
        <div className="site-container flex snap-x overflow-x-auto">
          {(["languages", "pickup", "lesson", "pricing"] as const).map((item, index) => (
            <div
              className={`flex min-w-[17rem] snap-start items-start gap-3 px-5 py-6 sm:min-w-0 sm:flex-1 ${
                index > 0 ? "border-s border-surface-soft" : ""
              }`}
              key={item}
            >
              <TrustIcon name={item} />
              <div>
                <strong className="block text-base">{t(`home.trust.${item}.title`)}</strong>
                <span className="mt-1 block text-sm leading-5 text-ink-inverse-muted">{t(`home.trust.${item}.description`)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              {t("home.teachers.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-black">{t("home.teachers.title")}</h2>
            <p className="mt-3 leading-7 text-ink-muted">{t("home.teachers.description")}</p>
          </div>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label={t("home.teachers.languageLabel")}>
            {LANGUAGE_FILTERS.map((language) => (
              <Link
                key={language}
                href={`/${params.locale}/larare?language=${language}`}
                lang={language}
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-bold transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-soft"
              >
                {t(`language.${language}`)}
              </Link>
            ))}
          </nav>
          <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <TeacherMap
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}
              center={{ lat: 59.3293, lng: 18.0686 }}
              markers={teachers.flatMap((teacher) =>
                teacher.locations.map(({ location }, index) => ({
                  id: `${teacher.id}-${index}`,
                  teacherId: teacher.id,
                  title: `${teacher.user.firstName} ${teacher.user.lastName}`,
                  position: { lat: location.lat, lng: location.lng },
                })),
              )}
              label={t("map.interactiveLabel")}
              missingKeyTitle={t("map.pendingKey")}
              fallbackHref={`/${params.locale}/larare#teacher-results`}
              fallbackLabel={t("teachers.showAsList")}
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {teachers.slice(0, 3).map((teacher) => (
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
                  demoLabel={teacher.slug === "sara-johansson" ? t("teacher.demoProfile") : undefined}
                  swedishOnly={teacher.swedishOnly}
                  swedishOnlyLabel={t("common.swedishOnly")}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell bg-card">
        <div className="site-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                {t("home.products.eyebrow")}
              </p>
              <h2 className="mt-2 text-3xl font-black">{t("home.products.title")}</h2>
            </div>
            <Link className="min-h-11 py-3 font-bold underline underline-offset-4" href={`/${params.locale}/korlektioner`}>
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
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
          <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-surface-soft bg-surface-soft md:grid-cols-3">
            {(["choose", "book", "learn"] as const).map((step, index) => (
              <li className="bg-surface-raised p-6 sm:p-8" key={step}>
                <span className="numbers-ltr text-sm font-black text-accent">0{index + 1}</span>
                <h3 className="mt-5 text-xl font-black">{t(`home.journey.${step}.title`)}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-inverse-muted">{t(`home.journey.${step}.description`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-shell">
        <div className="site-container">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                {t("theory.teaser.eyebrow")}
              </p>
              <h2 className="mt-2 text-3xl font-black">{t("theory.teaser.title")}</h2>
              <p className="mt-4 leading-7 text-ink-muted">{t("theory.teaser.description")}</p>
              {theoryProduct ? (
                <p className="numbers-ltr mt-5 text-3xl font-black">
                  {formatPrice(theoryProduct.priceOre, params.locale)}
                </p>
              ) : null}
            </div>
            <div className="mt-7 flex shrink-0 flex-wrap gap-3 lg:mt-0 lg:max-w-xs">
              <LinkButton href={`/${params.locale}/teori`}>
                {t("theory.teaser.tryFree")}
              </LinkButton>
              {theoryProduct?.active ? (
                <LinkButton variant="secondary" href={`/${params.locale}/paket/korkortsteori`}>
                  {t("theory.teaser.buy")}
                </LinkButton>
              ) : (
                <span className="inline-flex min-h-11 items-center rounded-sm border border-border bg-card-muted px-5 text-sm font-bold text-ink-muted">
                  {t("theory.teaser.pending")}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell border-t border-border bg-card">
        <div className="site-container">
          <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            {t("home.faq.eyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-black">{t("home.faq.title")}</h2>
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
