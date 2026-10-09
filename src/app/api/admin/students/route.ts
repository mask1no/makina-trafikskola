import { invalidInput, apiError } from "@/lib/api/http";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const querySchema = z
  .object({ q: z.string().trim().max(100).default("") })
  .strict();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  try {
    requireRole(await auth(), ["ADMIN"]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return apiError(error.code, error.status);
    }
    throw error;
  }

  const q = parsed.data.q;
  const students = await db.user.findMany({
    where: {
      role: "STUDENT",
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 50,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      localePref: true,
    },
  });

  return Response.json(students);
}
