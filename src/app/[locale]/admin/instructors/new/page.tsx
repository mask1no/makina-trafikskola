import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db";

import { InstructorForm } from "./InstructorForm";
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
        user: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  return (
    <div className="grid max-w-4xl gap-10">
      <section>
        <p className="text-sm font-bold text-ink-muted">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black">{statusT("title")}</h1>
        <p className="mt-2 text-ink-muted">{statusT("description")}</p>
        <ul className="mt-5 grid gap-3">
          {instructors.map((instructor) => (
            <InstructorStatusControl
              key={instructor.id}
              instructor={{
                id: instructor.id,
                active: instructor.active,
                name: `${instructor.user.firstName} ${instructor.user.lastName}`,
              }}
            />
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-black">{t("title")}</h2>
        <p className="mt-2 text-ink-muted">{t("description")}</p>
        <InstructorForm locations={locations} />
      </section>
    </div>
  );
}
