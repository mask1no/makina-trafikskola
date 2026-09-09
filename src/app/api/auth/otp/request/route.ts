import { randomInt } from "node:crypto";

import { z } from "zod";

import { normalizePhoneToE164 } from "@/lib/auth/phone";
import { sendOtpSms } from "@/lib/auth/sms";
import { storeOtp } from "@/lib/auth/otp-store";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    phone: z.string().trim().min(3).max(32),
  })
  .strict();

function errorResponse(
  code: string,
  status: number,
  fields?: Record<string, string[]>,
) {
  return Response.json(
    { error: { code, message: code, ...(fields ? { fields } : {}) } },
    { status },
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_INPUT",
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  const phone = normalizePhoneToE164(parsed.data.phone);
  if (!phone) {
    return errorResponse("INVALID_PHONE", 400, {
      phone: ["INVALID_PHONE"],
    });
  }

  const now = new Date();
  const code =
    process.env.NODE_ENV !== "production" && process.env.DEV_OTP_CODE
      ? process.env.DEV_OTP_CODE
      : String(randomInt(0, 1_000_000)).padStart(6, "0");
  const result = await storeOtp(phone, code, now);

  if (!result.allowed) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "RATE_LIMITED" } },
      {
        status: 429,
        headers: { "retry-after": String(result.retryAfterSeconds) },
      },
    );
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
      return errorResponse(codeName, codeName === "SMS_PROVIDER_NOT_CONFIGURED" ? 503 : 502);
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
