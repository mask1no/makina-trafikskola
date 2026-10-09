import { JWT } from "google-auth-library";
import * as Sentry from "@sentry/nextjs";

import { db } from "@/lib/db";

type BusyInterval = { start: string; end: string };

const busyCache = new Map<string, { at: number; intervals: BusyInterval[] }>();
const CACHE_MS = 60_000;

export function calendarSyncEnabled(
  environment: Record<string, string | undefined> = process.env,
) {
  return (
    environment.GOOGLE_CALENDAR_SYNC_ENABLED === "1" &&
    Boolean(environment.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim())
  );
}

function credentials() {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function accessToken() {
  const account = credentials();
  if (!account?.client_email || !account.private_key) return null;
  const client = new JWT({
    email: account.client_email,
    key: account.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  const token = await client.getAccessToken();
  return token.token ?? null;
}

export async function teacherBusyIntervals(
  calendarEmail: string,
  from: Date,
  to: Date,
) {
  if (!calendarSyncEnabled()) return [];
  const cacheKey = `${calendarEmail}:${from.toISOString()}:${to.toISOString()}`;
  const cached = busyCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.intervals;
  const token = await accessToken();
  if (!token) return [];
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      items: [{ id: calendarEmail }],
    }),
  });
  if (!response.ok) {
    throw new Error(`CALENDAR_FREEBUSY_${response.status}`);
  }
  const body = (await response.json()) as {
    calendars?: Record<string, { busy?: BusyInterval[]; errors?: { reason?: string }[] }>;
  };
  const calendar = body.calendars?.[calendarEmail];
  if (calendar?.errors?.length) {
    throw new Error(calendar.errors[0]?.reason ?? "CALENDAR_FREEBUSY");
  }
  const intervals = calendar?.busy ?? [];
  busyCache.set(cacheKey, { at: Date.now(), intervals });
  return intervals;
}

export function slotOverlapsBusy(
  slot: { startsAt: Date; endsAt: Date },
  intervals: BusyInterval[],
) {
  return intervals.some((interval) => {
    const start = new Date(interval.start).getTime();
    const end = new Date(interval.end).getTime();
    return slot.startsAt.getTime() < end && slot.endsAt.getTime() > start;
  });
}

async function calendarRequest(
  path: string,
  method: string,
  body?: unknown,
) {
  const token = await accessToken();
  if (!token) return null;
  const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response;
}

export async function syncConfirmedBooking(bookingId: string) {
  if (!calendarSyncEnabled()) return;
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      creditCharged: true,
      startsAt: true,
      endsAt: true,
      pickupAddress: true,
      googleEventId: true,
      student: { select: { firstName: true } },
      teacher: { select: { googleCalendarEmail: true, slug: true } },
    },
  });
  if (!booking?.teacher.googleCalendarEmail) return;
  const email = encodeURIComponent(booking.teacher.googleCalendarEmail);
  const cancelled = booking.status.startsWith("CANCELLED") || booking.status === "EXPIRED_HOLD";
  try {
    if (cancelled || !booking.creditCharged) {
      if (!booking.googleEventId) return;
      await calendarRequest(
        `/calendars/${email}/events/${encodeURIComponent(booking.googleEventId)}`,
        "DELETE",
      );
      await db.booking.update({
        where: { id: booking.id },
        data: { googleEventId: null, googleSyncedAt: new Date() },
      });
      return;
    }
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL ?? "";
    const payload = {
      summary: `Körlektion – ${booking.student.firstName}`,
      location: booking.pickupAddress ?? undefined,
      description: origin
        ? `${origin.replace(/\/$/, "")}/sv/larare-portal`
        : undefined,
      start: { dateTime: booking.startsAt.toISOString() },
      end: { dateTime: booking.endsAt.toISOString() },
    };
    const response = booking.googleEventId
      ? await calendarRequest(
          `/calendars/${email}/events/${encodeURIComponent(booking.googleEventId)}`,
          "PATCH",
          payload,
        )
      : await calendarRequest(`/calendars/${email}/events`, "POST", payload);
    if (!response?.ok) throw new Error(`CALENDAR_EVENT_${response?.status ?? "NO_TOKEN"}`);
    const created = (await response.json()) as { id?: string };
    await db.booking.update({
      where: { id: booking.id },
      data: {
        googleEventId: created.id ?? booking.googleEventId,
        googleSyncedAt: new Date(),
      },
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}

export async function repairCalendarSync(now: Date) {
  if (!calendarSyncEnabled()) return 0;
  const bookings = await db.booking.findMany({
    where: {
      teacher: { googleCalendarEmail: { not: null } },
      OR: [
        { creditCharged: true, googleSyncedAt: null, status: "CONFIRMED" },
        {
          googleEventId: { not: null },
          status: { in: ["CANCELLED_BY_STUDENT", "CANCELLED_BY_TEACHER", "EXPIRED_HOLD"] },
        },
      ],
      startsAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
    take: 50,
  });
  for (const booking of bookings) {
    await syncConfirmedBooking(booking.id);
  }
  return bookings.length;
}

export async function probeTeacherCalendar(calendarEmail: string) {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  await teacherBusyIntervals(calendarEmail, now, later);
  return "OK";
}
