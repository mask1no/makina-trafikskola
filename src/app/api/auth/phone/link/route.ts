import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth, updateSession } from "@/auth";
import { consumeOtp } from "@/lib/auth/otp-store";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const linkSchema = z
  .object({
    phone: z.string().trim().min(3).max(32),
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();

class PhoneLinkError extends Error {
  constructor(
    readonly code:
      | "INVALID_OTP"
      | "FORBIDDEN"
      | "GOOGLE_ALREADY_LINKED",
    readonly status: number,
  ) {
    super(code);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = linkSchema.safeParse(body);
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

  const session = await auth();
  if (!session?.user.id) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "UNAUTHENTICATED" } },
      { status: 401 },
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

  try {
    const linkedUser = await db.$transaction(
      async (tx) => {
        const now = new Date();
        if (!(await consumeOtp(phone, parsed.data.code, now, tx))) {
          throw new PhoneLinkError("INVALID_OTP", 401);
        }

        const shell = await tx.user.findUnique({
          where: { id: session.user.id },
        });
        if (!shell?.googleSub || shell.deletedAt) {
          throw new PhoneLinkError("FORBIDDEN", 403);
        }

        const phoneUser = await tx.user.findUnique({
          where: { phone, deletedAt: null },
        });
        if (!phoneUser || phoneUser.id === shell.id) {
          return tx.user.update({
            where: { id: shell.id },
            data: { phone, phoneVerifiedAt: now },
            select: { id: true },
          });
        }

        if (
          phoneUser.googleSub &&
          phoneUser.googleSub !== shell.googleSub
        ) {
          throw new PhoneLinkError("GOOGLE_ALREADY_LINKED", 409);
        }

        await tx.user.update({
          where: { id: shell.id },
          data: {
            email: null,
            googleSub: null,
            deletedAt: now,
          },
        });

        return tx.user.update({
          where: { id: phoneUser.id },
          data: {
            googleSub: shell.googleSub,
            phoneVerifiedAt: phoneUser.phoneVerifiedAt ?? now,
            ...(phoneUser.email || !shell.email
              ? {}
              : {
                  email: shell.email,
                  emailVerifiedAt: shell.emailVerifiedAt,
                }),
          },
          select: { id: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await updateSession({ user: { id: linkedUser.id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof PhoneLinkError) {
      return Response.json(
        { error: { code: error.code, message: error.code } },
        { status: error.status },
      );
    }
    throw error;
  }
}
