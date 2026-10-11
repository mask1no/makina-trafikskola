import type { ReactNode } from "react";

export function SiteHeader({ children }: { children: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-soft bg-surface text-ink-inverse shadow-soft">
      {children}
    </header>
  );
}
