import Link from "next/link";

type HubItem = {
  key: "steps" | "questions" | "signs" | "facts" | "ebook";
  href: string;
  title: string;
};

export function TheoryHubNav({
  label,
  items,
  activeKey,
}: {
  label: string;
  items: readonly HubItem[];
  activeKey?: HubItem["key"];
}) {
  return (
    <nav aria-label={label}>
      <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full border px-4 text-small font-bold transition ${
                  active
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-border bg-card text-ink hover:border-accent"
                }`}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
