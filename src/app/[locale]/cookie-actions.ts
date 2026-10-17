"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { locales } from "@/i18n/routing";

const consentSchema = z
  .object({
    locale: z.enum(locales),
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

export async function clearCookieConsent(formData: FormData) {
  const locale = z.enum(locales).safeParse(
    formData.get("locale"),
  );
  if (!locale.success) return;

  (await cookies()).delete("makina-cookie-consent");
  revalidatePath(`/${locale.data}`, "layout");
}
