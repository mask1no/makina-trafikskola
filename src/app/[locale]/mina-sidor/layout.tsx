import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { theoryNavVisible } from "@/lib/launch";
import { LinkButton } from "@/components/LinkButton";
import { NavPills } from "@/components/NavPills";

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

  const [t, shellT] = await Promise.all([
    getTranslations("student.nav"),
    getTranslations("shell"),
  ]);
  const links = [
    ["", t("overview")],
    ["/bokningar", t("bookings")],
    ["/lektioner", t("saldo")],
    ...(theoryNavVisible() ? [["/teori", t("theory")] as const] : []),
    ["/meddelanden", t("messages")],
    ["/profil", t("profile")],
  ];
  const base = `/${params.locale}/mina-sidor`;

  return (
    <div>
      <div className="border-b border-surface-soft bg-surface text-ink-inverse">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <div>
            <p className="text-sm font-bold text-ink-inverse-muted">{t("label")}</p>
            <p className="mt-1 text-xl font-black">{session.user.name}</p>
          </div>
          <LinkButton href={`/${params.locale}/boka`} className="shrink-0">
            {shellT("book")}
          </LinkButton>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <NavPills
          label={t("label")}
          items={links.map(([path, label]) => ({
            href: `${base}${path}`,
            label,
          }))}
        />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
