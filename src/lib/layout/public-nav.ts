import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { activeTeacherLanguages } from "@/lib/teachers/query";
import type { TeachingLanguage } from "@/lib/teachers/languages";

export type FooterPlace = {
  slug: string;
  city: string;
  status: "ACTIVE" | "COMING_SOON";
};

async function queryFooterPlaces(): Promise<FooterPlace[]> {
  return db.location.findMany({
    where: { status: { in: ["ACTIVE", "COMING_SOON"] } },
    orderBy: { name: "asc" },
    select: { slug: true, city: true, status: true },
  });
}

export const getCachedFooterPlaces = unstable_cache(
  queryFooterPlaces,
  ["footer-places"],
  { revalidate: 300, tags: ["locations"] },
);

export const getCachedTeacherLanguages = unstable_cache(
  activeTeacherLanguages,
  ["active-teacher-languages"],
  { revalidate: 300, tags: ["teacher-languages"] },
);

export async function loadPublicNavData(): Promise<{
  places: FooterPlace[];
  languages: TeachingLanguage[];
}> {
  try {
    const [places, languages] = await Promise.all([
      getCachedFooterPlaces(),
      getCachedTeacherLanguages(),
    ]);
    return { places, languages };
  } catch {
    return { places: [], languages: [] };
  }
}
