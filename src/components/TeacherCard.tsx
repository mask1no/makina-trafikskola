import Link from "next/link";

import { Avatar } from "@/components/Avatar";

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
    <article
      id={props.cardId}
      data-teacher={props.cardId ? "" : undefined}
      className="group flex h-full min-w-0 flex-col break-words hyphens-auto border-b border-border pb-6 transition duration-700 ease-premium hover:border-ink data-[selected=true]:border-accent"
    >
      <div className="flex items-start gap-4">
        <Avatar
          name={props.name}
          imageUrl={props.photoUrl}
          size="lg"
          className="transition duration-700 ease-premium group-hover:scale-[1.03]"
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
      <p className="mt-4 max-w-[70ch] text-body leading-7 text-ink-muted">
        {[...props.languages, ...props.transmissions].join(" · ")}
      </p>
      {props.locationNames.length ? (
        <p className="mt-2 text-small text-ink-muted">{props.locationNames.join(" · ")}</p>
      ) : null}
      <Link
        href={`/${props.locale}/larare/${props.slug}`}
        className="mt-5 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
      >
        {props.detailsLabel}
      </Link>
    </article>
  );
}
