import type { Prisma } from "@prisma/client";

import sv from "../../../messages/sv.json";

export async function bookingNotificationContext(
  tx: Prisma.TransactionClient,
  bookingId: string,
) {
  const booking = await tx.booking.findUniqueOrThrow({
    where: { id: bookingId },
    select: {
      pickupAddress: true,
      student: { select: { firstName: true } },
      teacher: {
        select: {
          userId: true,
          user: { select: { firstName: true, localePref: true } },
        },
      },
      location: { select: { address: true, name: true } },
    },
  });

  return {
    studentFirstName: booking.student.firstName,
    teacherFirstName: booking.teacher.user.firstName,
    teacherUserId: booking.teacher.userId,
    teacherLocale: booking.teacher.user.localePref,
    placeLabel:
      booking.pickupAddress ??
      booking.location?.address ??
      booking.location?.name,
    schoolPhone: sv.company.phone,
  };
}
