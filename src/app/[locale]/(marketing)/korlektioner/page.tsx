import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { isLocale } from "@/i18n/routing";

import { getProducts } from "../_lib/data";

export const dynamic = "force-dynamic";

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

  return (
    <div className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            {t("lessons.eyebrow")}
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">{t("lessons.title")}</h1>
          <p className="mt-4 text-lg leading-8 text-ink-muted">{t("lessons.description")}</p>
          <div className="mt-5 rounded-sm border border-border bg-card p-4 text-sm text-ink-muted">
            {t("lessons.provisionalNotice")}
          </div>
        </div>
        {products.length ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
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
