import { z } from "zod";

import { invalidInput } from "@/lib/api/http";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";
import { locales } from "@/i18n/routing";

const querySchema = z.object({ locale: z.enum(locales).default("sv") }).strict();

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const products = await db.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    include: { translations: true },
  });

  return Response.json(
    products.flatMap((product) => {
      const resolved = resolveContent(product.translations, parsed.data.locale);
      if (!resolved.translation) return [];
      return [{
        id: product.id,
        slug: product.slug,
        kind: product.kind,
        active: product.active,
        priceOre: product.priceOre,
        compareAtOre: product.compareAtOre,
        vatRatePct: product.vatRatePct,
        currency: product.currency,
        lessonCredits: product.lessonCredits,
        lessonMinutes: product.lessonMinutes,
        includesTheory: product.includesTheory,
        includesRisk1: product.includesRisk1,
        includesRisk2: product.includesRisk2,
        creditValidDays: product.creditValidDays,
        badge: product.badge,
        accentHex: product.accentHex,
        name: resolved.translation.name,
        shortDesc: resolved.translation.shortDesc,
        features: resolved.translation.features,
        contentLocale: resolved.translation.locale,
        swedishOnly: resolved.swedishOnly,
      }];
    }),
  );
}
