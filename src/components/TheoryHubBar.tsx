"use client";

import { usePathname } from "next/navigation";

import { TheoryHubNav } from "@/components/TheoryHubNav";

type HubKey = "steps" | "questions" | "signs" | "facts" | "ebook";

export function TheoryHubBar({
  locale,
  label,
  titles,
}: {
  locale: string;
  label: string;
  titles: Record<HubKey, string>;
}) {
  const pathname = usePathname();
  const activeKey: HubKey = pathname.includes("/vagmarkesspel")
    ? "signs"
    : pathname.includes("/faktabank")
      ? "facts"
      : pathname.includes("/e-bok") || pathname.includes("/bok")
        ? "ebook"
        : pathname.includes("/ovning")
          ? "questions"
          : "steps";

  return (
    <TheoryHubNav
      label={label}
      activeKey={activeKey}
      items={[
        { key: "steps", href: `/${locale}/teori#steg-for-steg`, title: titles.steps },
        { key: "questions", href: `/${locale}/teori/ovning`, title: titles.questions },
        { key: "signs", href: `/${locale}/teori/vagmarkesspel`, title: titles.signs },
        { key: "facts", href: `/${locale}/teori/faktabank`, title: titles.facts },
        { key: "ebook", href: `/${locale}/teori/e-bok`, title: titles.ebook },
      ]}
    />
  );
}
