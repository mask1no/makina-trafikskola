import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";

type TeacherCardProps = {
  locale: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  languages: string[];
  transmissions: string[];
  locationNames: string[];
  experienceLabel: string;
  detailsLabel: string;
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
      className="group flex h-full min-w-0 flex-col"
    >
      <div className="flex items-start gap-4">
        <Avatar
          name={props.name}
          imageUrl={props.photoUrl}
          size="lg"
        />
        <div className="min-w-0 pt-1">
          <h3 className="text-h3 font-extrabold tracking-tight">
            <bdi>{props.name}</bdi>
          </h3>
          {props.experienceLabel ? (
            <p className="mt-1 text-small text-ink-muted">{props.experienceLabel}</p>
          ) : null}
          {props.swedishOnly ? (
            <p className="mt-2 text-micro font-bold uppercase tracking-wider text-ink-subtle">
              {props.swedishOnlyLabel}
            </p>
          ) : null}
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {props.languages.map((language) => (
          <li key={language} className="rounded-full border border-[var(--line)] px-3 py-1 text-small">{language}</li>
        ))}
        {props.transmissions.map((transmission) => (
          <li key={transmission} className="rounded-full border border-[var(--line)] px-3 py-1 text-small">{transmission}</li>
        ))}
      </ul>
      {props.locationNames.length ? (
        <p className="mt-2 text-small text-ink-muted">{props.locationNames.join(" · ")}</p>
      ) : null}
      <Link
        href={`/${props.locale}/larare/${props.slug}`}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-accent font-bold text-accent-ink"
      >
        {props.detailsLabel}
      </Link>
    </Card>
  );
}
