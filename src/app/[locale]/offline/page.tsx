import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function OfflinePage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations("offline");
  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-black">{t("title")}</h1>
      <p className="mt-4 leading-7 text-ink-muted">{t("description")}</p>
      <Link
        href={`/${params.locale}`}
        className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 font-bold text-accent-ink"
      >
        {t("retry")}
      </Link>
    </section>
  );
}
