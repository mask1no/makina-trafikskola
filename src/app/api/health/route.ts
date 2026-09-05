import { z } from "zod";

import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({}).strict();

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "INVALID_INPUT" } },
      { status: 400 },
    );
  }

  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok" },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "SERVICE_UNAVAILABLE",
        },
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
