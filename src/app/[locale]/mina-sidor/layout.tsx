import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function StudentLayout(
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
      `/${params.locale}/logga-in?callbackUrl=${encodeURIComponent(`/${params.locale}/mina-sidor`)}`,
    );
  }
  if (session.user.role !== "STUDENT") redirect(`/${params.locale}`);

  const t = await getTranslations("student.nav");
  const links = [
    ["", t("overview")],
    ["/bokningar", t("bookings")],
    ["/saldo", t("saldo")],
    ["/teori", t("theory")],
    ["/meddelanden", t("messages")],
    ["/profil", t("profile")],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label={t("label")} className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {links.map(([path, label]) => (
          <Link
            key={path}
            href={`/${params.locale}/mina-sidor${path}`}
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
