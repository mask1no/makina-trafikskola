import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";

import { Badge } from "@/components/Badge";
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
  savingsLabel?: string;
  visualLabel?: string;
};

export function ProductCard(props: ProductCardProps) {
  const tierStyle = props.accentHex
    ? ({ "--tier-accent": props.accentHex } as CSSProperties)
    : undefined;

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-card ${
        props.active ? "border-border" : "border-border-strong"
      }`}
      style={tierStyle}
    >
      <div className="relative min-h-44 overflow-hidden border-b border-border bg-card-muted p-5">
        <div
          aria-hidden="true"
          className="absolute inset-block-0 start-0 w-2 bg-[var(--tier-accent,var(--accent))]"
        />
        <Image
          src="/illustration-package.svg"
          alt=""
          width={360}
          height={220}
          className={`rtl-no-mirror ms-auto h-36 w-auto object-contain transition duration-300 group-hover:scale-[1.02] ${
            props.active ? "" : "opacity-50 grayscale"
          }`}
        />
        {props.visualLabel ? (
          <span className="absolute bottom-4 start-5 text-xs font-extrabold uppercase tracking-[0.16em] text-ink-muted">
            {props.visualLabel}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-6">
      <div className="mb-4 flex min-h-6 flex-wrap items-center gap-2">
        {props.badge ? (
          <Badge tone="accent">
            {props.badgeLabel ?? props.badge}
          </Badge>
        ) : null}
        {props.swedishOnly ? (
          <Badge>
            {props.swedishOnlyLabel}
          </Badge>
        ) : null}
        {!props.active ? (
          <Badge tone="danger">
            {props.unavailableLabel}
          </Badge>
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
      {props.savingsLabel ? (
        <p className="mt-2 text-xs font-bold text-success">{props.savingsLabel}</p>
      ) : null}
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
      <div className="mt-auto" />
      <Link
        href={`/${props.locale}/paket/${props.slug}`}
        className={`inline-flex min-h-11 items-center justify-center rounded-sm border px-4 font-bold transition ${
          props.active
            ? "border-surface bg-surface text-ink-inverse hover:bg-surface-raised"
            : "border-border-strong bg-card-muted text-ink"
        }`}
      >
        {props.detailsLabel}
      </Link>
      </div>
    </article>
  );
}
