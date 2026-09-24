"use client";

import Image from "next/image";
import { useState } from "react";

export function TheoryQuestionImage({
  src,
  alt,
  missingLabel,
}: {
  src: string | null;
  alt: string;
  missingLabel: string;
}) {
  const [missing, setMissing] = useState(false);
  if (!src) return null;
  if (missing) {
    return <p className="mt-4 text-sm text-ink-muted">{missingLabel}</p>;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={450}
      unoptimized
      onError={() => setMissing(true)}
      className="mt-4 h-auto w-full rounded-md"
    />
  );
}
