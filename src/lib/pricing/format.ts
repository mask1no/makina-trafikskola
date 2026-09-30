const NON_BREAKING_SPACE = "\u00A0";

export function formatPrice(ore: number, locale: string) {
  if (!Number.isSafeInteger(ore)) {
    throw new TypeError("PRICE_MUST_BE_INTEGER_ORE");
  }

  const sign = ore < 0 ? "-" : "";
  const absoluteOre = Math.abs(ore);
  const wholeKronor = Math.floor(absoluteOre / 100).toString();
  const grouped = wholeKronor.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    NON_BREAKING_SPACE,
  );
  const remainder = absoluteOre % 100;
  const decimalSeparator = locale === "en" ? "." : ",";
  const decimals =
    remainder === 0
      ? ""
      : `${decimalSeparator}${remainder.toString().padStart(2, "0")}`;

  return `${sign}${grouped}${decimals}${NON_BREAKING_SPACE}kr`;
}

export function perLessonOre(priceOre: number, lessonCredits: number) {
  if (lessonCredits <= 0) return 0;
  return Math.round(priceOre / lessonCredits / 100) * 100;
}

const PER_LESSON_KINDS = new Set([
  "PACKAGE",
  "SINGLE_LESSON",
  "TEST_LESSON",
]);

export function showValidity(kind: string) {
  return (
    kind === "PACKAGE" ||
    kind === "SINGLE_LESSON" ||
    kind === "TEST_LESSON" ||
    kind === "GUARANTEE"
  );
}

export function showPerLessonPrice(product: {
  lessonCredits: number;
  kind: string;
  includesTheory: boolean;
  includesRisk1: boolean;
  includesRisk2: boolean;
}) {
  return (
    product.lessonCredits > 0 &&
    PER_LESSON_KINDS.has(product.kind) &&
    !product.includesTheory &&
    !product.includesRisk1 &&
    !product.includesRisk2
  );
}
