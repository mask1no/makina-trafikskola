import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { CompliancePage } from "@/components/CompliancePage";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("legal.terms"),
    getLocale(),
  ]);
  const title = t("title");
  const description = t("metadata");
  const canonical = pageCanonical(locale, "/villkor");
  return {
    title,
    description,
    alternates: { canonical },
    ...withSocial({ title, description, canonical, locale }),
  };
}

export default function TermsPage() {
  return <CompliancePage namespace="terms" />;
}
