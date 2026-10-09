import { invalidInput, apiError, errorResponse } from "@/lib/api/http";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { consumeOtp } from "@/lib/auth/otp-store";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const resetSchema = z
  .object({
    phone: z.string().trim().min(3).max(32),
    code: z.string().regex(/^\d{6}$/),
    password: z.string().min(8).max(128),
  })
  .strict();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  const phone = normalizeSwedishPhone(parsed.data.phone);
  if (!phone) {
    return apiError("INVALID_PHONE", 400, { phone: ["INVALID_PHONE"] });
  }

  const now = new Date();
  if (!(await consumeOtp(phone, parsed.data.code, now))) {
    return errorResponse("INVALID_OTP", 401);
  }

  const user = await db.user.findUnique({
    where: { phone, deletedAt: null },
    select: { id: true },
  });
  if (!user) {
    return errorResponse("NO_ACCOUNT", 404);
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
  });

  return new Response(null, { status: 204 });
}
