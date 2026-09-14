"use client";

import { useState } from "react";

type AvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
};

const sizes = {
  sm: "size-10 text-xs",
  md: "size-12 text-sm",
  lg: "size-20 text-xl sm:size-24",
  hero: "size-40 text-5xl sm:size-48",
};

export function Avatar({
  name,
  imageUrl,
  size = "md",
  className = "",
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <span
      aria-label={name}
      role={showImage ? "img" : undefined}
      className={`rtl-no-mirror relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-raised font-extrabold text-ink-inverse shadow-soft ${sizes[size]} ${className}`}
    >
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl ?? undefined}
            alt=""
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-cover"
          />
          <span className="sr-only">{name}</span>
        </>
      ) : (
        initials
      )}
    </span>
  );
}
