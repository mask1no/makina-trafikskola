import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";
import { locales, type Locale } from "@/i18n/routing";

import { ProductsEditor } from "./ProductsEditor";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [t, products] = await Promise.all([
    getTranslations("admin.editor"),
    db.product.findMany({
      orderBy: { sortOrder: "asc" },
      include: { translations: true },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader title={t("productsTitle")} />
      <ProductsEditor
        products={products.map((product) => {
          const descriptions = Object.fromEntries(
            locales.map((locale) => [
              locale,
              product.translations.find((item) => item.locale === locale)?.shortDesc ?? "",
            ]),
          ) as Record<Locale, string>;
          return {
            id: product.id,
            name: product.translations.find((item) => item.locale === "sv")?.name ?? product.slug,
            priceKr: Math.round(product.priceOre / 100),
            active: product.active,
            bestSeller: product.bestSeller,
            descriptions,
          };
        })}
      />
    </div>
  );
}
