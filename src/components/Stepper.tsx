type StepperProps = {
  steps: string[];
  current: number;
  progressLabel: string;
  completed?: number[];
};

export function Stepper({
  steps,
  current,
  progressLabel,
  completed = [],
}: StepperProps) {
  return (
    <nav aria-label={progressLabel} className="border-b border-border pb-5">
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
          const complete = index < current || completed.includes(index);
          const active = index === current;
          return (
            <li
              className="flex min-w-0 flex-1 flex-col gap-2"
              key={step}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`h-1.5 rounded-full transition-colors duration-300 ${
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
