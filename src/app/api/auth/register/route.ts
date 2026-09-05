import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { allowRateLimitedAction } from "@/lib/auth/otp-store";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const registrationSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(128),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    locale: z.enum(["sv", "en", "ti", "ar", "so"]).default("sv"),
  })
  .strict();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "INVALID_INPUT",
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const now = new Date();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const allowed = await allowRateLimitedAction(
    "registration",
    `${ip}:${parsed.data.email}`,
    5,
    60 * 60,
    now,
  );
  if (!allowed) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "RATE_LIMITED" } },
      { status: 429 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const user = await db.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        localePref: parsed.data.locale,
        studentProfile: { create: {} },
      },
      select: { id: true },
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        {
          error: {
            code: "ACCOUNT_EXISTS",
            message: "ACCOUNT_EXISTS",
          },
        },
        { status: 409 },
      );
    }
    throw error;
  }
}
