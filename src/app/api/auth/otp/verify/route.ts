import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn } from "@/auth";

export const runtime = "nodejs";

const verifySchema = z
  .object({
    phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
    code: z.string().regex(/^\d{6}$/),
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

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

  try {
    await signIn("phone-otp", {
      ...parsed.data,
      redirect: false,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
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
