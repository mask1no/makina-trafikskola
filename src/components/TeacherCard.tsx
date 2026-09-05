import Image from "next/image";
import Link from "next/link";

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
  const initials = props.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <article className="flex h-full flex-col rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {props.photoUrl ? (
          <Image
            src={props.photoUrl}
            alt={props.name}
            width={72}
            height={72}
            className="rtl-no-mirror size-[72px] shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid size-[72px] shrink-0 place-items-center rounded-full bg-surface text-lg font-bold text-ink-inverse"
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{props.name}</h3>
          {props.demoLabel ? (
            <span className="mt-2 inline-block rounded-full bg-accent px-2 py-1 text-xs font-bold text-accent-ink">
              {props.demoLabel}
            </span>
          ) : null}
          <p className="mt-1 text-sm text-ink-muted">{props.experienceLabel}</p>
          {props.swedishOnly ? (
            <span className="mt-2 inline-block rounded-full bg-page px-2 py-1 text-xs text-ink-muted">
              {props.swedishOnlyLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {props.languages.map((language) => (
          <span className="rounded-full bg-page px-3 py-1 text-xs font-semibold" key={language}>
            {language}
          </span>
        ))}
        {props.transmissions.map((transmission) => (
          <span className="rounded-full border border-border px-3 py-1 text-xs" key={transmission}>
            {transmission}
          </span>
        ))}
      </div>
      {props.locationNames.length ? (
        <p className="mt-4 text-sm text-ink-muted">{props.locationNames.join(" · ")}</p>
      ) : null}
      <Link
        href={`/${props.locale}/larare/${props.slug}`}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-4 font-bold text-accent-ink hover:bg-accent-hover"
      >
        {props.detailsLabel}
      </Link>
    </article>
  );
}
