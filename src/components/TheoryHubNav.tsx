import Link from "next/link";

import { TheoryIcon } from "@/components/TheoryIcon";

type HubItem = {
  key: "steps" | "questions" | "signs" | "book" | "facts";
  href: string;
  title: string;
  description: string;
  badge?: string;
};

export function TheoryHubNav({
  label,
  items,
}: {
  label: string;
  items: readonly HubItem[];
}) {
  return (
    <nav aria-label={label} className="mt-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="group relative flex min-h-36 flex-col rounded-md border border-border bg-card p-4 shadow-soft transition hover:border-accent"
          >
            {item.badge ? (
              <span className="absolute end-3 top-3 rounded-full bg-page px-2 py-1 text-xs font-bold text-ink-muted">
                {item.badge}
              </span>
            ) : null}
            <span className="grid size-11 place-items-center rounded-sm bg-accent-soft text-ink">
              <TheoryIcon name={item.key} className="size-6" />
            </span>
            <strong className="mt-4">{item.title}</strong>
            <span className="mt-1 text-sm leading-5 text-ink-muted">
              {item.description}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
