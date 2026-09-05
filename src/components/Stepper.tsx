type StepperProps = {
  steps: string[];
  current: number;
  progressLabel: string;
};

export function Stepper({ steps, current, progressLabel }: StepperProps) {
  return (
    <nav aria-label={progressLabel}>
      <ol className="flex gap-2">
        {steps.map((step, index) => {
          const active = index <= current;
          return (
            <li className="flex min-w-0 flex-1 flex-col gap-2" key={step}>
              <span
                className={`h-1.5 rounded-full ${active ? "bg-accent" : "bg-border"}`}
                aria-hidden="true"
              />
              <span
                className={`truncate text-xs ${
                  index === current ? "font-bold text-ink" : "text-ink-muted"
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
