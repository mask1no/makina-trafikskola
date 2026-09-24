import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  let sitemapUrl: string | undefined;
  if (configured) {
    try {
      sitemapUrl = `${new URL(configured).origin}/sitemap.xml`;
    } catch {
      sitemapUrl = undefined;
    }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/*/admin",
        "/*/mina-sidor",
        "/*/larare-portal",
        "/*/checkout",
        "/*/logga-in",
        "/*/skapa-konto",
        "/*/verifiera-mobil",
        "/*/boka",
        "/*/teori/prov",
        "/api/",
      ],
    },
    ...(sitemapUrl ? { sitemap: sitemapUrl } : {}),
  };
}
