import Link from "next/link";
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
  lessonCredits: number;
  creditValidDays: number;
  tierLabel: string;
  includedLabel: string;
  perLessonLabel: string;
  validityLabel: string;
  vatLabel: string;
  badge?: string | null;
  badgeLabel?: string;
  swedishOnly?: boolean;
  swedishOnlyLabel: string;
  unavailableLabel: string;
  detailsLabel: string;
  savingsLabel?: string;
};

export function ProductCard(props: ProductCardProps) {
  const tierStyle = props.accentHex
    ? ({ "--tier-accent": props.accentHex } as CSSProperties)
    : undefined;

  return (
    <article
      className={`group relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border border-s-4 border-s-[var(--tier-accent,var(--accent))] bg-card shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-card ${
        props.active ? "border-border" : "border-border-strong"
      }`}
      style={tierStyle}
    >
      <div className="p-6 pb-0">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-muted">
          {props.tierLabel}
        </p>
        <h3 className="mt-3 text-xl font-bold">{props.name}</h3>
        {props.description ? (
          <p className="mt-3 text-sm leading-6 text-ink-muted">{props.description}</p>
        ) : null}
        <div className="mt-4 flex min-h-6 flex-wrap items-center gap-2">
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
        <div className="mt-5 border-t border-border pt-5">
          <h4 className="text-sm font-extrabold">{props.includedLabel}</h4>
        </div>
      </div>
      <ul className="grid content-start gap-2 px-6 py-4 text-sm">
        {props.features.map((feature) => (
          <li className="flex gap-2" key={feature}>
            <span aria-hidden="true" className="text-success">
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="p-6 pt-0">
        <div className="border-t border-border pt-5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 [direction:ltr]">
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
          {props.lessonCredits > 0 ? (
            <p className="mt-3 text-sm font-semibold text-ink">
              <bdi>{formatPrice(Math.round(props.priceOre / props.lessonCredits), props.locale)}</bdi>{" "}
              {props.perLessonLabel}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-ink-muted">{props.validityLabel}</p>
          <p className="mt-1 text-xs text-ink-muted">{props.vatLabel}</p>
        </div>
        <Link
          href={`/${props.locale}/paket/${props.slug}`}
          className={`mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-sm border px-4 font-bold transition ${
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
