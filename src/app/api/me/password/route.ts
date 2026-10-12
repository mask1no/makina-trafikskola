import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { authorizationError, errorResponse, invalidInput } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { allowRateLimitedAction, consumeOtp } from "@/lib/auth/otp-store";
import { bumpSessionVersion } from "@/lib/auth/session-version";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const schema = z
  .object({
    password: z.string().min(8).max(128),
    currentPassword: z.string().min(8).max(128).optional(),
    code: z.string().regex(/^\d{6}$/).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.currentPassword || value.code), {
    message: "INVALID_INPUT",
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  let session;
  try {
    session = requireRole(await auth(), ["STUDENT"]);
  } catch (error) {
    return authorizationError(error);
  }

  const now = new Date();
  const allowed = await allowRateLimitedAction(
    "change-password",
    session.user.id,
    5,
    15 * 60,
    now,
  );
  if (!allowed) {
    return errorResponse("RATE_LIMITED", 429);
  }

  const user = await db.user.findFirst({
    where: { id: session.user.id, role: "STUDENT", deletedAt: null },
    select: { id: true, phone: true, passwordHash: true },
  });
  if (!user) {
    return errorResponse("ACCOUNT_NOT_FOUND", 404);
  }

  // Setting a first password (SMS-only user): SMS code is enough.
  // Changing an existing password: current password OR SMS code.
  if (user.passwordHash) {
    if (parsed.data.currentPassword) {
      if (
        !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))
      ) {
        return errorResponse("INVALID_CREDENTIALS", 401);
      }
    } else if (parsed.data.code) {
      if (!user.phone || !(await consumeOtp(user.phone, parsed.data.code, now))) {
        return errorResponse("INVALID_OTP", 401);
      }
    } else {
      return errorResponse("INVALID_INPUT", 400);
    }
  } else if (parsed.data.code) {
    if (!user.phone || !(await consumeOtp(user.phone, parsed.data.code, now))) {
      return errorResponse("INVALID_OTP", 401);
    }
  } else if (parsed.data.currentPassword) {
    return errorResponse("INVALID_CREDENTIALS", 401);
  } else {
    return errorResponse("INVALID_INPUT", 400);
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
  });
  await bumpSessionVersion(user.id, now);
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "user.password_changed",
      entityType: "User",
      entityId: user.id,
      before: { hasPassword: Boolean(user.passwordHash) },
      after: { hasPassword: true },
    },
  });

  return new Response(null, { status: 204 });
}
