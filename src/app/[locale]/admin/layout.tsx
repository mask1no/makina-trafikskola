import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { NavPills } from "@/components/NavPills";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/${params.locale}/logga-in?callbackUrl=${encodeURIComponent(`/${params.locale}/admin`)}`,
    );
  }
  if (session.user.role !== "ADMIN") redirect(`/${params.locale}`);

  const t = await getTranslations("admin.nav");
  const base = `/${params.locale}/admin`;
  const links = [
    { href: base, label: t("overview") },
    { href: `${base}/platser`, label: t("places") },
    { href: `${base}/students`, label: t("students") },
    {
      href: `${base}/larare`,
      label: t("teachers"),
      matches: [`${base}/larare`, `${base}/instructors`],
    },
    { href: `${base}/calendar`, label: t("calendar") },
    { href: `${base}/kurser`, label: t("courses") },
    { href: `${base}/recensioner`, label: t("reviews") },
    { href: `${base}/produkter`, label: t("products") },
    { href: `${base}/omraden`, label: t("areas") },
  ];

  return (
    <div className="bg-page">
      <div className="site-container pt-6">
        <div className="rounded-xl border border-ink bg-surface px-5 py-5 text-ink-inverse sm:px-7">
          <p className="text-sm font-bold text-ink-inverse-muted">{t("label")}</p>
          <p className="mt-1 text-xl font-black">{session.user.name}</p>
        </div>
      </div>
      <div className="site-container py-6 sm:py-8">
        <div className="hidden lg:block">
          <NavPills label={t("label")} items={links} centered />
        </div>
        <div className="lg:mt-8">{children}</div>
      </div>
    </div>
  );
}
