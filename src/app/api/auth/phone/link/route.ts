import { invalidInput, apiError, errorResponse } from "@/lib/api/http";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth, updateSession } from "@/auth";
import { allowLoginAttempt, consumeOtp } from "@/lib/auth/otp-store";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const linkSchema = z
  .object({
    phone: z.string().trim().min(3).max(32),
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();

class PhoneLinkError extends Error {
  constructor(
    readonly code:
      | "INVALID_OTP"
      | "FORBIDDEN"
      | "GOOGLE_ALREADY_LINKED",
    readonly status: number,
  ) {
    super(code);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  const session = await auth();
  if (!session?.user.id) {
    return errorResponse("UNAUTHENTICATED", 401);
  }

  const phone = normalizeSwedishPhone(parsed.data.phone);
  if (!phone) {
    return apiError("INVALID_PHONE", 400, { phone: ["INVALID_PHONE"] });
  }

  const now = new Date();
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded
      ?.split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1) ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!(await allowLoginAttempt(`phone-link:${phone}`, ip, now))) {
    return errorResponse("RATE_LIMITED", 429);
  }

  if (!(await consumeOtp(phone, parsed.data.code, now))) {
    return errorResponse("INVALID_OTP", 401);
  }

  try {
    const linkedUser = await db.$transaction(
      async (tx) => {
        const shell = await tx.user.findUnique({
          where: { id: session.user.id },
        });
        if (!shell?.googleSub || shell.deletedAt) {
          throw new PhoneLinkError("FORBIDDEN", 403);
        }

        const phoneUser = await tx.user.findUnique({
          where: { phone, deletedAt: null },
        });
        if (!phoneUser || phoneUser.id === shell.id) {
          return tx.user.update({
            where: { id: shell.id },
            data: { phone, phoneVerifiedAt: now },
            select: { id: true },
          });
        }

        if (
          phoneUser.googleSub &&
          phoneUser.googleSub !== shell.googleSub
        ) {
          throw new PhoneLinkError("GOOGLE_ALREADY_LINKED", 409);
        }

        await tx.user.update({
          where: { id: shell.id },
          data: {
            email: null,
            googleSub: null,
            deletedAt: now,
          },
        });

        return tx.user.update({
          where: { id: phoneUser.id },
          data: {
            googleSub: shell.googleSub,
            phoneVerifiedAt: phoneUser.phoneVerifiedAt ?? now,
            ...(phoneUser.email || !shell.email
              ? {}
              : {
                  email: shell.email,
                  emailVerifiedAt: shell.emailVerifiedAt,
                }),
          },
          select: { id: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await updateSession({ user: { id: linkedUser.id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof PhoneLinkError) {
      return apiError(error.code, error.status);
    }
    throw error;
  }
}
