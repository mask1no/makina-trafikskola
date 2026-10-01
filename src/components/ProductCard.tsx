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
  featured?: boolean;
  featuredLabel?: string;
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
      className={`relative flex h-full flex-col overflow-hidden break-words hyphens-auto rounded-lg border bg-card shadow-soft ${
        props.featured
          ? "border-accent"
          : "border-s-4 border-s-[var(--tier-accent,var(--accent))] border-border"
      } ${props.bookingEnabled && !props.active ? "border-border-strong" : ""}`}
      style={tierStyle}
    >
      {props.imageSrc ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          <Image
            src={props.imageSrc}
            alt={props.imageAlt ?? ""}
            fill
            quality={60}
            sizes="(max-width: 767px) 85vw, (max-width: 1279px) 45vw, 28vw"
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
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-muted">{props.description}</p>
        ) : null}
        <div className="mt-4 flex min-h-6 flex-wrap items-center gap-2">
          {props.featured && props.featuredLabel ? (
            <Badge tone="accent">{props.featuredLabel}</Badge>
          ) : null}
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
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong className="numbers-ltr text-2xl">{formatPrice(props.priceOre, props.locale)}</strong>
            {perLesson ? (
              <span className="text-sm font-semibold text-ink">
                <bdi className="numbers-ltr">{formatPrice(perLessonOre(props.priceOre, props.lessonCredits), props.locale)}</bdi>{" "}
                {props.perLessonLabel}
              </span>
            ) : null}
          </div>
          {props.savingsLabel ? (
            <Badge tone="success" className="mt-2">{props.savingsLabel}</Badge>
          ) : null}
          <p className="mt-2 text-sm text-ink-muted">
            {validity ? `${props.validityLabel} · ${props.vatLabel}` : props.vatLabel}
          </p>
          {props.valueSeparatelyLabel ? (
            <p className="mt-1 text-sm text-ink-muted">{props.valueSeparatelyLabel}</p>
          ) : null}
        </div>
        <div className="mt-auto pt-5">
          <Link
            href={`/${props.locale}/paket/${props.slug}`}
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-sm border px-4 font-bold transition ${
              props.bookingEnabled && !props.active
                ? "border-border-strong bg-card-muted text-ink"
                : "border-surface bg-surface text-ink-inverse hover:bg-surface-raised"
            }`}
          >
            {props.bookingEnabled && !props.active ? props.unavailableLabel : props.detailsLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
