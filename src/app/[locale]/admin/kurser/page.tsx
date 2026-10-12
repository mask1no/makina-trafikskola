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
        risk1Defaults={(() => {
          const risk1 = courses.find((course) => course.kind === "RISK1");
          if (!risk1) return null;
          return {
            id: risk1.id,
            recurrenceEnabled: risk1.recurrenceEnabled,
            recurrenceDays: risk1.recurrenceDays.length
              ? risk1.recurrenceDays
              : [15, 28],
            defaultStartTime: risk1.defaultStartTime ?? "18:00",
            durationMinutes: risk1.durationMinutes ?? 210,
            defaultCapacity: risk1.defaultCapacity ?? 16,
            defaultVenueName:
              risk1.defaultVenueName ?? "Makina Trafikskola, Upplands Väsby",
            defaultVenueAddress:
              risk1.defaultVenueAddress ??
              "Centralvägen 5, 194 77 Upplands Väsby",
          };
        })()}
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
