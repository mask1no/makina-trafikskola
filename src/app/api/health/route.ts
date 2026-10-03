import { z } from "zod";

import { bearerToken, matchesSecret } from "@/lib/auth/bearer-secret";
import { db } from "@/lib/db";
import {
  backupAgeHours,
  backupConfiguration,
  MAX_BACKUP_AGE_HOURS,
  migrationStatus,
  newestBackupObject,
} from "@/lib/ops/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ deep: z.literal("1").optional() }).strict();

const noStore = { "cache-control": "no-store" };

function apiError(code: string, status: number) {
  return Response.json(
    { error: { code, message: code } },
    { status, headers: noStore },
  );
}

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return apiError("INVALID_INPUT", 400);
  }

  if (parsed.data.deep) {
    const token = bearerToken(request);
    if (!token) return apiError("UNAUTHENTICATED", 401);
    const secret = process.env.CRON_SECRET;
    if (!secret) return apiError("HEALTH_NOT_CONFIGURED", 503);
    if (!matchesSecret(token, secret)) return apiError("FORBIDDEN", 403);
  }

  try {
    await db.$queryRaw`SELECT 1`;
    if (!parsed.data.deep) {
      return Response.json({ status: "ok" }, { headers: noStore });
    }

    const now = new Date();
    const [migrationsResult, backupResult] = await Promise.allSettled([
      migrationStatus(),
      (async () => {
        const backup = backupConfiguration();
        const newest = await newestBackupObject(backup.client, backup.bucket);
        const ageHours = backupAgeHours(newest.lastModified, now);
        return {
          ok: ageHours < MAX_BACKUP_AGE_HOURS,
          ageHours: Math.round(ageHours * 10) / 10,
          maxAgeHours: MAX_BACKUP_AGE_HOURS,
        };
      })(),
    ]);
    const migrations =
      migrationsResult.status === "fulfilled"
        ? {
            ok: migrationsResult.value.upToDate,
            applied: migrationsResult.value.applied,
            pending: migrationsResult.value.pending,
            failed: migrationsResult.value.failed,
          }
        : { ok: false, error: "MIGRATION_STATUS_UNAVAILABLE" };
    const backup =
      backupResult.status === "fulfilled"
        ? backupResult.value
        : { ok: false, error: "BACKUP_STATUS_UNAVAILABLE" };
    const ok = migrations.ok && backup.ok;
    return Response.json(
      {
        status: ok ? "ok" : "degraded",
        checks: { database: { ok: true }, migrations, backup },
        ...(ok
          ? {}
          : {
              error: {
                code: "DEEP_HEALTH_CHECK_FAILED",
                message: "DEEP_HEALTH_CHECK_FAILED",
              },
            }),
      },
      { status: ok ? 200 : 503, headers: noStore },
    );
  } catch {
    return apiError("SERVICE_UNAVAILABLE", 503);
  }
}
