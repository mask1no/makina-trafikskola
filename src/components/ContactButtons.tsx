import type { ReactNode } from "react";

import { telHref } from "@/lib/format/phone";

type ContactButtonSize = "small" | "default" | "hero";

function sizeClass(size: ContactButtonSize) {
  if (size === "hero") return "min-h-[52px] px-6 text-body";
  if (size === "small") return "min-h-11 px-3 text-small";
  return "min-h-11 px-4 text-nav";
}

export function CallButton({
  phone,
  children,
  size = "default",
  className = "",
}: {
  phone: string;
  children: ReactNode;
  size?: ContactButtonSize;
  className?: string;
}) {
  return (
    <a
      href={telHref(phone)}
      className={`inline-flex items-center justify-center rounded-sm border border-accent bg-accent text-center font-extrabold text-accent-ink shadow-soft transition hover:bg-accent-hover ${sizeClass(size)} ${className}`}
    >
      {children}
    </a>
  );
}

export function MailButton({
  email,
  children,
  size = "default",
  className = "",
}: {
  email: string;
  children: ReactNode;
  size?: ContactButtonSize;
  className?: string;
}) {
  return (
    <a
      href={`mailto:${email}`}
      className={`inline-flex items-center justify-center rounded-sm border border-accent bg-surface text-center font-extrabold text-accent shadow-soft transition hover:bg-surface-raised ${sizeClass(size)} ${className}`}
    >
      {children}
    </a>
  );
}
