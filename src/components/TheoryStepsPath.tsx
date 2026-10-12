import Link from "next/link";

import {
  THEORY_CATEGORY_ICONS,
  TheoryIcon,
} from "@/components/TheoryIcon";

export type TheoryStep = {
  id: string;
  href: string;
  name: string;
  questionsLabel: string;
  swedishOnly?: string;
  status: "next" | "done" | "todo";
  iconOrder: number;
};

export function TheoryStepsPath({
  steps,
  doneLabel,
}: {
  steps: readonly TheoryStep[];
  doneLabel: string;
}) {
  if (!steps.length) return null;

  return (
    <ol className="theory-path relative mx-auto mt-10 max-w-3xl list-none p-0">
      {steps.map((step, index) => {
        const left = index % 2 === 0;
        const ring =
          step.status === "next"
            ? "border-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
            : step.status === "done"
              ? "border-accent bg-accent text-accent-ink"
              : "border-[var(--line)] bg-card text-ink";
        return (
          <li
            key={step.id}
            className={`relative z-10 flex justify-center py-6 md:w-[46%] ${
              left ? "md:me-auto md:justify-start md:ps-4" : "md:ms-auto md:justify-end md:pe-4"
            }`}
          >
            {index < steps.length - 1 ? (
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute start-1/2 top-[calc(50%+2.6rem)] z-0 h-16 w-24 -translate-x-1/2 text-border md:hidden"
                viewBox="0 0 96 64"
                fill="none"
              >
                <path
                  d="M48 0 C 28 18, 68 34, 48 64"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="theory-path-line"
                />
                <circle cx="48" cy="32" r="2.5" className="fill-accent" />
              </svg>
            ) : null}
            {index < steps.length - 1 ? (
              <svg
                aria-hidden="true"
                className={`pointer-events-none absolute top-[calc(50%+2.75rem)] z-0 hidden h-20 w-48 text-border md:block ${
                  left ? "start-[70%]" : "end-[70%]"
                }`}
                viewBox="0 0 192 80"
                fill="none"
              >
                <path
                  d={
                    left
                      ? "M16 0 C 40 28, 150 28, 176 80"
                      : "M176 0 C 152 28, 42 28, 16 80"
                  }
                  stroke="currentColor"
                  strokeWidth="2"
                  className="theory-path-line"
                />
                <circle
                  cx={left ? 96 : 96}
                  cy="40"
                  r="3"
                  className="fill-accent"
                />
              </svg>
            ) : null}
            <Link
              href={step.href}
              className="group relative z-10 flex w-40 flex-col items-center text-center"
            >
              <span className="relative">
                <span
                  className={`grid size-[4.75rem] place-items-center rounded-full border-2 shadow-card transition group-hover:border-accent sm:size-[5.25rem] ${ring}`}
                >
                  <TheoryIcon
                    name={THEORY_CATEGORY_ICONS[step.iconOrder - 1] ?? "questions"}
                    className="size-9"
                  />
                </span>
                {step.status === "done" ? (
                  <span
                    className="absolute -end-1 -top-1 grid size-7 place-items-center rounded-full bg-success-strong text-ink-inverse shadow-soft"
                    title={doneLabel}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.25"
                    >
                      <path
                        d="M5 12.5 10 17l9-10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="sr-only">{doneLabel}</span>
                  </span>
                ) : null}
              </span>
              <span className="mt-3 hyphens-none break-keep font-black leading-snug [overflow-wrap:normal]">
                {step.name}
              </span>
              <span className="numbers-ltr mt-1 text-sm text-ink-muted">
                {step.questionsLabel}
              </span>
              {step.swedishOnly ? (
                <span className="mt-1 text-xs text-ink-muted">{step.swedishOnly}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
