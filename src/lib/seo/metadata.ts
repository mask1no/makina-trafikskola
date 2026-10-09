import type { Metadata } from "next";

import { isLocale, locales } from "@/i18n/routing";

const siteName = "Makina Trafikskola";

function siteOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

export function pageCanonical(locale: string, path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const localized = `/${locale}${suffix === "/" ? "" : suffix}`;
  const origin = siteOrigin();
  return origin ? `${origin}${localized}` : localized;
}

export function withSocial(input: {
  title: string;
  description: string;
  canonical: string;
  locale: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const locale = isLocale(input.locale) ? input.locale : "sv";
  return {
    openGraph: {
      type: "website",
      siteName,
      title: input.title,
      description: input.description,
      url: input.canonical,
      locale,
      alternateLocale: locales.filter((item) => item !== locale),
      images: [{ url: `/api/og?title=${encodeURIComponent(input.title)}`, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [`/api/og?title=${encodeURIComponent(input.title)}`],
    },
  };
}
