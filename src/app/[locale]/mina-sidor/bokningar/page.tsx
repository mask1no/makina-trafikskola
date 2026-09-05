import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";

import { requireStudent } from "../_lib";
import { BookingList } from "./BookingList";

export const dynamic = "force-dynamic";

export default async function BookingsPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const studentId = await requireStudent(params.locale);
  const [t, bookings] = await Promise.all([
    getTranslations("student.bookings"),
    db.booking.findMany({
      where: { studentId },
      orderBy: { startsAt: "desc" },
      include: {
        teacher: { include: { user: true } },
        location: true,
      },
    }),
  ]);
  const configured = Number(process.env.CANCELLATION_WINDOW_HOURS ?? "24");

  return (
    <section>
      <PageHeader title={t("title")} description={t("description")} />
      <BookingList
        locale={params.locale}
        cancellationWindowHours={
          Number.isFinite(configured) && configured >= 0 ? configured : 24
        }
        bookings={bookings.map((booking) => ({
          id: booking.id,
          startsAt: booking.startsAt.toISOString(),
          status: booking.status,
          teacherName: `${booking.teacher.user.firstName} ${booking.teacher.user.lastName}`,
          place:
            booking.location?.name ??
            booking.pickupAddress ??
            t("pickup"),
        }))}
      />
    </section>
  );
}
