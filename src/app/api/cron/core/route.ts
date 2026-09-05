import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { runCoreCron } from "@/lib/cron/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headerSchema = z
  .string()
  .regex(/^Bearer \S+$/)
  .transform((value) => value.slice("Bearer ".length));

function apiError(code: string, status: number) {
  return Response.json({ error: { code, message: code } }, { status });
}

function matchesSecret(provided: string, expected: string) {
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

async function handle(request: Request) {
  const now = new Date();
  const parsed = headerSchema.safeParse(request.headers.get("authorization"));
  if (!parsed.success) return apiError("UNAUTHENTICATED", 401);

  const allowedSecrets = [
    process.env.CRON_SECRET,
    ...(process.env.NODE_ENV !== "production"
      ? [process.env.DEV_CRON_SECRET]
      : []),
  ].filter((secret): secret is string => Boolean(secret));
  if (allowedSecrets.length === 0) {
    return apiError("CRON_NOT_CONFIGURED", 503);
  }
  if (!allowedSecrets.some((secret) => matchesSecret(parsed.data, secret))) {
    return apiError("FORBIDDEN", 403);
  }

  return Response.json(await runCoreCron(now));
}

export const GET = handle;
export const POST = handle;
