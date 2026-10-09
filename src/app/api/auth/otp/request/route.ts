import { randomInt } from "node:crypto";

import { z } from "zod";

import { apiError, errorResponse } from "@/lib/api/http";
import { storeOtp } from "@/lib/auth/otp-store";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { sendOtpSms } from "@/lib/auth/sms";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    phone: z.string().trim().min(3).max(32),
    purpose: z.enum(["login", "signup", "password-reset", "phone-link"]).optional(),
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

  if (parsed.data.purpose === "login") {
    const account = await db.user.findUnique({
      where: { phone, deletedAt: null },
      select: { id: true },
    });
    if (!account) {
      return apiError("NO_ACCOUNT", 404);
    }
  }

  const now = new Date();
  const code =
    process.env.NODE_ENV !== "production" && process.env.DEV_OTP_CODE
      ? process.env.DEV_OTP_CODE
      : String(randomInt(0, 1_000_000)).padStart(6, "0");
  const result = await storeOtp(phone, code, now);

  if (!result.allowed) {
    const limited = errorResponse("RATE_LIMITED", 429);
    limited.headers.set("retry-after", String(result.retryAfterSeconds));
    return limited;
  }

  let delivered = false;
  try {
    delivered = await sendOtpSms({ phone, code });
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

  // Local/dev without 46elks: expose the code so SMS auth remains testable.
  if (!delivered && process.env.NODE_ENV !== "production") {
    return Response.json({ phone, devCode: code });
  }

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_OTP_CODE
  ) {
    return Response.json({ phone, devCode: code });
  }

  return Response.json({ phone }, { status: 200 });
}
