import { randomInt } from "node:crypto";

import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { auth } from "@/auth";
import { apiError, authorizationError, errorResponse } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { checkOtpRequestLimits, storeOtp } from "@/lib/auth/otp-store";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { sendOtpSms } from "@/lib/auth/sms";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";
import { db } from "@/lib/db";
import { locales } from "@/i18n/routing";
import { clientIp } from "@/lib/http/client-ip";

export const runtime = "nodejs";

const AUTHENTICATED_PURPOSES = [
  "phone-link",
  "change-phone",
  "delete-account",
  "change-email",
  "change-password",
] as const;

const PUBLIC_TURNSTILE_PURPOSES = [
  "login",
  "signup",
  "password-reset",
] as const;

const requestSchema = z
  .object({
    phone: z.string().trim().min(3).max(32),
    purpose: z
      .enum([
        "login",
        "signup",
        "password-reset",
        "phone-link",
        "change-phone",
        "delete-account",
        "change-email",
        "change-password",
      ])
      .optional(),
    turnstileToken: z.string().trim().max(2048).optional(),
  })
  .strict();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "INVALID_INPUT",
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  const phone = normalizeSwedishPhone(parsed.data.phone);
  if (!phone) {
    return apiError("INVALID_PHONE", 400, {
      phone: ["INVALID_PHONE"],
    });
  }

  const purpose = parsed.data.purpose ?? "login";
  const ip = clientIp(request);

  if ((AUTHENTICATED_PURPOSES as readonly string[]).includes(purpose)) {
    try {
      requireRole(await auth(), ["STUDENT", "TEACHER", "ADMIN"]);
    } catch (error) {
      return authorizationError(error);
    }
  }

  if ((PUBLIC_TURNSTILE_PURPOSES as readonly string[]).includes(purpose)) {
    const turnstile = await verifyTurnstileToken(
      parsed.data.turnstileToken,
      ip,
    );
    if (!turnstile.ok) {
      return errorResponse("TURNSTILE_FAILED", 400);
    }
  }

  const account = await db.user.findUnique({
    where: { phone, deletedAt: null },
    select: { id: true, localePref: true },
  });

  const now = new Date();

  // Login: never reveal whether the number exists. Still only send SMS when it does.
  // Rate-limit every request (including probes) so OTP cost protection still applies.
  if (purpose === "login" && !account) {
    const limits = await checkOtpRequestLimits(phone, now, { ip });
    if (!limits.allowed) {
      if (limits.reason === "global") {
        Sentry.captureMessage("OTP daily cap reached", {
          level: "warning",
          tags: { feature: "otp" },
        });
      }
      const limited = errorResponse("RATE_LIMITED", 429);
      limited.headers.set("retry-after", String(limits.retryAfterSeconds));
      return limited;
    }
    return Response.json({ phone, sent: false }, { status: 200 });
  }

  const code =
    process.env.NODE_ENV !== "production" && process.env.DEV_OTP_CODE
      ? process.env.DEV_OTP_CODE
      : String(randomInt(0, 1_000_000)).padStart(6, "0");
  const result = await storeOtp(phone, code, now, { ip });

  if (!result.allowed) {
    if (result.reason === "global") {
      Sentry.captureMessage("OTP daily cap reached", {
        level: "warning",
        tags: { feature: "otp" },
      });
    }
    const limited = errorResponse("RATE_LIMITED", 429);
    limited.headers.set("retry-after", String(result.retryAfterSeconds));
    return limited;
  }

  const locale =
    account?.localePref && (locales as readonly string[]).includes(account.localePref)
      ? account.localePref
      : "sv";

  let delivered = false;
  try {
    delivered = await sendOtpSms({ phone, code, locale });
  } catch (reason) {
    const codeName =
      reason instanceof Error ? reason.message : "SMS_DELIVERY_FAILED";
    if (
      codeName === "SMS_PROVIDER_NOT_CONFIGURED" ||
      codeName === "SMS_DELIVERY_FAILED"
    ) {
      return apiError(codeName, codeName === "SMS_PROVIDER_NOT_CONFIGURED" ? 503 : 502);
    }
    throw reason;
  }

  if (!delivered && process.env.NODE_ENV !== "production") {
    return Response.json({ phone, sent: true, devCode: code });
  }

  if (process.env.NODE_ENV !== "production" && process.env.DEV_OTP_CODE) {
    return Response.json({ phone, sent: true, devCode: code });
  }

  return Response.json({ phone, sent: true }, { status: 200 });
}
