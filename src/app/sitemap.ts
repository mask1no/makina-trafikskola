import type { MetadataRoute } from "next";

import { locales } from "@/i18n/routing";
import { db } from "@/lib/db";

const staticPaths = [
  "",
  "/korlektioner",
  "/larare",
  "/kurser",
  "/teori",
  "/teori/prov",
  "/boka",
  "/kontakt",
  "/villkor",
  "/integritet",
  "/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return [];
  let base: string;
  try {
    base = new URL(configured).origin;
  } catch {
    return [];
  }

  let products: { slug: string }[] = [];
  let teachers: { slug: string }[] = [];
  let categories: { slug: string }[] = [];
  let locations: { slug: string }[] = [];
  try {
    [products, teachers, categories, locations] = await Promise.all([
      db.product.findMany({ where: { active: true }, select: { slug: true } }),
      db.teacherProfile.findMany({
        where: { active: true },
        select: { slug: true },
      }),
      db.theoryCategory.findMany({ select: { slug: true } }),
      db.location.findMany({
        where: { active: true },
        select: { slug: true },
      }),
    ]);
  } catch {
    // Static pages still ship when the database is unreachable at build time.
  }
  const paths = Array.from(
    new Set([
      ...staticPaths,
      ...products.map((product) => `/paket/${product.slug}`),
      ...teachers.map((teacher) => `/larare/${teacher.slug}`),
      ...categories.map((category) => `/teori/${category.slug}`),
      ...locations.map((location) => `/trafikskola/${location.slug}`),
    ]),
  );

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((alternate) => [
              alternate,
              `${base}/${alternate}${path}`,
            ]),
          ),
          "x-default": `${base}/sv${path}`,
        },
      },
    })),
  );
}
