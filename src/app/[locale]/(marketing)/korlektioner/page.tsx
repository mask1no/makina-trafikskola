import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/EmptyState";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { QuestionsBlock } from "@/components/QuestionsBlock";
import { isLocale } from "@/i18n/routing";
import { bookingEnabled, productLaunchApproved } from "@/lib/launch";
import { formatPrice } from "@/lib/pricing/format";
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
    searchParams: Promise<{ sort?: string; group?: string }>;
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  if (!isLocale(params.locale)) return null;
  setRequestLocale(params.locale);
  const t = await getTranslations();
  const sort = searchParams.sort === "lessons" ? "lessons" : "price";
  const group = searchParams.group;
  const products = (await getProducts(params.locale))
    .filter((product) => product.active && (product.kind === "SINGLE_LESSON" || product.kind === "PACKAGE"))
    .filter((product) => productLaunchApproved(product))
    .sort((a, b) =>
      sort === "lessons" ? b.lessonCredits - a.lessonCredits : a.priceOre - b.priceOre,
    );
  const singleLesson = products.find((product) => product.kind === "SINGLE_LESSON");
  const canBook = bookingEnabled();
  const allSections = groupProducts(products);
  const sections = allSections.filter((section) => !group || section.key === group);
  const cardLabels = {
    kindLabel: (key: string) => t(`product.kind.${key}`),
    perLessonLabel: t("product.perLesson"),
    validityLabel: (count: number) => t("product.validityMonths", { count }),
    vatLabel: t("product.priceIncludesVat"),
    valueSeparatelyLabel: (price: string) => t("pricing.valueSeparately", { price }),
    savingsLabel: (percent: number) => t("product.save", { percent }),
    popularLabel: t("product.popular"),
    swedishOnlyLabel: t("common.swedishOnly"),
    unavailableLabel: t("product.notForSale"),
    detailsLabel: t("common.readMore"),
  };
  const company = await getTranslations("company");
  const shell = await getTranslations("shell");

  return (
    <div className="section-shell">
      <div className="site-container">
        <PageHeader eyebrow={t("lessons.eyebrow")} title={t("lessons.title")} description={t("lessons.description")} />
        {singleLesson ? (
          <section className="relative mt-8 overflow-hidden rounded-lg bg-surface p-6 text-ink-inverse shadow-float sm:p-8 lg:p-10">
            <div
              aria-hidden="true"
              className="absolute -end-16 -top-20 size-56 rounded-full bg-accent opacity-15 blur-3xl"
            />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-black uppercase tracking-wider text-accent">
                  {t("lessons.introOffer.eyebrow")}
                </p>
                <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                  {t("lessons.introOffer.title")}
                </h2>
                <p className="mt-3 max-w-[65ch] leading-7 text-ink-inverse-muted">
                  {t("lessons.introOffer.description")}
                </p>
              </div>
              <div className="min-w-56 rounded-md border border-ink-inverse/15 bg-surface-raised p-5">
                <p className="text-sm text-ink-inverse-muted">
                  {t("lessons.introOffer.ordinary")}{" "}
                  {singleLesson.compareAtOre ? (
                    <s className="numbers-ltr">
                      {formatPrice(singleLesson.compareAtOre, params.locale)}
                    </s>
                  ) : null}
                </p>
                <p className="numbers-ltr mt-1 text-4xl font-black text-accent">
                  {formatPrice(singleLesson.priceOre, params.locale)}
                </p>
                <LinkButton
                  className="mt-4 w-full"
                  href={
                    canBook
                      ? `/${params.locale}/paket/${singleLesson.slug}`
                      : `/${params.locale}/kontakt`
                  }
                >
                  {canBook
                    ? t("lessons.introOffer.book")
                    : t("lessons.introOffer.callFirst")}
                </LinkButton>
              </div>
            </div>
          </section>
        ) : null}
        <ol className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
          {(canBook
            ? (["choose", "book", "learn"] as const)
            : (["choose", "call", "learn"] as const)).map((step, index) => (
            <li key={step} className="border-t border-border pt-4">
              <span className="numbers-ltr text-small font-black text-ink">{index + 1}</span>
              <h2 className="mt-3 text-h3 font-black">{t(`home.journey.${step}.title`)}</h2>
              <p className="mt-2 max-w-[70ch] text-body leading-7 text-ink-muted">{t(`home.journey.${step}.description`)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8">
          <Link className="inline-flex min-h-11 items-center font-bold underline underline-offset-4" href={`/${params.locale}/priser`}>
            {t("shell.seePrices")}
          </Link>
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-small font-bold" href={`/${params.locale}/korlektioner?sort=price${group ? `&group=${group}` : ""}`}>{t("lessons.sortPrice")}</Link>
          <Link className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-small font-bold" href={`/${params.locale}/korlektioner?sort=lessons${group ? `&group=${group}` : ""}`}>{t("lessons.sortLessons")}</Link>
          {allSections.map((section) => (
            <Link key={section.key} className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-small font-bold" href={`/${params.locale}/korlektioner?sort=${sort}&group=${section.key}`}>
              {t(`lessons.groups.${section.key}.title`)}
            </Link>
          ))}
        </div>
        {sections.length ? (
          <>
            <nav className="sticky top-[var(--header-height)] z-30 mt-8 flex max-w-full gap-2 overflow-x-auto bg-page py-3 lg:hidden" aria-label={t("lessons.groups.label")}>
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
                            labels: cardLabels,
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
        <QuestionsBlock
          title={shell("questions")}
          callLabel={shell("callUs")}
          mailLabel={shell("mailUs")}
          phone={company("phone")}
          email={company("email")}
        />
      </div>
    </div>
  );
}
