import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

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
    ["/calendar", t("calendar")],
    ["/students", t("students")],
    ["/instructors/new", t("instructors")],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav
        aria-label={t("label")}
        className="mb-8 flex gap-2 overflow-x-auto pb-2"
      >
        {links.map(([path, label]) => (
          <Link
            key={path}
            href={`/${params.locale}/admin${path}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border bg-card px-4 text-sm font-bold hover:border-accent"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
