"use client";

import { useState } from "react";

import { StaticMapArtwork } from "@/components/StaticMapArtwork";

export function MapEmbed({
  address,
  title,
  privacy,
  loadLabel,
}: {
  address: string;
  title: string;
  privacy: string;
  loadLabel: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
      {loaded ? (
        <iframe
          title={title}
          src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
          className="h-80 w-full border-0 sm:h-[28rem]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="relative grid h-80 place-items-center overflow-hidden bg-surface p-6 text-center text-ink-inverse sm:h-[28rem]">
          <StaticMapArtwork className="absolute inset-0 size-full opacity-45" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_35%,transparent),var(--surface)_92%)]" />
          <div className="relative max-w-md rounded-md border border-ink-inverse/15 bg-surface-raised/95 p-5 shadow-float">
            <p className="text-small leading-6 text-ink-inverse-muted">
              {privacy}
            </p>
            <button
              type="button"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-5 font-bold text-accent-ink"
              onClick={() => setLoaded(true)}
            >
              {loadLabel}
            </button>
          </div>
        </div>
      )}
      {loaded ? (
        <p className="px-4 py-3 text-small leading-6 text-ink-muted">{privacy}</p>
      ) : null}
    </div>
  );
}
