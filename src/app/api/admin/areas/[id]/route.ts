import { apiError } from "@/lib/api/http";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const schema = z
  .object({
    status: z.enum(["ACTIVE", "COMING_SOON"]),
    officeAddress: z.string().trim().max(200).nullable(),
    boundary: z.unknown(),
  })
  .strict();

function isPolygon(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const record = value as { type?: string; geometry?: unknown; features?: unknown };
  if (record.type === "Feature") return isPolygon(record.geometry);
  if (record.type === "FeatureCollection" && Array.isArray(record.features)) {
    return record.features.length > 0 && record.features.every((feature) => isPolygon(feature));
  }
  return record.type === "Polygon" || record.type === "MultiPolygon";
}



export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_INPUT", 400);
  if (!isPolygon(parsed.data.boundary)) return apiError("INVALID_GEOJSON", 400);

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) return apiError(error.code, error.status);
    throw error;
  }
  const area = await db.location.findUnique({
    where: { id: (await context.params).id },
    select: { id: true, status: true, officeAddress: true },
  });
  if (!area) return apiError("AREA_NOT_FOUND", 404);
  await db.$transaction(async (tx) => {
    await tx.location.update({
      where: { id: area.id },
      data: {
        status: parsed.data.status,
        active: parsed.data.status === "ACTIVE",
        officeAddress: parsed.data.officeAddress,
        boundary: parsed.data.boundary as Prisma.InputJsonValue,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "area.update",
        entityType: "Location",
        entityId: area.id,
        before: { status: area.status, officeAddress: area.officeAddress },
        after: {
          status: parsed.data.status,
          officeAddress: parsed.data.officeAddress,
        },
      },
    });
  });
  return Response.json({ id: area.id });
}
