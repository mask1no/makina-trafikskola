import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { authorizationError, errorResponse, invalidInput } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { maskPhone } from "@/lib/auth/mask";
import {
  allowRateLimitedAction,
  consumeOtp,
} from "@/lib/auth/otp-store";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const RECENT_AUTH_MS = 10 * 60 * 1000;

const changePhoneSchema = z
  .object({
    phone: z.string().trim().min(3).max(32),
    newCode: z.string().regex(/^\d{6}$/),
    currentCode: z.string().regex(/^\d{6}$/).optional(),
    password: z.string().min(8).max(128).optional(),
    lostOldNumber: z.boolean().optional(),
  })
  .strict();

class ChangePhoneError extends Error {
  constructor(
    readonly code:
      | "INVALID_OTP"
      | "INVALID_CREDENTIALS"
      | "PHONE_IN_USE"
      | "ACCOUNT_NOT_FOUND"
      | "LOST_PHONE_NOT_ALLOWED",
    readonly status: number,
  ) {
    super(code);
  }
}

function recentlyAuthenticated(
  session: {
    user: {
      authenticatedAt?: string;
      googleLinked?: boolean;
    };
  },
  user: { lastAuthAt: Date | null; googleSub: string | null },
  now: Date,
) {
  if (user.googleSub || session.user.googleLinked) return true;
  const fromSession = session.user.authenticatedAt
    ? new Date(session.user.authenticatedAt).getTime()
    : 0;
  const fromDb = user.lastAuthAt?.getTime() ?? 0;
  const latest = Math.max(fromSession, fromDb);
  return latest > 0 && now.getTime() - latest <= RECENT_AUTH_MS;
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
          select: {
            id: true,
            phone: true,
            passwordHash: true,
            googleSub: true,
            lastAuthAt: true,
          },
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

        const newValid = await consumeOtp(phone, parsed.data.newCode, now, tx);
        if (!newValid) {
          throw new ChangePhoneError("INVALID_OTP", 401);
        }

        const lost = Boolean(parsed.data.lostOldNumber);
        if (lost) {
          let allowedLost = recentlyAuthenticated(session, user, now);
          if (!allowedLost && parsed.data.password) {
            if (
              user.passwordHash &&
              (await bcrypt.compare(parsed.data.password, user.passwordHash))
            ) {
              allowedLost = true;
            } else {
              throw new ChangePhoneError("INVALID_CREDENTIALS", 401);
            }
          }
          if (!allowedLost) {
            throw new ChangePhoneError("LOST_PHONE_NOT_ALLOWED", 403);
          }
        } else {
          if (!parsed.data.currentCode) {
            throw new ChangePhoneError("INVALID_OTP", 401);
          }
          const currentValid = await consumeOtp(
            user.phone,
            parsed.data.currentCode,
            now,
            tx,
          );
          if (!currentValid) {
            throw new ChangePhoneError("INVALID_OTP", 401);
          }
        }

        await tx.user.update({
          where: { id: user.id },
          data: {
            phone,
            phoneVerifiedAt: now,
            sessionVersion: { increment: 1 },
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: lost ? "user.phone_changed_lost" : "user.phone_changed",
            entityType: "User",
            entityId: user.id,
            before: { phone: maskPhone(user.phone) },
            after: { phone: maskPhone(phone), lostOldNumber: lost },
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
