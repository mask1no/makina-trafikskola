"use client";

import { useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `makina-theme=${theme};path=/;max-age=31536000;samesite=lax`;
}

export function ThemeToggle({
  initialTheme,
  toDarkLabel,
  toLightLabel,
}: {
  initialTheme: Theme;
  toDarkLabel: string;
  toLightLabel: string;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-pressed={isDark}
      aria-label={isDark ? toLightLabel : toDarkLabel}
      onClick={() => {
        const next = isDark ? "light" : "dark";
        applyTheme(next);
        setTheme(next);
      }}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-surface-soft bg-surface-raised text-ink-inverse outline-none transition hover:border-ink-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
    >
      {isDark ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M18.4 5.6l-1.1 1.1M6.7 17.3l-1.1 1.1" strokeLinecap="round" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M16.5 13.5A6.5 6.5 0 0 1 10.2 4 7 7 0 1 0 16.5 13.5Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
