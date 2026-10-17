import { getTranslations, setRequestLocale } from "next-intl/server";

import { TheoryHubBar } from "@/components/TheoryHubBar";
import { isLocale } from "@/i18n/routing";
import { theoryMode } from "@/lib/launch";

export default async function TeoriLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || theoryMode() === "off") return children;
  setRequestLocale(locale);
  const t = await getTranslations("theory");

  return (
    <>
      <div className="site-container max-w-6xl pt-10">
        <TheoryHubBar
          locale={locale}
          label={t("hub.label")}
          titles={{
            steps: t("hub.steps.title"),
            questions: t("hub.questions.title"),
            signs: t("hub.signs.title"),
            facts: t("hub.facts.title"),
            ebook: t("hub.ebook.title"),
          }}
        />
      </div>
      <div className="-mt-6">{children}</div>
    </>
  );
}
