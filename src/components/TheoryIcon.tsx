type TheoryIconName =
  | "steps"
  | "questions"
  | "signs"
  | "book"
  | "facts"
  | "rules"
  | "safety"
  | "people"
  | "vehicle"
  | "environment"
  | "country"
  | "city"
  | "parking"
  | "mixed";

export function TheoryIcon({
  name,
  className = "size-8",
}: {
  name: TheoryIconName;
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      {...common}
    >
      {name === "steps" ? (
        <>
          <circle cx="5" cy="18" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="6" r="2" />
          <path d="m6.7 16.5 3.6-3M13.7 10.5l3.6-3" />
        </>
      ) : null}
      {name === "questions" ? (
        <>
          <path d="M6 4.5h12v15H6z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </>
      ) : null}
      {name === "signs" ? (
        <>
          <path d="M12 3 4 17h16L12 3Z" />
          <path d="M12 9v3.5M12 15.5h.01" />
          <path d="M12 17v4" />
        </>
      ) : null}
      {name === "book" ? (
        <>
          <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z" />
          <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v17h4.5A3.5 3.5 0 0 1 20 22V5.5Z" />
        </>
      ) : null}
      {name === "facts" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7h.01" />
        </>
      ) : null}
      {name === "rules" ? (
        <>
          <path d="M12 3v18M5 7h14" />
          <path d="m7 7-3 6h6L7 7Zm10 0-3 6h6l-3-6Z" />
        </>
      ) : null}
      {name === "safety" ? (
        <>
          <path d="M12 3 5 6v5c0 4.7 2.8 8.1 7 10 4.2-1.9 7-5.3 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      ) : null}
      {name === "people" ? (
        <>
          <circle cx="12" cy="8" r="3" />
          <path d="M6.5 20c.6-4 2.4-6 5.5-6s4.9 2 5.5 6" />
          <path d="M4 11h3M17 11h3" />
        </>
      ) : null}
      {name === "vehicle" ? (
        <>
          <path d="m5 10 1.5-4h11L19 10" />
          <path d="M4 10h16v7H4z" />
          <circle cx="7" cy="17" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
        </>
      ) : null}
      {name === "environment" ? (
        <>
          <path d="M19 4C10 4 5 8 5 14c0 3 2 5 5 5 6 0 9-6 9-15Z" />
          <path d="M6 20c2-5 5-8 10-11" />
        </>
      ) : null}
      {name === "country" ? (
        <>
          <path d="M3 17 8 8l4 6 3-4 6 7H3Z" />
          <path d="M5 21h14" />
        </>
      ) : null}
      {name === "city" ? (
        <>
          <path d="M4 21V8h6v13M10 21V3h7v18M17 21v-9h3v9" />
          <path d="M7 11h.01M7 15h.01M13 7h.01M13 11h.01M13 15h.01" />
        </>
      ) : null}
      {name === "parking" ? (
        <>
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
        </>
      ) : null}
      {name === "mixed" ? (
        <>
          <path d="M4 7h4l8 10h4" />
          <path d="m17 14 3 3-3 3M4 17h4l2-2.5M14 9.5 16 7h4" />
          <path d="m17 4 3 3-3 3" />
        </>
      ) : null}
    </svg>
  );
}

export const THEORY_CATEGORY_ICONS = [
  "rules",
  "safety",
  "people",
  "vehicle",
  "environment",
  "country",
  "city",
  "parking",
  "mixed",
] as const satisfies readonly TheoryIconName[];
