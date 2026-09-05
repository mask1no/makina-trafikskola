import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const querySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .strict()
  .refine(
    ({ from, to }) =>
      from < to && to.getTime() - from.getTime() <= 8 * 24 * 60 * 60 * 1000,
    { path: ["to"], message: "INVALID_DATE_RANGE" },
  );

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "INVALID_INPUT",
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  try {
    requireRole(await auth(), ["ADMIN"]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json(
        { error: { code: error.code, message: error.code } },
        { status: error.status },
      );
    }
    throw error;
  }

  const teachers = await db.teacherProfile.findMany({
    where: { active: true },
    orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
      bookings: {
        where: {
          startsAt: { lt: parsed.data.to },
          endsAt: { gt: parsed.data.from },
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          status: true,
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
          location: { select: { name: true } },
        },
      },
    },
  });

  return Response.json(
    teachers.map((teacher) => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      bookings: teacher.bookings.map((booking) => ({
        id: booking.id,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        status: booking.status,
        student: booking.student,
        place: booking.location?.name ?? null,
      })),
    })),
  );
}
