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
    return Response.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "INVALID_INPUT",
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const phone = normalizeSwedishPhone(parsed.data.phone);
  if (!phone) {
    return Response.json(
      {
        error: {
          code: "INVALID_PHONE",
          message: "INVALID_PHONE",
          fields: { phone: ["INVALID_PHONE"] },
        },
      },
      { status: 400 },
    );
  }

  const now = new Date();
  if (!(await consumeOtp(phone, parsed.data.code, now))) {
    return Response.json(
      { error: { code: "INVALID_OTP", message: "INVALID_OTP" } },
      { status: 401 },
    );
  }

  const user = await db.user.findUnique({
    where: { phone, deletedAt: null },
    select: { id: true },
  });
  if (!user) {
    return Response.json(
      { error: { code: "NO_ACCOUNT", message: "NO_ACCOUNT" } },
      { status: 404 },
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
  });

  return new Response(null, { status: 204 });
}
