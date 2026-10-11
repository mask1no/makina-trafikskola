import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";

import { CoursesEditor } from "./CoursesEditor";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const [t, courses, occasions] = await Promise.all([
    getTranslations("admin.courses"),
    db.course.findMany({
      where: { kind: { in: ["RISK1", "RISK2"] }, product: { kind: "COURSE_SEAT" } },
      include: { product: { include: { translations: true } } },
      orderBy: { kind: "asc" },
    }),
    db.courseOccasion.findMany({
      where: { course: { kind: { in: ["RISK1", "RISK2"] } } },
      include: {
        course: { include: { product: { include: { translations: true } } } },
        _count: { select: { bookings: true } },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <CoursesEditor
        courses={courses.map((course) => ({
          id: course.id,
          label: `${course.kind} · ${
            course.product.translations.find((item) => item.locale === "sv")?.name ??
            course.product.slug
          }`,
        }))}
        initialOccasions={occasions.map((occasion) => ({
          id: occasion.id,
          courseId: occasion.courseId,
          startsAt: occasion.startsAt.toISOString(),
          endsAt: occasion.endsAt.toISOString(),
          venueName: occasion.venueName,
          venueAddress: occasion.venueAddress,
          capacity: occasion.capacity,
          language: occasion.language,
          cancelled: occasion.cancelled,
          booked: occasion._count.bookings,
        }))}
      />
    </div>
  );
}
