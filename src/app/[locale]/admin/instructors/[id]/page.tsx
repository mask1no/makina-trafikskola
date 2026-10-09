import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";

import { TeacherEditor } from "./TeacherEditor";

export const dynamic = "force-dynamic";

export default async function EditTeacherPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const params = await props.params;
  const [t, teacher, locations] = await Promise.all([
    getTranslations("admin.editor"),
    db.teacherProfile.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        locations: { select: { locationId: true } },
        availability: true,
        exceptions: { where: { type: "FULL_DAY_OFF" }, select: { date: true } },
      },
    }),
    db.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!teacher) notFound();

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title={`${teacher.user.firstName} ${teacher.user.lastName}`} description={t("editTeacher")} />
      <TeacherEditor
        locale={params.locale}
        teacherId={teacher.id}
        locations={locations}
        initial={{
          phone: teacher.user.phone ?? "",
          languages: teacher.languages.filter((language) =>
            language === "sv" || language === "en" || language === "ti" || language === "ku",
          ),
          transmissions: teacher.transmissions,
          locationIds: teacher.locations.map((item) => item.locationId),
          yearsExperience: teacher.yearsExperience,
          googleCalendarEmail: teacher.googleCalendarEmail ?? "",
          payRateKr: teacher.payRateOre == null ? "" : String(Math.round(teacher.payRateOre / 100)),
          hours: teacher.availability.map((hour) => ({
            dayOfWeek: hour.dayOfWeek,
            startTime: hour.startTime,
            endTime: hour.endTime,
            locationId: hour.locationId ?? locations[0]?.id ?? "",
          })),
          daysOff: teacher.exceptions.map((item) => item.date.toISOString().slice(0, 10)),
        }}
      />
    </div>
  );
}
