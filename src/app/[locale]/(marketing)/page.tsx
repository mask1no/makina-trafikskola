import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
      <section className="overflow-hidden bg-surface px-4 py-16 text-ink-inverse sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-ink-muted">
              {t("home.hero.eyebrow")}
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-black leading-tight sm:text-6xl">
              {t("home.hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
              {t("home.hero.description")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center rounded-sm bg-accent px-5 font-bold text-accent-ink hover:bg-accent-hover"
                href={`/${params.locale}/boka`}
              >
                {t("common.bookNow")}
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-sm border border-card/40 px-5 font-bold hover:bg-card/10"
                href={`/${params.locale}/larare`}
              >
                {t("home.hero.findTeacher")}
              </Link>
            </div>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-lg border border-card/10 bg-surface-raised p-6">
            <div className="absolute -end-16 -top-16 size-64 rounded-full bg-accent opacity-90" />
            <div className="relative mt-28 rounded-md bg-card p-5 text-ink shadow-xl">
              <p className="text-sm font-semibold text-ink-muted">{t("home.hero.cardLabel")}</p>
              <p className="mt-2 text-2xl font-black">{t("home.hero.cardTitle")}</p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{t("home.hero.cardDescription")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
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
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
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
                swedishOnly={teacher.swedishOnly}
                swedishOnlyLabel={t("common.swedishOnly")}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              {t("home.location.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-black">{t("home.location.title")}</h2>
            <p className="mt-4 max-w-xl leading-7 text-ink-muted">{t("home.location.description")}</p>
            <Link
              href={`/${params.locale}/larare`}
              className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-surface px-5 font-bold text-ink-inverse"
            >
              {t("home.location.openMap")}
            </Link>
          </div>
          <div
            className="static-map relative min-h-80 overflow-hidden rounded-lg border border-border"
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
