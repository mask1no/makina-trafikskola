import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { Badge } from "@/components/Badge";
import {
  formatPrice,
  perLessonOre,
  showPerLessonPrice,
  showValidity,
} from "@/lib/pricing/format";

type ProductCardProps = {
  locale: string;
  slug: string;
  kind: string;
  active: boolean;
  bookingEnabled: boolean;
  name: string;
  description: string | null;
  priceOre: number;
  compareAtOre: number | null;
  accentHex: string | null;
  lessonCredits: number;
  includesTheory: boolean;
  includesRisk1: boolean;
  includesRisk2: boolean;
  creditValidDays: number;
  tierLabel: string;
  perLessonLabel: string;
  validityLabel: string;
  vatLabel: string;
  valueSeparatelyLabel?: string;
  badge?: string | null;
  badgeLabel?: string;
  swedishOnly?: boolean;
  swedishOnlyLabel: string;
  unavailableLabel: string;
  detailsLabel: string;
  savingsLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export function ProductCard(props: ProductCardProps) {
  const tierStyle = props.accentHex
    ? ({ "--tier-accent": props.accentHex } as CSSProperties)
    : undefined;
  const perLesson = showPerLessonPrice(props);
  const validity = showValidity(props.kind);

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden break-words hyphens-auto rounded-lg border border-s-4 border-s-[var(--tier-accent,var(--accent))] bg-card shadow-soft transition duration-700 ease-premium hover:-translate-y-0.5 hover:shadow-card ${
        props.active ? "border-border" : "border-border-strong"
      }`}
      style={tierStyle}
    >
      {props.imageSrc ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          <Image
            src={props.imageSrc}
            alt={props.imageAlt ?? ""}
            fill
            sizes="(min-width: 1024px) 30vw, 100vw"
            className="rtl-no-mirror object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-6">
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
          {!props.active && props.bookingEnabled ? (
            <Badge tone="danger">
              {props.unavailableLabel}
            </Badge>
          ) : null}
        </div>
        <div className="mt-5 border-t border-border pt-5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 [direction:ltr]">
            <strong className="text-2xl">{formatPrice(props.priceOre, props.locale)}</strong>
          </div>
          {props.valueSeparatelyLabel ? (
            <p className="mt-2 text-sm text-ink-muted">{props.valueSeparatelyLabel}</p>
          ) : null}
          {props.savingsLabel ? (
            <p className="mt-2 text-xs font-bold text-success">{props.savingsLabel}</p>
          ) : null}
          {perLesson ? (
            <p className="mt-3 text-sm font-semibold text-ink">
              <bdi>{formatPrice(perLessonOre(props.priceOre, props.lessonCredits), props.locale)}</bdi>{" "}
              {props.perLessonLabel}
            </p>
          ) : null}
          {validity ? (
            <p className="mt-1 text-sm text-ink-muted">{props.validityLabel}</p>
          ) : null}
          <p className="mt-1 text-xs text-ink-muted">{props.vatLabel}</p>
        </div>
        <div className="mt-auto pt-5">
          <Link
            href={`/${props.locale}/paket/${props.slug}`}
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-sm border px-4 font-bold transition ${
              props.active
                ? "border-surface bg-surface text-ink-inverse hover:bg-surface-raised"
                : "border-border-strong bg-card-muted text-ink"
            }`}
          >
            {props.detailsLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
