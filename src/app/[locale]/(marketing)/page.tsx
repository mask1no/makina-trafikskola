import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LinkButton } from "@/components/LinkButton";
import { ProductCard } from "@/components/ProductCard";
import { TeacherCard } from "@/components/TeacherCard";
import { isLocale } from "@/i18n/routing";

import { getProducts, getTeachers } from "./_lib/data";

export const dynamic = "force-dynamic";

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

  return (
    <>
      <section className="overflow-hidden bg-surface text-ink-inverse">
        <div className="site-container grid min-h-[42rem] items-center gap-10 py-16 md:grid-cols-[1.05fr_.95fr] md:py-24">
          <div>
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.2em] text-accent">
              {t("home.hero.eyebrow")}
            </p>
            <h1 className="display-title max-w-3xl text-balance">
              {t("home.hero.title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted sm:text-xl">
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
          </div>
          <div className="relative min-h-[25rem]">
            <div className="absolute inset-4 rounded-lg border border-surface-soft bg-surface-raised" />
            <Image
              src="/illustration-hero.svg"
              alt=""
              priority
              width={720}
              height={560}
              className="rtl-no-mirror relative h-auto w-full object-contain"
            />
            <div className="absolute bottom-0 start-0 max-w-xs rounded-md border border-border bg-card p-5 text-ink shadow-float">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-muted">{t("home.hero.cardLabel")}</p>
              <p className="mt-2 text-xl font-black">{t("home.hero.cardTitle")}</p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{t("home.hero.cardDescription")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card" aria-label={t("home.trust.label")}>
        <div className="site-container grid gap-px bg-border sm:grid-cols-3">
          {(["languages", "lesson", "pricing"] as const).map((item) => (
            <div className="bg-card px-5 py-6 text-center" key={item}>
              <strong className="block text-lg">{t(`home.trust.${item}.title`)}</strong>
              <span className="mt-1 block text-sm text-ink-muted">{t(`home.trust.${item}.description`)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell">
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
                badge={product.badge}
                badgeLabel={product.badge ? t("product.popular") : undefined}
                swedishOnly={product.swedishOnly}
                swedishOnlyLabel={t("common.swedishOnly")}
                unavailableLabel={t("product.notForSale")}
                detailsLabel={t("common.readMore")}
                visualLabel={t("product.visualLabel")}
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
                <p className="mt-3 text-sm leading-6 text-ink-muted">{t(`home.journey.${step}.description`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-shell bg-card">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              {t("home.teachers.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-black">{t("home.teachers.title")}</h2>
            <p className="mt-3 leading-7 text-ink-muted">{t("home.teachers.description")}</p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
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
      </section>

      <section className="section-shell">
        <div className="site-container grid items-center gap-10 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              {t("home.location.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-black">{t("home.location.title")}</h2>
            <p className="mt-4 max-w-xl leading-7 text-ink-muted">{t("home.location.description")}</p>
            <LinkButton href={`/${params.locale}/larare`} className="mt-6">
              {t("home.location.openMap")}
            </LinkButton>
          </div>
          <div
            className="static-map relative min-h-[26rem] overflow-hidden rounded-lg border border-border shadow-card"
            role="img"
            aria-label={t("map.staticLabel")}
          >
            <span className="absolute bottom-4 start-4 rounded-sm bg-card px-3 py-2 text-sm font-semibold shadow">
              {t("home.location.area")}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
