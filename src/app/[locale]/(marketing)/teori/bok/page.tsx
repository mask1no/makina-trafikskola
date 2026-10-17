import { redirect } from "next/navigation";

import { isLocale } from "@/i18n/routing";

export default async function TheoryBookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(isLocale(locale) ? `/${locale}/teori/e-bok` : "/sv/teori/e-bok");
}
