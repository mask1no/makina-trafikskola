import { describe, expect, it } from "vitest";

import {
  MIN_SAVINGS_PERCENT_TO_SHOW,
  toProductCardModel,
} from "@/lib/products/card";

const labels = {
  kindLabel: (key: string) => key,
  perLessonLabel: "per lesson",
  validityLabel: (count: number) => `${count} months`,
  vatLabel: "incl. VAT",
  valueSeparatelyLabel: (price: string) => `value ${price}`,
  savingsLabel: (percent: number) => `save ${percent}%`,
  popularLabel: "Popular",
  swedishOnlyLabel: "Swedish only",
  unavailableLabel: "Unavailable",
  detailsLabel: "Read more",
  featuredLabel: "Mest valt",
  imageAlt: (slug: string) => slug,
};

const baseProduct = {
  id: "p1",
  slug: "slug",
  kind: "PACKAGE",
  active: true,
  accentHex: null,
  lessonCredits: 3,
  includesTheory: true,
  includesRisk1: true,
  includesRisk2: false,
  creditValidDays: 180,
  priceOre: 90000,
  compareAtOre: 100000,
  badge: "popular",
  swedishOnly: false,
  translation: {
    name: "Product",
    shortDesc: "Desc",
  },
};

describe("toProductCardModel", () => {
  it("hides savings when below threshold", () => {
    const model = toProductCardModel({
      locale: "sv",
      bookingEnabled: true,
      product: {
        ...baseProduct,
        priceOre:
          baseProduct.compareAtOre! -
          Math.floor((baseProduct.compareAtOre! * (MIN_SAVINGS_PERCENT_TO_SHOW - 1)) / 100),
      },
      labels,
    });
    expect(model.savingsLabel).toBeUndefined();
  });

  it("shows featured label and suppresses popular badge on featured cards", () => {
    const model = toProductCardModel({
      locale: "sv",
      bookingEnabled: true,
      product: baseProduct,
      labels,
      featured: true,
    });

    expect(model.featuredLabel).toBe("Mest valt");
    expect(model.badge).toBeUndefined();
    expect(model.badgeLabel).toBeUndefined();
  });
});
