import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { Badge } from "@/components/Badge";
import { Notice } from "@/components/Notice";
import { bookingEnabled } from "@/lib/launch";
import {
  formatPrice,
  perLessonOre,
  showPerLessonPrice,
  showValidity,
} from "@/lib/pricing/format";
import { displayPhone, telHref } from "@/lib/format/phone";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";
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
  const title = product.translation.name;
  const description = product.translation.shortDesc ?? "";
  const canonical = pageCanonical(params.locale, `/paket/${params.slug}`);
  return {
    title,
    description,
    alternates: { canonical },
    ...withSocial({
      title,
      description,
      canonical,
      locale: params.locale,
    }),
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
  const [t, product, session] = await Promise.all([
    getTranslations(),
    getProduct(params.locale, params.slug),
    auth(),
  ]);
  if (!product) notFound();
  const salesOpen = bookingEnabled();
  const separateValue =
    product.kind !== "GUARANTEE" &&
    product.compareAtOre &&
    product.compareAtOre > product.priceOre
      ? product.compareAtOre
      : null;

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

  const perLesson = showPerLessonPrice(product)
    ? formatPrice(perLessonOre(product.priceOre, product.lessonCredits), params.locale)
    : null;
  const validityLine = [
    showValidity(product.kind)
      ? t("product.validityMonths", { count: Math.round(product.creditValidDays / 30) })
      : null,
    t("product.priceIncludesVat"),
  ].filter(Boolean).join(" · ");
  const phone = t("company.phone");
  const callLabel = t.rich("shell.callName", {
    phone: () => (
      <bdi dir="ltr" className="numbers-ltr">
        {displayPhone(phone)}
      </bdi>
    ),
  });

  return (
    <div className="section-shell pb-28 md:pb-[clamp(3.5rem,8vw,7rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <article
        className="site-container grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-12"
        style={tierStyle}
      >
        <div>
          <div className="relative min-h-56 overflow-hidden bg-surface sm:min-h-72">
            <Image
              src="/hero.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="rtl-no-mirror object-cover object-[60%_center] opacity-80"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--surface)_0%,transparent_55%)] rtl:bg-[linear-gradient(270deg,var(--surface)_0%,transparent_55%)]" />
            <div className="absolute inset-block-0 start-0 w-1.5 bg-[var(--tier-accent,var(--accent))]" />
            <p className="absolute bottom-6 start-6 text-xs font-extrabold uppercase tracking-[0.18em] text-ink-inverse-muted">
              {t("product.visualLabel")}
            </p>
          </div>
          <div className="py-8 sm:py-10">
          <div className="flex flex-wrap gap-2">
            {product.badge ? (
              <Badge tone="accent">
                {t("product.popular")}
              </Badge>
            ) : null}
            {product.swedishOnly ? (
              <Badge>
                {t("common.swedishOnly")}
              </Badge>
            ) : null}
            {!product.active && salesOpen ? <Badge tone="danger">{t("product.notForSale")}</Badge> : null}
          </div>
          <h1 className="section-title mt-6 text-balance">{product.translation.name}</h1>
          <div className="mt-4 lg:hidden">
            <p className="numbers-ltr text-3xl font-black">{formatPrice(product.priceOre, params.locale)}</p>
            {perLesson ? (
              <p className="mt-1 text-sm font-semibold"><bdi className="numbers-ltr">{perLesson}</bdi> {t("product.perLesson")}</p>
            ) : null}
            <p className="mt-1 text-sm text-ink-muted">{validityLine}</p>
          </div>
          {product.translation.shortDesc ? (
            <p className="mt-4 text-lg leading-8 text-ink-muted">
              {product.translation.shortDesc}
            </p>
          ) : null}
          </div>
        </div>
        <aside id="kop" className="h-fit rounded-lg border border-border bg-card p-6 shadow-card sm:p-8 lg:sticky lg:top-[calc(var(--header-height-lg)+1.5rem)]">
          <div className="hidden md:block">
          <p className="numbers-ltr text-4xl font-black">
            {formatPrice(product.priceOre, params.locale)}
          </p>
          {separateValue ? (
            <>
              <p className="mt-2 text-sm text-ink-muted">
                {t("pricing.valueSeparately", {
                  price: formatPrice(separateValue, params.locale),
                })}
              </p>
              <p className="mt-2 font-bold text-success">
                {t("product.saveAmount", { amount: formatPrice(separateValue - product.priceOre, params.locale) })}
              </p>
            </>
          ) : null}
          {perLesson ? (
            <p className="mt-4 font-semibold">
              <bdi className="numbers-ltr">{perLesson}</bdi>{" "}
              {t("product.perLesson")}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-ink-muted">{validityLine}</p>
          </div>
          <PurchaseControl
            productId={product.id}
            active={product.active}
            salesOpen={salesOpen}
            phone={phone}
            callLabel={callLabel}
            authenticated={session?.user.role === "STUDENT"}
            signInHref={`/${params.locale}/logga-in?next=${encodeURIComponent(`/${params.locale}/paket/${product.slug}`)}`}
            inactiveLabel={t("product.notForSale")}
            copy={{
              accountRequired: t("auth.purchaseGate"),
              signInToBuy: t("auth.signInToBuy"),
              terms: t("product.checkout.terms"),
              withdrawal: t("product.checkout.withdrawal"),
              submit: t("product.checkout.submit"),
              redirecting: t("product.checkout.redirecting"),
              error: t("product.checkout.error"),
            }}
          />
          {salesOpen ? (
            <Notice className="mt-5">
              {product.active ? t("product.availableDescription") : t("product.inactiveDescription")}
            </Notice>
          ) : null}
          <p className="mt-4 text-sm text-ink-muted">{t("product.cancelNote")}</p>
        </aside>
      </article>
      <div className="fixed inset-x-0 z-30 border-t border-border bg-card px-4 py-3 md:hidden" style={{ bottom: "calc(var(--tab-bar-height) + var(--safe-bottom))" }}>
        <div className="flex items-center justify-between gap-3">
          <p className="numbers-ltr text-lg font-black">{formatPrice(product.priceOre, params.locale)}</p>
          {salesOpen && product.active ? (
            <a href="#kop" className="inline-flex min-h-11 items-center rounded-sm bg-surface px-4 font-bold text-ink-inverse">{t("product.checkout.submit")}</a>
          ) : salesOpen ? (
            <span className="inline-flex min-h-11 items-center text-sm font-bold text-ink-muted">{t("product.notForSale")}</span>
          ) : (
            <a href={telHref(phone)} className="inline-flex min-h-11 items-center rounded-sm bg-accent px-4 font-bold text-accent-ink">{callLabel}</a>
          )}
        </div>
      </div>
    </div>
  );
}
