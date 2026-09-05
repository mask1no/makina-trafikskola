type StepperProps = {
  steps: string[];
  current: number;
  progressLabel: string;
};

export function Stepper({ steps, current, progressLabel }: StepperProps) {
  return (
    <nav aria-label={progressLabel} className="rounded-md border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-muted">
          {progressLabel}
        </p>
        <p className="text-sm font-black [direction:ltr]">
          {current + 1}/{steps.length}
        </p>
      </div>
      <ol className="flex gap-2 sm:gap-3">
        {steps.map((step, index) => {
          const complete = index < current;
          const active = index === current;
          return (
            <li
              className="flex min-w-0 flex-1 flex-col gap-2"
              key={step}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`h-2 rounded-full transition-colors ${
                  active ? "bg-accent" : complete ? "bg-ink" : "bg-border"
                }`}
                aria-hidden="true"
              />
              <span
                className={`truncate text-xs sm:text-sm ${
                  active ? "font-bold text-ink" : "font-medium text-ink-muted"
                }`}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
