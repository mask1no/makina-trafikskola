import { db } from "@/lib/db";

import { isSchoolLocation } from "./places";

export async function schoolLocations() {
  const rows = await db.location.findMany({
    where: { active: true, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      address: true,
      postalCode: true,
    },
  });
  return rows.filter((row) => isSchoolLocation(row.slug));
}

export async function locationSummaries() {
  const locations = await schoolLocations();
  const ids = locations.map((location) => location.id);
  if (!ids.length) return [];

  const [bookings, teachers] = await Promise.all([
    db.booking.groupBy({
      by: ["locationId"],
      where: {
        locationId: { in: ids },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      _count: { _all: true },
    }),
    db.teacherLocation.findMany({
      where: { locationId: { in: ids }, teacher: { active: true } },
      select: { locationId: true },
    }),
  ]);

  const bookingCount = new Map(
    bookings.flatMap((row) => (row.locationId ? [[row.locationId, row._count._all] as const] : [])),
  );
  const teacherCount = new Map<string, number>();
  for (const link of teachers) {
    teacherCount.set(link.locationId, (teacherCount.get(link.locationId) ?? 0) + 1);
  }

  return locations.map((location) => ({
    ...location,
    bookings: bookingCount.get(location.id) ?? 0,
    teachers: teacherCount.get(location.id) ?? 0,
  }));
}
