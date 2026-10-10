import { PrismaClient } from "@prisma/client";

const NEEDLES = ["it-", "webhook", "fixture", "@example"] as const;

type Hit = { model: string; id: string; field: string; value: string };

function matchingFields(
  model: string,
  id: string,
  fields: Record<string, string | null | undefined>,
): Hit[] {
  const hits: Hit[] = [];
  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;
    const lower = value.toLowerCase();
    if (NEEDLES.some((needle) => lower.includes(needle))) {
      hits.push({ model, id, field, value });
    }
  }
  return hits;
}

function print(hits: Hit[]) {
  if (!hits.length) {
    console.log("No matching rows.");
    return;
  }
  console.log("model\tid\tfield\tvalue");
  for (const hit of hits) {
    console.log(`${hit.model}\t${hit.id}\t${hit.field}\t${hit.value}`);
  }
  console.log(`\n${hits.length} matching field(s). Read-only; nothing was changed.`);
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required.");
  }
  const db = new PrismaClient();
  try {
    const [locations, users, orders, bookings] = await Promise.all([
      db.location.findMany({
        where: {
          OR: NEEDLES.flatMap((needle) => [
            { slug: { contains: needle, mode: "insensitive" } },
            { name: { contains: needle, mode: "insensitive" } },
          ]),
        },
        select: { id: true, slug: true, name: true },
      }),
      db.user.findMany({
        where: {
          OR: NEEDLES.flatMap((needle) => [
            { email: { contains: needle, mode: "insensitive" } },
            { firstName: { contains: needle, mode: "insensitive" } },
            { lastName: { contains: needle, mode: "insensitive" } },
          ]),
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      }),
      db.order.findMany({
        where: {
          student: {
            OR: NEEDLES.flatMap((needle) => [
              { email: { contains: needle, mode: "insensitive" } },
              { firstName: { contains: needle, mode: "insensitive" } },
              { lastName: { contains: needle, mode: "insensitive" } },
            ]),
          },
        },
        select: {
          id: true,
          student: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      db.booking.findMany({
        where: {
          student: {
            OR: NEEDLES.flatMap((needle) => [
              { email: { contains: needle, mode: "insensitive" } },
              { firstName: { contains: needle, mode: "insensitive" } },
              { lastName: { contains: needle, mode: "insensitive" } },
            ]),
          },
        },
        select: {
          id: true,
          student: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    print([
      ...locations.flatMap((row) =>
        matchingFields("Location", row.id, { slug: row.slug, name: row.name }),
      ),
      ...users.flatMap((row) =>
        matchingFields("User", row.id, {
          email: row.email,
          name: `${row.firstName} ${row.lastName}`,
        }),
      ),
      ...orders.flatMap((row) =>
        matchingFields("Order", row.id, {
          email: row.student.email,
          name: `${row.student.firstName} ${row.student.lastName}`,
        }),
      ),
      ...bookings.flatMap((row) =>
        matchingFields("Booking", row.id, {
          email: row.student.email,
          name: `${row.student.firstName} ${row.student.lastName}`,
        }),
      ),
    ]);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
