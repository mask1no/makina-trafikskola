import { subHours } from "date-fns";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { auth } from "@/auth";
import {
  AuthorizationError,
  requireRole,
} from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({ id: z.string().cuid() }).strict();

function apiError(code: string, status: number) {
  return Response.json({ error: { code, message: code } }, { status });
}

function utcCalendarDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeCalendarText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const now = new Date();
  const parsed = paramsSchema.safeParse((await context.params));
  if (!parsed.success) return apiError("INVALID_INPUT", 400);

  let studentId: string;
  try {
    studentId = requireRole(await auth(), ["STUDENT"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return apiError(error.code, error.status);
    }
    throw error;
  }

  const booking = await db.booking.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      studentId: true,
      startsAt: true,
      endsAt: true,
      status: true,
      pickupAddress: true,
      location: { select: { name: true, address: true } },
      student: { select: { localePref: true } },
    },
  });
  if (!booking) return apiError("BOOKING_NOT_FOUND", 404);
  if (booking.studentId !== studentId) return apiError("FORBIDDEN", 403);

  const t = await getTranslations({
    locale: booking.student.localePref,
    namespace: "booking.calendar",
  });
  const cancellationHours = Number(
    process.env.CANCELLATION_WINDOW_HOURS ?? "24",
  );
  const cancellationDeadline = subHours(
    booking.startsAt,
    Number.isFinite(cancellationHours) && cancellationHours >= 0
      ? cancellationHours
      : 24,
  );
  const deadlineLabel = new Intl.DateTimeFormat(booking.student.localePref, {
    timeZone: "Europe/Stockholm",
    dateStyle: "full",
    timeStyle: "short",
  }).format(cancellationDeadline);
  const location =
    booking.pickupAddress ??
    [booking.location?.name, booking.location?.address]
      .filter(Boolean)
      .join(", ");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Makina Trafikskola//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@makina-trafikskola`,
    `DTSTAMP:${utcCalendarDate(now)}`,
    `DTSTART:${utcCalendarDate(booking.startsAt)}`,
    `DTEND:${utcCalendarDate(booking.endsAt)}`,
    `SUMMARY:${escapeCalendarText(t("summary"))}`,
    `DESCRIPTION:${escapeCalendarText(
      t("description", { deadline: deadlineLabel }),
    )}`,
    ...(location
      ? [`LOCATION:${escapeCalendarText(location)}`]
      : []),
    `STATUS:${
      booking.status === "CANCELLED_BY_STUDENT" ||
      booking.status === "CANCELLED_BY_TEACHER" ||
      booking.status === "EXPIRED_HOLD"
        ? "CANCELLED"
        : "CONFIRMED"
    }`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="makina-booking-${booking.id}.ics"`,
      "cache-control": "private, no-store",
    },
  });
}
