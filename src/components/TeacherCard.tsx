import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";

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
  demoLabel?: string;
  swedishOnly?: boolean;
  swedishOnlyLabel: string;
};

export function TeacherCard(props: TeacherCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft transition duration-200 hover:border-border-strong hover:shadow-card">
      <div className="h-2 bg-accent" aria-hidden="true" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <Avatar name={props.name} imageUrl={props.photoUrl} size="lg" className="size-20 text-xl" />
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold tracking-tight">{props.name}</h3>
          {props.demoLabel ? (
            <Badge tone="accent" className="mt-2">
              {props.demoLabel}
            </Badge>
          ) : null}
          <p className="mt-1 text-sm text-ink-muted">{props.experienceLabel}</p>
          {props.swedishOnly ? (
            <Badge className="mt-2">
              {props.swedishOnlyLabel}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
        {props.languages.map((language) => (
          <Badge key={language}>
            {language}
          </Badge>
        ))}
        {props.transmissions.map((transmission) => (
          <Badge key={transmission}>
            {transmission}
          </Badge>
        ))}
      </div>
      {props.locationNames.length ? (
        <p className="mt-4 text-sm text-ink-muted">{props.locationNames.join(" · ")}</p>
      ) : null}
      <Link
        href={`/${props.locale}/larare/${props.slug}`}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-sm bg-surface px-4 font-bold text-ink-inverse transition hover:bg-surface-raised"
      >
        {props.detailsLabel}
      </Link>
      </div>
    </article>
  );
}
