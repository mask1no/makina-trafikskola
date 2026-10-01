export type GroupableProduct = {
  kind: string;
  includesTheory: boolean;
  includesRisk1: boolean;
  includesRisk2: boolean;
};

export type ProductSectionKey =
  | "single"
  | "packages"
  | "intensive"
  | "courses"
  | "theory";

const SECTION_ORDER: ProductSectionKey[] = [
  "single",
  "packages",
  "intensive",
  "courses",
  "theory",
];

function sectionKey(product: GroupableProduct): ProductSectionKey | null {
  if (product.kind === "SINGLE_LESSON" || product.kind === "TEST_LESSON") {
    return "single";
  }
  if (product.kind === "COURSE_SEAT") return "courses";
  if (product.kind === "THEORY_ACCESS") return "theory";
  if (product.kind === "GUARANTEE") return "intensive";
  if (product.kind === "PACKAGE") {
    const bundled =
      product.includesTheory || product.includesRisk1 || product.includesRisk2;
    return bundled ? "intensive" : "packages";
  }
  return null;
}

export function groupProducts<T extends GroupableProduct>(products: readonly T[]) {
  const grouped = new Map<ProductSectionKey, T[]>();
  for (const product of products) {
    const key = sectionKey(product);
    if (!key) continue;
    const list = grouped.get(key);
    if (list) list.push(product);
    else grouped.set(key, [product]);
  }

  return SECTION_ORDER.flatMap((key) => {
    const sectionProducts = grouped.get(key);
    return sectionProducts?.length ? [{ key, products: sectionProducts }] : [];
  });
}
