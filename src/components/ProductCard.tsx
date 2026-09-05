import Link from "next/link";
import type { CSSProperties } from "react";

import { formatPrice } from "@/lib/pricing/format";

type ProductCardProps = {
  locale: string;
  slug: string;
  active: boolean;
  name: string;
  description: string | null;
  features: string[];
  priceOre: number;
  compareAtOre: number | null;
  accentHex: string | null;
  badge?: string | null;
  badgeLabel?: string;
  swedishOnly?: boolean;
  swedishOnlyLabel: string;
  unavailableLabel: string;
  detailsLabel: string;
};

export function ProductCard(props: ProductCardProps) {
  const tierStyle = props.accentHex
    ? ({ "--tier-accent": props.accentHex } as CSSProperties)
    : undefined;

  return (
    <article
      className="flex h-full flex-col rounded-lg border border-border border-t-[6px] border-t-[var(--tier-accent,var(--accent))] bg-card p-6 shadow-sm"
      style={tierStyle}
    >
      <div className="mb-4 flex min-h-6 flex-wrap items-center gap-2">
        {props.badge ? (
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">
            {props.badgeLabel ?? props.badge}
          </span>
        ) : null}
        {props.swedishOnly ? (
          <span className="rounded-full bg-page px-3 py-1 text-xs text-ink-muted">
            {props.swedishOnlyLabel}
          </span>
        ) : null}
      </div>
      <h3 className="text-xl font-bold">{props.name}</h3>
      {props.description ? (
        <p className="mt-2 text-sm leading-6 text-ink-muted">{props.description}</p>
      ) : null}
      <div className="mt-5 flex items-baseline gap-2 [direction:ltr]">
        <strong className="text-2xl">{formatPrice(props.priceOre, props.locale)}</strong>
        {props.compareAtOre && props.compareAtOre > props.priceOre ? (
          <span className="text-sm text-ink-muted line-through">
            {formatPrice(props.compareAtOre, props.locale)}
          </span>
        ) : null}
      </div>
      <ul className="my-5 grid gap-2 text-sm">
        {props.features.map((feature) => (
          <li className="flex gap-2" key={feature}>
            <span aria-hidden="true" className="text-success">
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {!props.active ? (
        <p className="mt-auto mb-3 text-xs font-semibold text-ink-muted">
          {props.unavailableLabel}
        </p>
      ) : (
        <div className="mt-auto" />
      )}
      <Link
        href={`/${props.locale}/paket/${props.slug}`}
        className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-4 font-bold hover:border-accent"
      >
        {props.detailsLabel}
      </Link>
    </article>
  );
}
