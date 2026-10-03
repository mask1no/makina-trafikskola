import { Transmission } from "@prisma/client";
import { z } from "zod";

import { invalidInput } from "@/lib/api/http";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";
import { locales } from "@/i18n/routing";
import { orderedTeacherIds } from "@/lib/teachers/query";
import { TEACHING_LANGUAGES } from "@/lib/teachers/languages";

const querySchema = z
  .object({
    languages: z
      .string()
      .transform((value) => [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))])
      .pipe(
        z.array(z.enum(TEACHING_LANGUAGES)).max(TEACHING_LANGUAGES.length),
      )
      .optional(),
    locationId: z.string().cuid().optional(),
    transmission: z.nativeEnum(Transmission).optional(),
    locale: z.enum(locales).default("sv"),
  })
  .strict();

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const { languages, locationId, transmission, locale } = parsed.data;
  const ids = await orderedTeacherIds({
    languages,
    locationId,
    transmission,
  });
  if (!ids.length) return Response.json([]);

  const teachers = await db.teacherProfile.findMany({
    where: { id: { in: ids.map((item) => item.id) } },
    include: {
      user: { select: { firstName: true, lastName: true } },
      translations: true,
      locations: { include: { location: true } },
    },
  });
  const byId = new Map(teachers.map((teacher) => [teacher.id, teacher]));

  return Response.json(
    ids.flatMap(({ id }) => {
      const teacher = byId.get(id);
      if (!teacher) return [];
      const resolved = resolveContent(teacher.translations, locale);
      return [{
        id: teacher.id,
        slug: teacher.slug,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        photoUrl: teacher.photoUrl,
        languages: teacher.languages,
        transmissions: teacher.transmissions,
        yearsExperience: teacher.yearsExperience,
        ratingAvg: teacher.ratingAvg,
        ratingCount: teacher.ratingCount,
        locations: teacher.locations.map(({ location }) => ({
          id: location.id,
          slug: location.slug,
          name: location.name,
          city: location.city,
          lat: location.lat,
          lng: location.lng,
        })),
        bio: resolved.translation?.bio ?? null,
        contentLocale: resolved.translation?.locale ?? null,
        swedishOnly: resolved.swedishOnly,
      }];
    }),
  );
}
