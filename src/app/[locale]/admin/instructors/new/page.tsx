import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";

import { InstructorForm } from "./InstructorForm";
import { InstructorPhoneControl } from "./InstructorPhoneControl";
import { InstructorStatusControl } from "./InstructorStatusControl";

export const dynamic = "force-dynamic";

export default async function NewInstructorPage() {
  const [t, statusT, locations, instructors] = await Promise.all([
    getTranslations("admin.instructors"),
    getTranslations("admin.instructorStatus"),
    db.location.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.teacherProfile.findMany({
      orderBy: [{ active: "desc" }, { user: { firstName: "asc" } }],
      select: {
        id: true,
        active: true,
        user: { select: { firstName: true, lastName: true, phone: true } },
      },
    }),
  ]);

  return (
    <div className="grid max-w-5xl gap-10">
      <section>
        <PageHeader eyebrow={t("eyebrow")} title={statusT("title")} description={statusT("description")} />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {instructors.map((instructor) => (
            <li key={instructor.id} className="grid gap-2">
              <InstructorStatusControl
                instructor={{
                  id: instructor.id,
                  active: instructor.active,
                  name: `${instructor.user.firstName} ${instructor.user.lastName}`,
                }}
              />
              <InstructorPhoneControl
                instructor={{
                  id: instructor.id,
                  phone: instructor.user.phone,
                }}
              />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <PageHeader title={t("title")} description={t("description")} />
        <InstructorForm locations={locations} />
      </section>
    </div>
  );
}
