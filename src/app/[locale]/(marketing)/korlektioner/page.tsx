import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { isLocale } from "@/i18n/routing";
import { bookingEnabled } from "@/lib/launch";
import { formatPrice } from "@/lib/pricing/format";

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

  return (
    <div className="section-shell">
      <div className="site-container">
        <PageHeader eyebrow={t("lessons.eyebrow")} title={t("lessons.title")} description={t("lessons.description")} />
        {products.length ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
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
