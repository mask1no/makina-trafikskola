"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const consentSchema = z
  .object({
    locale: z.enum(["sv", "en", "ti", "ar", "so"]),
    consent: z.enum(["necessary", "accepted"]),
  })
  .strict();

export async function saveCookieConsent(formData: FormData) {
  const parsed = consentSchema.safeParse({
    locale: formData.get("locale"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) return;

  (await cookies()).set("makina-cookie-consent", parsed.data.consent, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  revalidatePath(`/${parsed.data.locale}`, "layout");
}
