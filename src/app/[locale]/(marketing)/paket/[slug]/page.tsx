import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { formatPrice } from "@/lib/pricing/format";
import { isLocale } from "@/i18n/routing";

import { getProduct } from "../../_lib/data";
import { PurchaseControl } from "./PurchaseControl";

export const dynamic = "force-dynamic";

function schemaPriceFromOre(priceOre: number) {
  const digits = String(priceOre).padStart(3, "0");
  return `${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const product = await getProduct(params.locale, params.slug);
  if (!product) return {};
  return {
    title: product.translation.name,
    description: product.translation.shortDesc ?? undefined,
    robots: product.active ? undefined : { index: false, follow: true },
  };
}

export default async function ProductDetailPage(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const [t, product] = await Promise.all([
    getTranslations(),
    getProduct(params.locale, params.slug),
  ]);
  if (!product) notFound();

  const tierStyle = product.accentHex
    ? ({ "--tier-accent": product.accentHex } as CSSProperties)
    : undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.translation.name,
    ...(product.translation.shortDesc
      ? { description: product.translation.shortDesc }
      : {}),
    sku: product.id,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: schemaPriceFromOre(product.priceOre),
      availability: product.active
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      ...(siteUrl
        ? { url: `${siteUrl}/${params.locale}/paket/${product.slug}` }
        : {}),
    },
  };

  return (
    <div className="px-4 py-12 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <article
        className="mx-auto grid max-w-5xl overflow-hidden rounded-lg border border-border border-t-[8px] border-t-[var(--tier-accent,var(--accent))] bg-card shadow-sm md:grid-cols-[1.15fr_.85fr]"
        style={tierStyle}
      >
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap gap-2">
            {product.badge ? (
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">
                {t("product.popular")}
              </span>
            ) : null}
            {product.swedishOnly ? (
              <span className="rounded-full bg-page px-3 py-1 text-xs text-ink-muted">
                {t("common.swedishOnly")}
              </span>
            ) : null}
          </div>
          <h1 className="mt-5 text-4xl font-black">{product.translation.name}</h1>
          {product.translation.shortDesc ? (
            <p className="mt-4 text-lg leading-8 text-ink-muted">
              {product.translation.shortDesc}
            </p>
          ) : null}
          <h2 className="mt-8 text-lg font-bold">{t("product.included")}</h2>
          <ul className="mt-4 grid gap-3">
            {product.translation.features.map((feature) => (
              <li className="flex gap-3" key={feature}>
                <span aria-hidden="true" className="text-success">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="border-t border-border bg-page p-6 sm:p-10 md:border-s md:border-t-0">
          <p className="text-sm font-semibold text-ink-muted">{t("product.priceIncludesVat")}</p>
          <p className="mt-2 text-4xl font-black [direction:ltr]">
            {formatPrice(product.priceOre, params.locale)}
          </p>
          {product.compareAtOre && product.compareAtOre > product.priceOre ? (
            <p className="mt-2 text-ink-muted line-through [direction:ltr]">
              {formatPrice(product.compareAtOre, params.locale)}
            </p>
          ) : null}
          <PurchaseControl
            productId={product.id}
            active={product.active}
            inactiveLabel={t("product.notForSale")}
            copy={{
              terms: t("product.checkout.terms"),
              withdrawal: t("product.checkout.withdrawal"),
              submit: t("product.checkout.submit"),
              redirecting: t("product.checkout.redirecting"),
              error: t("product.checkout.error"),
            }}
          />
          <p className="mt-4 text-sm leading-6 text-ink-muted">
            {t("product.provisionalDescription")}
          </p>
        </aside>
      </article>
    </div>
  );
}
