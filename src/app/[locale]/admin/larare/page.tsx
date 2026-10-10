import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const [t, teachers] = await Promise.all([
    getTranslations("admin.directory"),
    db.teacherProfile.findMany({
      orderBy: [{ active: "desc" }, { user: { firstName: "asc" } }],
      select: {
        id: true,
        active: true,
        languages: true,
        user: { select: { firstName: true, lastName: true } },
        locations: {
          select: { location: { select: { name: true, slug: true } } },
        },
      },
    }),
  ]);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <Link
          href={`/${params.locale}/admin/instructors/new`}
          className="inline-flex min-h-11 items-center rounded-sm bg-accent px-4 text-sm font-bold text-accent-ink"
        >
          {t("add")}
        </Link>
      </div>
      {teachers.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => (
            <li key={teacher.id} className="flex h-full flex-col rounded-md border border-border bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-black">
                  {teacher.user.firstName} {teacher.user.lastName}
                </h2>
                <Badge tone={teacher.active ? "success" : "neutral"}>
                  {teacher.active ? t("active") : t("inactive")}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                {teacher.locations
                  .filter((item) => !/webhook|fixture/i.test(item.location.slug))
                  .map((item) => item.location.name)
                  .join(", ") || "–"}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{teacher.languages.join(", ") || "–"}</p>
              <Link
                href={`/${params.locale}/admin/instructors/${teacher.id}`}
                className="mt-4 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
              >
                {t("edit")}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-ink-muted">{t("empty")}</p>
      )}
    </section>
  );
}
