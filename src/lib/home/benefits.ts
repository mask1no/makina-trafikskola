export type BenefitId =
  | "language"
  | "pickup"
  | "lesson"
  | "prices"
  | "risk"
  | "guarantee"
  | "payment"
  | "local"
  | "cancel"
  | "reminder"
  | "selfBook";

export type BenefitSize = "sm" | "lg";

export type BenefitItem = {
  id: BenefitId;
  size: BenefitSize;
  priceOre?: number;
};

type BenefitProduct = {
  kind: string;
  priceOre: number;
  includesRisk1: boolean;
  includesRisk2: boolean;
};

const LARGE = new Set<BenefitId>([
  "language",
  "prices",
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
}) {
  void input;
  return [
    item("language"),
    item("pickup"),
    item("lesson"),
    item("prices"),
    item("payment"),
    item("local"),
    item("cancel"),
    item("reminder"),
  ];
}
