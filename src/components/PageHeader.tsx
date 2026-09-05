import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  align?: "start" | "center";
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "start",
}: PageHeaderProps) {
  const centered = align === "center";

  return (
    <header className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-ink-muted">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="section-title text-balance">{title}</h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
          {description}
        </p>
      ) : null}
      {actions ? (
        <div className={`mt-6 flex flex-wrap gap-3 ${centered ? "justify-center" : ""}`}>
          {actions}
        </div>
      ) : null}
    </header>
  );
}
