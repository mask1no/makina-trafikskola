import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { isLocale } from "@/i18n/routing";
import { bookingEnabled } from "@/lib/launch";
import { formatPrice } from "@/lib/pricing/format";
import { groupProducts } from "@/lib/pricing/group";

import { pageCanonical, withSocial } from "@/lib/seo/metadata";

import { getProducts } from "../_lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "lessons" });
  const title = t("title");
  const description = t("description");
  const canonical = pageCanonical(locale, "/korlektioner");
  return {
    title,
    description,
    alternates: { canonical },
    ...withSocial({ title, description, canonical, locale }),
  };
}

export default async function KorlektionerPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) return null;
  setRequestLocale(params.locale);
  const t = await getTranslations();
  const products = await getProducts(params.locale);
  const canBook = bookingEnabled();
  const sections = groupProducts(products);

  return (
    <div className="section-shell">
      <div className="site-container">
        <PageHeader eyebrow={t("lessons.eyebrow")} title={t("lessons.title")} description={t("lessons.description")} />
        {sections.length ? (
          <>
            <nav className="sticky top-[var(--header-height)] z-30 -mx-4 mt-8 flex gap-2 overflow-x-auto bg-page px-4 py-3 lg:hidden" aria-label={t("lessons.groups.label")}>
              {sections.map((section) => (
                <a key={section.key} href={`#${section.key}`} className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border bg-card px-4 text-sm font-bold">
                  {t(`lessons.groups.${section.key}.title`)}
                </a>
              ))}
            </nav>
            <aside className="sticky top-[calc(var(--header-height-lg)+1.5rem)] float-start me-8 mt-12 hidden w-52 lg:block">
              <nav className="grid gap-1" aria-label={t("lessons.groups.label")}>
                {sections.map((section) => (
                  <a key={section.key} href={`#${section.key}`} className="inline-flex min-h-11 items-center rounded-sm px-3 font-bold hover:bg-card">
                    {t(`lessons.groups.${section.key}.title`)}
                  </a>
                ))}
              </nav>
            </aside>
            <div className="mt-8 rounded-lg border border-border bg-card p-5">
              <p className="font-bold">{t("lessons.testCallout")}</p>
            </div>
            {sections.map((section) => (
            <section key={section.key} id={section.key} className="mt-12 scroll-mt-[calc(var(--header-height)+4rem)]">
              <h2 className="text-2xl font-black">{t(`lessons.groups.${section.key}.title`)}</h2>
              <p className="mt-2 max-w-2xl text-ink-muted">{t(`lessons.groups.${section.key}.intro`)}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {section.products.map((product) => (
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
                  product.slug === "en-korlektion"
                    ? "/lessons/korlektion.jpg"
                    : product.slug === "testlektion"
                      ? "/lessons/testlektion.jpg"
                      : product.slug === "korpaket-b3"
                        ? "/lessons/tre-lektioner.jpg"
                        : undefined
                }
                imageAlt={
                  product.slug === "en-korlektion" ||
                  product.slug === "testlektion" ||
                  product.slug === "korpaket-b3"
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
            </section>
            ))}
          </>
        ) : (
          <div className="mt-10">
            <EmptyState
              title={t("product.emptyTitle")}
              description={t("product.emptyDescription")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
