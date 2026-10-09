"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { locales, type Locale } from "@/i18n/routing";

type Product = {
  id: string;
  name: string;
  priceKr: number;
  active: boolean;
  bestSeller: boolean;
  descriptions: Record<Locale, string>;
};

export function ProductsEditor({ products }: { products: Product[] }) {
  const t = useTranslations("admin.editor");
  const [rows, setRows] = useState(products);
  const [message, setMessage] = useState("");

  async function save(product: Product) {
    setMessage("");
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        priceKr: product.priceKr,
        active: product.active,
        bestSeller: product.bestSeller,
        descriptions: locales.map((locale) => ({
          locale,
          shortDesc: product.descriptions[locale] ?? "",
        })),
      }),
    });
    const body = await response.json().catch(() => null);
    setMessage(response.ok ? t("saved") : body?.error?.code ?? "UNKNOWN");
  }

  return (
    <div className="grid gap-4">
      {rows.map((product, index) => (
        <Card key={product.id} className="grid gap-3">
          <h2 className="font-black">{product.name}</h2>
          <label className="grid gap-1 text-small font-semibold">
            {t("price")}
            <input className="min-h-11 rounded-sm border border-border px-3" inputMode="numeric" value={product.priceKr} onChange={(event) => {
              const next = [...rows];
              next[index] = { ...product, priceKr: Number(event.target.value) };
              setRows(next);
            }} />
          </label>
          <label className="inline-flex min-h-11 items-center gap-2 text-small font-semibold">
            <input type="checkbox" checked={product.active} onChange={(event) => {
              const next = [...rows];
              next[index] = { ...product, active: event.target.checked };
              setRows(next);
            }} />
            {t("active")}
          </label>
          <label className="inline-flex min-h-11 items-center gap-2 text-small font-semibold">
            <input type="checkbox" checked={product.bestSeller} onChange={(event) => {
              const next = [...rows];
              next[index] = { ...product, bestSeller: event.target.checked };
              setRows(next);
            }} />
            {t("bestSeller")}
          </label>
          {locales.map((locale) => (
            <label key={locale} className="grid gap-1 text-small font-semibold">
              {t("shortDesc")} ({locale})
              <input className="min-h-11 rounded-sm border border-border px-3" value={product.descriptions[locale] ?? ""} onChange={(event) => {
                const next = [...rows];
                next[index] = {
                  ...product,
                  descriptions: { ...product.descriptions, [locale]: event.target.value },
                };
                setRows(next);
              }} />
            </label>
          ))}
          <Button type="button" onClick={() => void save(product)}>{t("save")}</Button>
        </Card>
      ))}
      {message ? <p className="text-small font-bold">{message}</p> : null}
    </div>
  );
}
