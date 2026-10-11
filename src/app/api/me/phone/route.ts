import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { authorizationError, errorResponse, invalidInput } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import {
  allowRateLimitedAction,
  consumeOtp,
} from "@/lib/auth/otp-store";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const changePhoneSchema = z
  .object({
    phone: z.string().trim().min(3).max(32),
    currentCode: z.string().regex(/^\d{6}$/),
    newCode: z.string().regex(/^\d{6}$/),
  })
  .strict();

class ChangePhoneError extends Error {
  constructor(
    readonly code: "INVALID_OTP" | "PHONE_IN_USE" | "ACCOUNT_NOT_FOUND",
    readonly status: number,
  ) {
    super(code);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = changePhoneSchema.safeParse(body);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  let session;
  try {
    session = requireRole(await auth(), ["STUDENT"]);
  } catch (error) {
    return authorizationError(error);
  }

  const phone = normalizeSwedishPhone(parsed.data.phone);
  if (!phone) {
    return errorResponse("INVALID_PHONE", 400);
  }

  const now = new Date();
  const allowed = await allowRateLimitedAction(
    "change-phone",
    session.user.id,
    5,
    15 * 60,
    now,
  );
  if (!allowed) {
    return errorResponse("RATE_LIMITED", 429);
  }

  try {
    await db.$transaction(
      async (tx) => {
        const user = await tx.user.findFirst({
          where: {
            id: session.user.id,
            role: "STUDENT",
            deletedAt: null,
          },
          select: { id: true, phone: true },
        });
        if (!user?.phone) {
          throw new ChangePhoneError("ACCOUNT_NOT_FOUND", 404);
        }
        if (user.phone === phone) {
          throw new ChangePhoneError("PHONE_IN_USE", 409);
        }

        const conflict = await tx.user.findFirst({
          where: { phone, deletedAt: null, id: { not: user.id } },
          select: { id: true },
        });
        if (conflict) {
          throw new ChangePhoneError("PHONE_IN_USE", 409);
        }

        const currentValid = await consumeOtp(
          user.phone,
          parsed.data.currentCode,
          now,
          tx,
        );
        const newValid = await consumeOtp(
          phone,
          parsed.data.newCode,
          now,
          tx,
        );
        if (!currentValid || !newValid) {
          throw new ChangePhoneError("INVALID_OTP", 401);
        }

        await tx.user.update({
          where: { id: user.id },
          data: { phone, phoneVerifiedAt: now },
        });
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: "user.phone_changed",
            entityType: "User",
            entityId: user.id,
            before: { phoneChanged: false },
            after: { phoneChanged: true },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof ChangePhoneError) {
      return errorResponse(error.code, error.status);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse("PHONE_IN_USE", 409);
    }
    throw error;
  }
}
