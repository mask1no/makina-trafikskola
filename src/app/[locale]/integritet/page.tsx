import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CompliancePage } from "@/components/CompliancePage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return { title: t("title"), description: t("metadata") };
}

export default function PrivacyPage() {
  return <CompliancePage namespace="privacy" />;
}
