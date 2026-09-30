"use client";

import { useState } from "react";

import { Button } from "@/components/Button";

export function CalendarLink({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-4 grid gap-2">
      <p className="break-all text-sm" dir="ltr">
        <bdi>{url}</bdi>
      </p>
      <Button
        type="button"
        variant="tertiary"
        onClick={() => {
          void navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
          });
        }}
      >
        {copied ? label : label}
      </Button>
    </div>
  );
}
