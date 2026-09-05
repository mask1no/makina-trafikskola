import { randomInt } from "node:crypto";

import { z } from "zod";

import { sendOtpSms } from "@/lib/auth/sms";
import { storeOtp } from "@/lib/auth/otp-store";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
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

  const now = new Date();
  const code =
    process.env.NODE_ENV !== "production" && process.env.DEV_OTP_CODE
      ? process.env.DEV_OTP_CODE
      : String(randomInt(0, 1_000_000)).padStart(6, "0");
  const result = await storeOtp(parsed.data.phone, code, now);

  if (!result.allowed) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "RATE_LIMITED" } },
      {
        status: 429,
        headers: { "retry-after": String(result.retryAfterSeconds) },
      },
    );
  }

  await sendOtpSms({ phone: parsed.data.phone, code });
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_OTP_CODE
  ) {
    return Response.json({ devCode: code });
  }
  return new Response(null, { status: 204 });
}
