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
  const links = [
    ["", t("label")],
    ["/calendar", t("calendar")],
    ["/students", t("students")],
    ["/instructors/new", t("instructors")],
    ["/recensioner", t("reviews")],
  ];

  return (
    <div>
      <div className="border-b border-surface-soft bg-surface text-ink-inverse">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <p className="text-sm font-bold text-ink-inverse-muted">{t("label")}</p>
          <p className="mt-1 text-xl font-black">{session.user.name}</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <NavPills
          label={t("label")}
          items={links.map(([path, label]) => ({
            href: `/${params.locale}/admin${path}`,
            label,
          }))}
        />
        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}
