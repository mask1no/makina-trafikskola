import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { authorizationError, errorResponse, invalidInput } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { maskEmail } from "@/lib/auth/mask";
import { consumeOtp, allowRateLimitedAction } from "@/lib/auth/otp-store";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const schema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    code: z.string().regex(/^\d{6}$/).optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .strict()
  .refine((value) => Boolean(value.code || value.password), {
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
    "change-email",
    session.user.id,
    5,
    15 * 60,
    now,
  );
  if (!allowed) {
    return errorResponse("RATE_LIMITED", 429);
  }

  const email = parsed.data.email;
  try {
    await db.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id: session.user.id, role: "STUDENT", deletedAt: null },
        select: {
          id: true,
          email: true,
          phone: true,
          passwordHash: true,
        },
      });
      if (!user) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }
      if (user.email === email) {
        throw new Error("EMAIL_UNCHANGED");
      }

      const conflict = await tx.user.findFirst({
        where: { email, deletedAt: null, id: { not: user.id } },
        select: { id: true },
      });
      if (conflict) {
        throw new Error("EMAIL_TAKEN");
      }

      let verified = false;
      if (parsed.data.password) {
        if (
          user.passwordHash &&
          (await bcrypt.compare(parsed.data.password, user.passwordHash))
        ) {
          verified = true;
        } else {
          throw new Error("INVALID_CREDENTIALS");
        }
      } else if (parsed.data.code) {
        if (!user.phone || !(await consumeOtp(user.phone, parsed.data.code, now, tx))) {
          throw new Error("INVALID_OTP");
        }
        verified = true;
      }
      if (!verified) throw new Error("INVALID_INPUT");

      await tx.user.update({
        where: { id: user.id },
        data: { email, emailVerifiedAt: now },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "user.email_changed",
          entityType: "User",
          entityId: user.id,
          before: { email: maskEmail(user.email) },
          after: { email: maskEmail(email) },
        },
      });
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "EMAIL_TAKEN") return errorResponse("EMAIL_TAKEN", 409);
    if (code === "INVALID_OTP") return errorResponse("INVALID_OTP", 401);
    if (code === "INVALID_CREDENTIALS") {
      return errorResponse("INVALID_CREDENTIALS", 401);
    }
    if (code === "ACCOUNT_NOT_FOUND") {
      return errorResponse("ACCOUNT_NOT_FOUND", 404);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse("EMAIL_TAKEN", 409);
    }
    if (code === "EMAIL_UNCHANGED" || code === "INVALID_INPUT") {
      return errorResponse("INVALID_INPUT", 400);
    }
    throw error;
  }
}
