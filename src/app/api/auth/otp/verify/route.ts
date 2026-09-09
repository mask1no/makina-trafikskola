import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "@/auth";
import { normalizePhoneToE164 } from "@/lib/auth/phone";

export const runtime = "nodejs";

const verifySchema = z
  .object({
    phone: z.string().trim().min(3).max(32),
    code: z.string().regex(/^\d{6}$/),
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
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

  const phone = normalizePhoneToE164(parsed.data.phone);
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

  try {
    await signIn("phone-otp", {
      phone,
      code: parsed.data.code,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      redirect: false,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    // Auth.js may still throw a redirect signal after a successful sign-in.
    if (isNextRedirect(error)) {
      return new Response(null, { status: 204 });
    }
    if (error instanceof AuthError) {
      return Response.json(
        {
          error: {
            code: "INVALID_OTP",
            message: "INVALID_OTP",
          },
        },
        { status: 401 },
      );
    }
    throw error;
  }
}
