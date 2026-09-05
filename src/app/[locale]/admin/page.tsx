import { getTranslations } from "next-intl/server";

import { Card } from "@/components/Card";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

export default async function AdminPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const [navT, calendarT, studentsT, instructorsT] = await Promise.all([
    getTranslations("admin.nav"),
    getTranslations("admin.calendar"),
    getTranslations("admin.students"),
    getTranslations("admin.instructors"),
  ]);
  const sections = [
    {
      title: navT("calendar"),
      description: calendarT("description"),
      href: `/${params.locale}/admin/calendar`,
    },
    {
      title: navT("students"),
      description: studentsT("description"),
      href: `/${params.locale}/admin/students`,
    },
    {
      title: navT("instructors"),
      description: instructorsT("description"),
      href: `/${params.locale}/admin/instructors/new`,
    },
  ];

  return (
    <section>
      <PageHeader
        eyebrow={calendarT("eyebrow")}
        title={navT("label")}
        description={calendarT("description")}
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.href} className="flex flex-col">
            <h2 className="text-xl font-black">{section.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-ink-muted">
              {section.description}
            </p>
            <LinkButton className="mt-6" href={section.href} variant="tertiary">
              {section.title}
            </LinkButton>
          </Card>
        ))}
      </div>
    </section>
  );
}
