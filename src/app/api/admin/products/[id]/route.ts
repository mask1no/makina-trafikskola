import { apiError, invalidInput } from "@/lib/api/http";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { locales } from "@/i18n/routing";

export const runtime = "nodejs";

const schema = z
  .object({
    priceKr: z.number().int().min(0).max(1_000_000),
    active: z.boolean(),
    bestSeller: z.boolean(),
    descriptions: z
      .array(
        z.object({
          locale: z.enum(locales),
          shortDesc: z.string().trim().max(280),
        }),
      )
      .max(locales.length),
  })
  .strict();



export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }
  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) return apiError(error.code, error.status);
    throw error;
  }
  const product = await db.product.findUnique({
    where: { id: (await context.params).id },
    select: {
      id: true,
      priceOre: true,
      active: true,
      bestSeller: true,
      translations: { select: { locale: true, shortDesc: true } },
    },
  });
  if (!product) return apiError("PRODUCT_NOT_FOUND", 404);
  const priceOre = parsed.data.priceKr * 100;
  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: product.id },
      data: {
        priceOre,
        active: parsed.data.active,
        bestSeller: parsed.data.bestSeller,
      },
    });
    for (const description of parsed.data.descriptions) {
      await tx.productTranslation.updateMany({
        where: { productId: product.id, locale: description.locale },
        data: { shortDesc: description.shortDesc },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId,
        action: "product.update",
        entityType: "Product",
        entityId: product.id,
        before: {
          priceOre: product.priceOre,
          active: product.active,
          bestSeller: product.bestSeller,
          descriptions: product.translations,
        },
        after: {
          priceOre,
          active: parsed.data.active,
          bestSeller: parsed.data.bestSeller,
          descriptions: parsed.data.descriptions,
        },
      },
    });
  });
  return Response.json({ id: product.id });
}
