import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";

type TeacherCardProps = {
  name: string;
  photoUrl: string | null;
  languages: string[];
  transmissions: string[];
  locationNames: string[];
  experienceLabel: string;
  nextFreeLabel?: string;
  nextFreeTime?: string;
  cardId?: string;
  demoLabel?: string;
  swedishOnly?: boolean;
  swedishOnlyLabel: string;
};

export function TeacherCard(props: TeacherCardProps) {
  return (
    <Card
      id={props.cardId}
      data-teacher={props.cardId ? "" : undefined}
      className="flex h-full min-w-0 items-start gap-3"
      padding="sm"
    >
      <Avatar name={props.name} imageUrl={props.photoUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <h3 className="font-extrabold tracking-tight"><bdi>{props.name}</bdi></h3>
        {props.experienceLabel ? (
          <p className="mt-0.5 text-small text-ink-muted">{props.experienceLabel}</p>
        ) : null}
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {[...props.languages, ...props.transmissions].map((label) => (
            <li key={label} className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs">
              {label}
            </li>
          ))}
        </ul>
        {props.locationNames.length ? (
          <p className="mt-2 text-small text-ink-muted">{props.locationNames.join(" · ")}</p>
        ) : null}
        {props.nextFreeTime ? (
          <p className="mt-2 text-small text-ink-muted">
            {props.nextFreeLabel}{" "}
            <bdi dir="ltr" className="numbers-ltr font-bold text-ink">{props.nextFreeTime}</bdi>
          </p>
        ) : null}
        {props.swedishOnly ? (
          <p className="mt-2 text-micro font-bold uppercase tracking-wider text-ink-subtle">
            {props.swedishOnlyLabel}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
