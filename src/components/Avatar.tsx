import type { CSSProperties } from "react";

type AvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "size-10 text-xs",
  md: "size-12 text-sm",
  lg: "size-16 text-base",
};

export function Avatar({
  name,
  imageUrl,
  size = "md",
  className = "",
}: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();
  const style = imageUrl
    ? ({ backgroundImage: `url("${encodeURI(imageUrl)}")` } as CSSProperties)
    : undefined;

  return (
    <span
      aria-label={name}
      role={imageUrl ? "img" : undefined}
      style={style}
      className={`rtl-no-mirror inline-grid shrink-0 place-items-center rounded-full border border-border bg-surface-raised bg-cover bg-center font-extrabold text-ink-inverse shadow-soft ${sizes[size]} ${className}`}
    >
      {imageUrl ? <span className="sr-only">{name}</span> : initials}
    </span>
  );
}
