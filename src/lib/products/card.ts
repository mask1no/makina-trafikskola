import type { ProductCardProps } from "@/components/ProductCard";
import { formatPrice } from "@/lib/pricing/format";

export const MIN_SAVINGS_PERCENT_TO_SHOW = 5;
export const CREDIT_VALID_DAYS_PER_MONTH = 30;

type ProductForCard = {
  id: string;
  slug: string;
  kind: string;
  active: boolean;
  accentHex: string | null;
  lessonCredits: number;
  includesTheory: boolean;
  includesRisk1: boolean;
  includesRisk2: boolean;
  creditValidDays: number;
  priceOre: number;
  compareAtOre: number | null;
  badge: string | null;
  swedishOnly: boolean;
  translation: {
    name: string;
    shortDesc: string | null;
  };
};

type ProductCardLabels = {
  kindLabel: (key: string) => string;
  perLessonLabel: string;
  validityLabel: (count: number) => string;
  vatLabel: string;
  valueSeparatelyLabel: (price: string) => string;
  savingsLabel: (percent: number) => string;
  popularLabel: string;
  swedishOnlyLabel: string;
  unavailableLabel: string;
  detailsLabel: string;
  featuredLabel?: string;
  imageAlt?: (slug: string) => string | undefined;
};

type ProductCardModelOptions = {
  locale: string;
  bookingEnabled: boolean;
  product: ProductForCard;
  labels: ProductCardLabels;
  featured?: boolean;
  includeImage?: boolean;
};

const IMAGE_BY_KIND: Record<string, string | undefined> = {
  SINGLE_LESSON: "/lessons/korlektion.jpg",
  TEST_LESSON: "/lessons/testlektion.jpg",
  PACKAGE: "/lessons/tre-lektioner.jpg",
};

function savingsPercent(product: ProductForCard) {
  if (
    product.kind === "GUARANTEE" ||
    !product.compareAtOre ||
    product.compareAtOre <= product.priceOre
  ) {
    return null;
  }
  return Math.round((1 - product.priceOre / product.compareAtOre) * 100);
}

function tierKey(product: ProductForCard) {
  if (
    product.kind === "PACKAGE" &&
    product.includesTheory &&
    (product.includesRisk1 || product.includesRisk2)
  ) {
    return "INTENSIVE_PACKAGE";
  }
  return product.kind;
}

export function toProductCardModel({
  locale,
  bookingEnabled,
  product,
  labels,
  featured = false,
  includeImage = true,
}: ProductCardModelOptions): ProductCardProps {
  const validMonths = Math.max(
    1,
    Math.round(product.creditValidDays / CREDIT_VALID_DAYS_PER_MONTH),
  );
  const percent = savingsPercent(product);
  const imageSrc = includeImage ? IMAGE_BY_KIND[product.kind] : undefined;
  const featuredLabel = featured ? labels.featuredLabel : undefined;

  return {
    locale,
    slug: product.slug,
    kind: product.kind,
    active: product.active,
    bookingEnabled,
    name: product.translation.name,
    description: product.translation.shortDesc,
    priceOre: product.priceOre,
    compareAtOre: product.compareAtOre,
    accentHex: product.accentHex,
    lessonCredits: product.lessonCredits,
    includesTheory: product.includesTheory,
    includesRisk1: product.includesRisk1,
    includesRisk2: product.includesRisk2,
    creditValidDays: product.creditValidDays,
    tierLabel: labels.kindLabel(tierKey(product)),
    perLessonLabel: labels.perLessonLabel,
    validityLabel: labels.validityLabel(validMonths),
    vatLabel: labels.vatLabel,
    valueSeparatelyLabel:
      product.kind !== "GUARANTEE" &&
      product.compareAtOre &&
      product.compareAtOre > product.priceOre
        ? labels.valueSeparatelyLabel(formatPrice(product.compareAtOre, locale))
        : undefined,
    badge: featured ? undefined : product.badge,
    badgeLabel: featured ? undefined : product.badge ? labels.popularLabel : undefined,
    swedishOnly: product.swedishOnly,
    swedishOnlyLabel: labels.swedishOnlyLabel,
    unavailableLabel: labels.unavailableLabel,
    detailsLabel: labels.detailsLabel,
    featured,
    featuredLabel,
    imageSrc,
    imageAlt: imageSrc
      ? labels.imageAlt?.(product.slug) ?? product.translation.name
      : undefined,
    savingsLabel:
      percent !== null && percent >= MIN_SAVINGS_PERCENT_TO_SHOW
        ? labels.savingsLabel(percent)
        : undefined,
  };
}
