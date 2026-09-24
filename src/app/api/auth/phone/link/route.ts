import { AuthError } from "next-auth";
import { z } from "zod";

import { auth, signIn } from "@/auth";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const linkSchema = z
  .object({
    phone: z.string().trim().min(3).max(32),
    code: z.string().regex(/^\d{6}$/),
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

  const shell = await db.user.findUnique({
    where: { id: session.user.id },
  });
  if (!shell?.googleSub || shell.deletedAt) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "FORBIDDEN" } },
      { status: 403 },
    );
  }

  const existing = await db.user.findUnique({
    where: { phone, deletedAt: null },
  });
  if (existing?.googleSub && existing.googleSub !== shell.googleSub) {
    return Response.json(
      {
        error: {
          code: "GOOGLE_ALREADY_LINKED",
          message: "GOOGLE_ALREADY_LINKED",
        },
      },
      { status: 409 },
    );
  }

  const googleSub = shell.googleSub;
  try {
    await signIn("phone-otp", {
      phone,
      code: parsed.data.code,
      firstName: shell.firstName,
      lastName: shell.lastName || undefined,
      redirect: false,
    });
  } catch (error) {
    if (!isNextRedirect(error)) {
      if (error instanceof AuthError) {
        return Response.json(
          { error: { code: "INVALID_OTP", message: "INVALID_OTP" } },
          { status: 401 },
        );
      }
      throw error;
    }
  }

  const phoneUser = await db.user.findUnique({
    where: { phone, deletedAt: null },
  });
  if (!phoneUser) {
    return Response.json(
      { error: { code: "INVALID_OTP", message: "INVALID_OTP" } },
      { status: 401 },
    );
  }

  if (phoneUser.id !== shell.id) {
    await db.user.update({
      where: { id: shell.id },
      data: { googleSub: null },
    });
  }
  await db.user.update({
    where: { id: phoneUser.id },
    data: { googleSub, phoneVerifiedAt: phoneUser.phoneVerifiedAt ?? new Date() },
  });
  if (phoneUser.id !== shell.id) {
    await db.user.update({
      where: { id: shell.id },
      data: { deletedAt: new Date() },
    });
  }

  return new Response(null, { status: 204 });
}
