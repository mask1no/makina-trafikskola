import * as Sentry from "@sentry/nextjs";

import { bearerToken, matchesSecret } from "@/lib/auth/bearer-secret";
import { runCoreCron } from "@/lib/cron/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apiError(code: string, status: number) {
  return Response.json({ error: { code, message: code } }, { status });
}

async function runMonitoredCoreCron(now: Date) {
  const startedAt = performance.now();
  try {
    const result = await Sentry.withMonitor(
      "makina-core-cron",
      () => runCoreCron(now),
      {
        schedule: { type: "crontab", value: "*/15 * * * *" },
        checkinMargin: 5,
        maxRuntime: 5,
        timezone: "Europe/Stockholm",
      },
    );
    console.info(JSON.stringify({
      event: "core_cron_completed",
      durationMs: Math.round(performance.now() - startedAt),
      success: true,
      ...result,
    }));
    return result;
  } catch (error) {
    console.info(JSON.stringify({
      event: "core_cron_completed",
      durationMs: Math.round(performance.now() - startedAt),
      success: false,
    }));
    throw error;
  }
}

async function handle(request: Request) {
  const now = new Date();
  const token = bearerToken(request);
  if (!token) return apiError("UNAUTHENTICATED", 401);

  const allowedSecrets = [
    process.env.CRON_SECRET,
    ...(process.env.NODE_ENV !== "production"
      ? [process.env.DEV_CRON_SECRET]
      : []),
  ].filter((secret): secret is string => Boolean(secret));
  if (allowedSecrets.length === 0) {
    return apiError("CRON_NOT_CONFIGURED", 503);
  }
  if (!allowedSecrets.some((secret) => matchesSecret(token, secret))) {
    return apiError("FORBIDDEN", 403);
  }

  return Response.json(await runMonitoredCoreCron(now));
}

export const GET = handle;
export const POST = handle;
