"use client";

import { useState } from "react";

export function ClickToLoadMapEmbed({
  address,
  buttonLabel,
  title,
  privacy,
}: {
  address: string;
  buttonLabel: string;
  title: string;
  privacy: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-page">
      {loaded ? (
        <iframe
          title={title}
          src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
          className="h-[28rem] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="grid min-h-[28rem] place-items-center p-6 text-center">
          <div className="max-w-md">
            <p className="text-sm leading-6 text-ink-muted">{privacy}</p>
            <button
              type="button"
              className="mt-5 min-h-11 rounded-sm bg-surface px-5 font-bold text-ink-inverse"
              onClick={() => setLoaded(true)}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
