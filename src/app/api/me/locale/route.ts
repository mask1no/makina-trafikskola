import { z } from "zod";

import { auth } from "@/auth";
import { authorizationError, errorResponse, invalidInput } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { locales } from "@/i18n/routing";

export const runtime = "nodejs";

const localeSchema = z.object({ locale: z.enum(locales) }).strict();

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = localeSchema.safeParse(body);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  let session;
  try {
    session = requireRole(await auth(), ["STUDENT", "TEACHER", "ADMIN"]);
  } catch (error) {
    return authorizationError(error);
  }

  const user = await db.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!user) {
    return errorResponse("ACCOUNT_NOT_FOUND", 404);
  }

  await db.user.update({
    where: { id: user.id },
    data: { localePref: parsed.data.locale },
  });
  return new Response(null, { status: 204 });
}
