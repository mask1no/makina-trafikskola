"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Card } from "@/components/Card";

import type { PackageOffer, Product } from "./state";

export function PayStep({
  product,
  packages,
}: {
  product: Product | undefined;
  packages: PackageOffer[];
}) {
  const t = useTranslations("booking");
  return (
    <section>
      <h2 className="text-h2 font-black">{t("step.pay.title")}</h2>
      <Card className="mt-6">
        <p className="text-small font-bold text-ink-muted">{t("step.pay.single")}</p>
        <p className="mt-2 text-h3 font-black">{product?.name}</p>
        {product ? (
          <p className="numbers-ltr mt-2 text-h2 font-black">{product.priceLabel}</p>
        ) : null}
      </Card>
      {packages.length ? (
        <div className="mt-6">
          <h3 className="text-h3 font-black">{t("step.pay.packageTitle")}</h3>
          <p className="mt-2 text-ink-muted">{t("step.pay.packageBody")}</p>
          <ul className="mt-4 grid gap-3">
            {packages.map((offer) => (
              <li key={offer.href}>
                <Link href={offer.href} className="block">
                  <Card className="flex items-center justify-between gap-4">
                    <span className="font-bold">{offer.name}</span>
                    <span className="numbers-ltr font-black">{offer.priceLabel}</span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
