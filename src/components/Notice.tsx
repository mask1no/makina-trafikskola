import type { HTMLAttributes, ReactNode } from "react";

type NoticeProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  tone?: "info" | "success" | "danger";
  icon?: ReactNode;
};

const tones = {
  info: "border-border-strong bg-card-muted",
  success: "border-success bg-success-soft",
  danger: "border-danger bg-danger-soft",
};

export function Notice({
  title,
  tone = "info",
  icon,
  children,
  className = "",
  ...props
}: NoticeProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`flex gap-3 rounded-md border p-4 text-sm leading-6 ${tones[tone]} ${className}`}
      {...props}
    >
      <span aria-hidden="true" className="mt-0.5 size-5 shrink-0">
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 10v6M12 7.5v.5" />
          </svg>
        )}
      </span>
      <div>
        {title ? <p className="font-extrabold text-ink">{title}</p> : null}
        <div className={title ? "mt-1 text-ink-muted" : "text-ink"}>{children}</div>
      </div>
    </div>
  );
}
