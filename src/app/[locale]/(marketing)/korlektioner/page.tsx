import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { isLocale } from "@/i18n/routing";
import { bookingEnabled } from "@/lib/launch";
import { groupProducts } from "@/lib/pricing/group";
import { toProductCardModel } from "@/lib/products/card";

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
  const testLesson = products.find((product) => product.kind === "TEST_LESSON");

  return (
    <div className="section-shell">
      <div className="site-container">
        <PageHeader eyebrow={t("lessons.eyebrow")} title={t("lessons.title")} description={t("lessons.description")} />
        {sections.length ? (
          <>
            <nav className="sticky top-[var(--header-height)] z-30 -mx-4 mt-8 flex gap-2 overflow-x-auto bg-page px-4 py-3 lg:hidden" aria-label={t("lessons.groups.label")}>
              {sections.map((section) => (
                <a key={section.key} href={`#${section.key}`} className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border bg-card px-4 text-small font-bold">
                  {t(`lessons.groups.${section.key}.title`)}
                </a>
              ))}
            </nav>
            <div className="mt-10 grid gap-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
              <aside className="sticky top-[calc(var(--header-height-lg)+1.5rem)] hidden lg:block">
                <nav className="grid gap-1" aria-label={t("lessons.groups.label")}>
                  {sections.map((section, index) => (
                    <a
                      key={section.key}
                      href={`#${section.key}`}
                      aria-current={index === 0 ? "page" : undefined}
                      className="inline-flex min-h-11 items-center rounded-sm px-3 text-small font-bold hover:bg-card aria-[current=page]:bg-card aria-[current=page]:text-ink"
                    >
                      {t(`lessons.groups.${section.key}.title`)}
                    </a>
                  ))}
                </nav>
              </aside>
              <div className="grid gap-10">
                {testLesson ? (
                  <Link
                    href={`/${params.locale}/paket/${testLesson.slug}`}
                    className="inline-flex min-h-11 items-center justify-between rounded-lg border border-border bg-card p-5 font-bold hover:border-ink"
                  >
                    <span>{t("lessons.testCallout")}</span>
                    <span aria-hidden="true" className="text-2xl leading-none">→</span>
                  </Link>
                ) : null}
                {sections.map((section) => (
                  <section key={section.key} id={section.key} className="scroll-mt-[calc(var(--header-height)+4rem)]">
                    <h2 className="text-h3 font-black">{t(`lessons.groups.${section.key}.title`)}</h2>
                    <p className="mt-2 max-w-[70ch] text-body leading-7 text-ink-muted">{t(`lessons.groups.${section.key}.intro`)}</p>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      {section.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          {...toProductCardModel({
                            locale: params.locale,
                            bookingEnabled: canBook,
                            product,
                            includeImage: false,
                            labels: {
                              kindLabel: (key) => t(`product.kind.${key}`),
                              perLessonLabel: t("product.perLesson"),
                              validityLabel: (count) =>
                                t("product.validityMonths", { count }),
                              vatLabel: t("product.priceIncludesVat"),
                              valueSeparatelyLabel: (price) =>
                                t("pricing.valueSeparately", { price }),
                              savingsLabel: (percent) =>
                                t("product.save", { percent }),
                              popularLabel: t("product.popular"),
                              swedishOnlyLabel: t("common.swedishOnly"),
                              unavailableLabel: t("product.notForSale"),
                              detailsLabel: t("common.readMore"),
                            },
                          })}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
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
