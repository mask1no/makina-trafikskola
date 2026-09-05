import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db";

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
      <h1 className="text-3xl font-black">{t("title")}</h1>
      <p className="mt-2 text-ink-muted">{t("description")}</p>
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
