export type BenefitId =
  | "language"
  | "pickup"
  | "lesson"
  | "payment"
  | "cancel"
  | "validity"
  | "risk"
  | "reminder"
  | "guarantee";

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

const LARGE = new Set<BenefitId>(["language", "validity"]);

function item(id: BenefitId, priceOre?: number): BenefitItem {
  return {
    id,
    size: LARGE.has(id) ? "lg" : "sm",
    ...(priceOre === undefined ? {} : { priceOre }),
  };
}

export function benefitItems(input: {
  bookingEnabled?: boolean;
  products: readonly BenefitProduct[];
  hasRiskCourse?: boolean;
  hasPickupArea?: boolean;
  guaranteeConfirmed?: boolean;
}) {
  void input.bookingEnabled;
  void input.guaranteeConfirmed;
  const activeProducts = input.products.filter((product) => product.active);
  const hasRisk1 = activeProducts.some((product) => product.includesRisk1);
  const canPayOnline = activeProducts.length > 0;
  const showRisk = hasRisk1 || Boolean(input.hasRiskCourse);

  return [
    item("language"),
    ...(input.hasPickupArea ? [item("pickup")] : []),
    item("lesson"),
    ...(canPayOnline ? [item("payment")] : []),
    item("cancel"),
    item("validity"),
    ...(showRisk ? [item("risk")] : []),
    item("reminder"),
  ];
}
