import { db } from "@/lib/db";
import type { Locale } from "@/i18n/routing";
import type { Transmission } from "@prisma/client";
import { orderedTeacherIds } from "@/lib/teachers/query";

type Localized = { locale: string };

function resolveTranslation<T extends Localized>(
  translations: T[],
  locale: Locale,
  fingerprint: (translation: T) => string,
) {
  const requested = translations.find((item) => item.locale === locale);
  const swedish = translations.find((item) => item.locale === "sv");
  const requestedIsPlaceholder =
    locale !== "sv" &&
    requested &&
    swedish &&
    fingerprint(requested) === fingerprint(swedish);
  const translation =
    (!requestedIsPlaceholder ? requested : undefined) ??
    swedish ??
    translations[0] ??
    null;

  return {
    translation,
    swedishOnly: locale !== "sv" && translation?.locale === "sv",
  };
}

export async function getProducts(locale: Locale) {
  const products = await db.product.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });

  return products.flatMap((product) => {
    const resolved = resolveTranslation(
      product.translations,
      locale,
      (item) =>
        JSON.stringify([item.name, item.shortDesc, item.features]),
    );
    if (!resolved.translation) return [];
    return [{ ...product, ...resolved }];
  });
}

export async function getProduct(locale: Locale, slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: { translations: true },
  });
  if (!product) return null;
  const resolved = resolveTranslation(
    product.translations,
    locale,
    (item) => JSON.stringify([item.name, item.shortDesc, item.features]),
  );
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
          ...resolveTranslation(teacher.translations, locale, (item) => item.bio),
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
    ...resolveTranslation(teacher.translations, locale, (item) => item.bio),
  };
}
