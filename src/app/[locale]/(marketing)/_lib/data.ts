import { cache } from "react";

import { db } from "@/lib/db";
import type { Locale } from "@/i18n/routing";
import type { Transmission } from "@prisma/client";
import { resolveContent } from "@/lib/content/fallback";
import { orderedTeacherIds } from "@/lib/teachers/query";

export const getProducts = cache(async function getProducts(locale: Locale) {
  const products = await db.product.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });

  return products.flatMap((product) => {
    const resolved = resolveContent(product.translations, locale);
    if (!resolved.translation) return [];
    return [{ ...product, ...resolved }];
  });
});

export async function getProduct(locale: Locale, slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: { translations: true },
  });
  if (!product) return null;
  const resolved = resolveContent(product.translations, locale);
  if (!resolved.translation) return null;
  return { ...product, ...resolved };
}

export async function getLocations() {
  return db.location.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function getTeachers(
  locale: Locale,
  language?: string,
  locationId?: string,
  transmission?: Transmission,
) {
  const orderedIds = await orderedTeacherIds({
    languages: language ? [language] : undefined,
    locationId,
    transmission,
  });
  if (!orderedIds.length) return [];
  const teachers = await db.teacherProfile.findMany({
    where: { id: { in: orderedIds.map(({ id }) => id) } },
    include: {
      user: { select: { firstName: true, lastName: true } },
      translations: true,
      locations: { include: { location: true } },
    },
  });
  const byId = new Map(teachers.map((teacher) => [teacher.id, teacher]));

  return orderedIds.flatMap(({ id }) => {
    const teacher = byId.get(id);
    return teacher
      ? [{
          ...teacher,
          ...resolveContent(teacher.translations, locale),
        }]
      : [];
  });
}

export async function getTeacher(locale: Locale, slug: string) {
  const teacher = await db.teacherProfile.findFirst({
    where: { slug, active: true },
    include: {
      user: { select: { firstName: true, lastName: true } },
      translations: true,
      locations: { include: { location: true } },
    },
  });
  if (!teacher) return null;
  return {
    ...teacher,
    ...resolveContent(teacher.translations, locale),
  };
}
