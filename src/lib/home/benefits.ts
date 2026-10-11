export type BenefitId =
  | "language"
  | "pickup"
  | "lesson"
  | "risk"
  | "guarantee"
  | "payment"
  | "cancel"
  | "reminder";

export type BenefitSize = "sm" | "lg";

export type BenefitItem = {
  id: BenefitId;
  size: BenefitSize;
  priceOre?: number;
};

type BenefitProduct = {
  active: boolean;
  kind: string;
  priceOre: number;
  includesRisk1: boolean;
  includesRisk2: boolean;
};

const LARGE = new Set<BenefitId>([
  "language",
  "guarantee",
]);

function item(id: BenefitId, priceOre?: number): BenefitItem {
  return {
    id,
    size: LARGE.has(id) ? "lg" : "sm",
    ...(priceOre === undefined ? {} : { priceOre }),
  };
}

export function benefitItems(input: {
  bookingEnabled: boolean;
  products: readonly BenefitProduct[];
  hasRiskCourse?: boolean;
  hasPickupArea?: boolean;
  guaranteeConfirmed?: boolean;
}) {
  const activeProducts = input.products.filter((product) => product.active);
  const hasGuarantee = activeProducts.some(
    (product) => product.kind === "GUARANTEE",
  ) && input.guaranteeConfirmed;
  const canPayOnline = activeProducts.length > 0;

  return [
    item("language"),
    ...(input.hasPickupArea ? [item("pickup")] : []),
    item("lesson"),
    ...(input.hasRiskCourse ? [item("risk")] : []),
    ...(hasGuarantee ? [item("guarantee")] : []),
    ...(canPayOnline ? [item("payment")] : []),
    ...(input.bookingEnabled ? [item("reminder"), item("cancel")] : []),
  ];
}
