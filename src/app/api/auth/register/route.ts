import { invalidInput, apiError, errorResponse } from "@/lib/api/http";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { allowRateLimitedAction, consumeOtp } from "@/lib/auth/otp-store";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const registrationSchema = z
  .object({
    fullName: z.string().trim().min(1).max(160),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(3).max(32),
    password: z.string().min(8).max(128),
    code: z.string().regex(/^\d{6}$/),
    locale: z.enum(["sv", "en", "ti", "ar", "so"]).default("sv"),
  })
  .strict();

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  const phone = normalizeSwedishPhone(parsed.data.phone);
  if (!phone) {
    return apiError("INVALID_PHONE", 400, { phone: ["INVALID_PHONE"] });
  }

  const { firstName, lastName } = splitFullName(parsed.data.fullName);
  if (!firstName) {
    return apiError("INVALID_INPUT", 400, { fullName: ["INVALID_INPUT"] });
  }

  const now = new Date();
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const ip =
    forwarded?.at(-1) ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const [phoneAllowed, emailAllowed] = await Promise.all([
    allowRateLimitedAction(
      "registration-phone",
      `${ip}:${phone}`,
      5,
      60 * 60,
      now,
    ),
    allowRateLimitedAction(
      "registration-email",
      `${ip}:${parsed.data.email}`,
      5,
      60 * 60,
      now,
    ),
  ]);
  if (!phoneAllowed || !emailAllowed) {
    return errorResponse("RATE_LIMITED", 429);
  }

  const existing = await db.user.findFirst({
    where: {
      deletedAt: null,
      OR: [{ email: parsed.data.email }, { phone }],
    },
    select: { id: true },
  });
  if (existing) {
    return errorResponse("ACCOUNT_EXISTS", 409);
  }

  if (!(await consumeOtp(phone, parsed.data.code, now))) {
    return errorResponse("INVALID_OTP", 401);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const user = await db.user.create({
      data: {
        email: parsed.data.email,
        phone,
        phoneVerifiedAt: now,
        passwordHash,
        firstName,
        lastName,
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
      return errorResponse("ACCOUNT_EXISTS", 409);
    }
    throw error;
  }
}
