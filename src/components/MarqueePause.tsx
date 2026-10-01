"use client";

import { useState } from "react";

export function MarqueePause({
  pauseLabel,
  playLabel,
}: {
  pauseLabel: string;
  playLabel: string;
}) {
  const [paused, setPaused] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={paused}
      className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-ink shadow-soft"
      onClick={(event) => {
        const region = event.currentTarget.closest("[data-marquee]");
        const next = !paused;
        if (region instanceof HTMLElement) {
          if (next) region.dataset.paused = "true";
          else delete region.dataset.paused;
        }
        setPaused(next);
      }}
    >
      <span className="sr-only">{paused ? playLabel : pauseLabel}</span>
      {paused ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
          <path d="M8 5v14l11-7Z" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
        </svg>
      )}
    </button>
  );
}
