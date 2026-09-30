import { addDays, subDays } from "date-fns";
import { z } from "zod";

import { allowRateLimitedAction } from "@/lib/auth/otp-store";
import { buildCalendar } from "@/lib/calendar/ics";
import { db } from "@/lib/db";
import ar from "../../../../../../messages/ar.json";
import en from "../../../../../../messages/en.json";
import so from "../../../../../../messages/so.json";
import sv from "../../../../../../messages/sv.json";
import ti from "../../../../../../messages/ti.json";

const lessonSummary = { sv, en, ti, ar, so };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  })
  .strict();

function notFound() {
  return Response.json(
    { error: { code: "NOT_FOUND", message: "NOT_FOUND" } },
    { status: 404 },
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const now = new Date();
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return notFound();

  const allowed = await allowRateLimitedAction(
    "teacher-feed",
    parsed.data.token,
    60,
    3600,
    now,
  );
  if (!allowed) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "RATE_LIMITED" } },
      { status: 429 },
    );
  }

  const teacher = await db.teacherProfile.findFirst({
    where: { calendarToken: parsed.data.token, active: true },
    select: {
      id: true,
      user: { select: { localePref: true } },
    },
  });
  if (!teacher) return notFound();

  const bookings = await db.booking.findMany({
    where: {
      teacherId: teacher.id,
      creditCharged: true,
      status: { in: ["CONFIRMED", "COMPLETED"] },
      startsAt: { gte: subDays(now, 7), lte: addDays(now, 60) },
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      pickupAddress: true,
      student: { select: { firstName: true } },
      location: { select: { name: true, address: true } },
    },
  });
  const locale = teacher.user.localePref in lessonSummary
    ? (teacher.user.localePref as keyof typeof lessonSummary)
    : "sv";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const portalUrl = new URL(
    `/${teacher.user.localePref}/larare-portal`,
    origin,
  ).toString();
  const body = buildCalendar({
    prodId: "-//Makina Trafikskola//Teacher//SV",
    name: "Makina – lektioner",
    timezone: "Europe/Stockholm",
    refreshInterval: "PT1H",
    now,
    events: bookings.map((booking) => ({
      uid: `${booking.id}@makina.se`,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      summary: lessonSummary[locale].teacherPortal.calendar.summary.replace(
        "{name}",
        booking.student.firstName,
      ),
      location:
        booking.pickupAddress ??
        booking.location?.address ??
        booking.location?.name ??
        undefined,
      description: portalUrl,
      status: "CONFIRMED",
    })),
  });

  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": "private, max-age=300",
      "x-robots-tag": "noindex",
    },
  });
}
