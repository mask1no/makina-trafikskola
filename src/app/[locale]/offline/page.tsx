import Image from "next/image";
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
    <section className="site-container grid min-h-[70vh] max-w-5xl items-center gap-10 py-16 md:grid-cols-2">
      <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink-muted">{t("eyebrow")}</p>
      <h1 className="section-title mt-3">{t("title")}</h1>
      <p className="mt-4 max-w-lg leading-7 text-ink-muted">{t("description")}</p>
      <Link
        href={`/${params.locale}`}
        className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 font-bold text-accent-ink"
      >
        {t("retry")}
      </Link>
      </div>
      <Image src="/illustration-hero.svg" alt="" width={560} height={420} className="rtl-no-mirror h-auto w-full opacity-80" />
    </section>
  );
}
