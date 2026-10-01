import { z } from "zod";

import { apiError, invalidInput } from "@/lib/api/http";
import { publicAddress } from "@/lib/locations/address";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";
import { locales } from "@/i18n/routing";

const inputSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  locale: z.enum(locales).default("sv"),
});

export async function GET(request: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const parsed = inputSchema.safeParse({
    slug: params.slug,
    locale: new URL(request.url).searchParams.get("locale") ?? "sv",
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const teacher = await db.teacherProfile.findFirst({
    where: { slug: parsed.data.slug, active: true },
    include: {
      user: { select: { firstName: true, lastName: true } },
      translations: true,
      locations: { include: { location: true } },
    },
  });
  if (!teacher) return apiError("TEACHER_NOT_FOUND", 404);
  const resolved = resolveContent(teacher.translations, parsed.data.locale);

  return Response.json({
    id: teacher.id,
    slug: teacher.slug,
    name: `${teacher.user.firstName} ${teacher.user.lastName}`,
    photoUrl: teacher.photoUrl,
    languages: teacher.languages,
    transmissions: teacher.transmissions,
    yearsExperience: teacher.yearsExperience,
    ratingAvg: teacher.ratingAvg,
    ratingCount: teacher.ratingCount,
    travelBufferMin: teacher.travelBufferMin,
    maxPickupRadiusKm: teacher.maxPickupRadiusKm,
    locations: teacher.locations.map(({ location }) => ({
      id: location.id,
      slug: location.slug,
      name: location.name,
      address: publicAddress(location.address),
      city: location.city,
      postalCode: location.postalCode,
      lat: location.lat,
      lng: location.lng,
    })),
    bio: resolved.translation?.bio ?? null,
    contentLocale: resolved.translation?.locale ?? null,
    swedishOnly: resolved.swedishOnly,
  });
}
