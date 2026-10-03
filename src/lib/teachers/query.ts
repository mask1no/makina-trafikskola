import { Prisma, type Transmission } from "@prisma/client";

import { db } from "@/lib/db";
import {
  isTeachingLanguage,
  TEACHING_LANGUAGES,
  type TeachingLanguage,
} from "@/lib/teachers/languages";

export async function activeTeacherLanguages(): Promise<TeachingLanguage[]> {
  const rows = await db.$queryRaw<Array<{ language: string }>>(Prisma.sql`
    SELECT DISTINCT unnest(t."languages") AS "language"
    FROM "TeacherProfile" t
    WHERE t."active" = true
  `);
  const active = new Set(
    rows.map(({ language }) => language).filter(isTeachingLanguage),
  );
  return TEACHING_LANGUAGES.filter((language) => active.has(language));
}

export async function orderedTeacherIds({
  languages,
  locationId,
  transmission,
}: {
  languages?: string[];
  locationId?: string;
  transmission?: Transmission;
} = {}) {
  const languageArray = languages?.length ? [...new Set(languages)] : null;
  return db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT t."id"
    FROM "TeacherProfile" t
    WHERE t."active" = true
      AND (${languageArray}::text[] IS NULL OR t."languages" && ${languageArray}::text[])
      AND (${locationId ?? null}::text IS NULL OR EXISTS (
        SELECT 1 FROM "TeacherLocation" tl
        WHERE tl."teacherId" = t."id" AND tl."locationId" = ${locationId ?? null}
      ))
      AND (${transmission ?? null}::"Transmission" IS NULL
        OR ${transmission ?? null}::"Transmission" = ANY(t."transmissions"))
    ORDER BY
      CASE WHEN ${languageArray}::text[] IS NULL THEN 0
        ELSE (
          SELECT count(*) FROM unnest(t."languages") language
          WHERE language = ANY(${languageArray}::text[])
        ) END DESC,
      t."ratingAvg" DESC,
      t."ratingCount" DESC,
      t."slug" ASC
  `);
}
