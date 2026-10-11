import type { ReactNode } from "react";

export function SiteFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="border-t border-surface-soft bg-surface py-10 text-ink-inverse sm:py-14">
      {children}
    </footer>
  );
}
