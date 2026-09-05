import { CourseKind } from "@prisma/client";
import { z } from "zod";

import { invalidInput } from "@/lib/api/http";
import { db } from "@/lib/db";

const querySchema = z
  .object({
    kind: z.nativeEnum(CourseKind).optional(),
    language: z.string().trim().min(2).max(10).optional(),
  })
  .strict();

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const holdMinutes = Math.max(
    1,
    Number.parseInt(process.env.BOOKING_HOLD_MINUTES ?? "15", 10) || 15,
  );
  const holdCutoff = new Date(Date.now() - holdMinutes * 60_000);
  const occasions = await db.courseOccasion.findMany({
    where: {
      cancelled: false,
      startsAt: { gt: new Date() },
      ...(parsed.data.language ? { language: parsed.data.language } : {}),
      ...(parsed.data.kind ? { course: { kind: parsed.data.kind } } : {}),
    },
    orderBy: { startsAt: "asc" },
    include: {
      course: {
        select: {
          kind: true,
          product: { select: { id: true, slug: true, active: true } },
        },
      },
      teacher: {
        select: {
          slug: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      _count: {
        select: {
          bookings: {
            where: {
              OR: [
                { status: { in: ["CONFIRMED", "COMPLETED"] } },
                {
                  status: "PENDING_PAYMENT",
                  createdAt: { gt: holdCutoff },
                },
              ],
            },
          },
        },
      },
    },
  });

  return Response.json(
    occasions.map(({ _count, teacher, ...occasion }) => ({
      ...occasion,
      teacher: teacher
        ? {
            slug: teacher.slug,
            name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          }
        : null,
      seatsLeft: Math.max(0, occasion.capacity - _count.bookings),
    })),
  );
}
