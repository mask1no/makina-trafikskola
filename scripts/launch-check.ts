import { execFile } from "node:child_process";
import { promisify } from "node:util";

import Stripe from "stripe";

import { db } from "../src/lib/db";
import { REQUIRED_PRODUCTION_ENVIRONMENT_VARIABLES } from "../src/lib/env";
import {
  backupAgeHours,
  backupConfiguration,
  canonicalUrlStatus,
  ELKS_LOW_BALANCE_SEK,
  MAX_BACKUP_AGE_HOURS,
  newestBackupObject,
} from "../src/lib/ops/readiness";
import { HANDLED_EVENT_TYPES } from "../src/lib/payments/stripe-events";

type Status = "PASS" | "WARN" | "FAIL";
type Result = { check: string; status: Status; detail: string };

const execFileAsync = promisify(execFile);
const results: Result[] = [];

function record(check: string, status: Status, detail: string) {
  results.push({ check, status, detail });
}

function configured(name: string) {
  return Boolean(process.env[name]?.trim());
}

async function checkDatabase() {
  try {
    await db.$queryRaw`SELECT 1`;
    record("Database", "PASS", "reachable");
  } catch {
    record("Database", "FAIL", "unreachable");
  }
}

async function checkMigrations() {
  try {
    const command =
      process.platform === "win32"
        ? {
            file: "cmd.exe",
            args: ["/d", "/s", "/c", "npx prisma migrate status"],
          }
        : { file: "npx", args: ["prisma", "migrate", "status"] };
    await execFileAsync(
      command.file,
      command.args,
      { env: process.env, timeout: 60_000 },
    );
    record("Migrations", "PASS", "database schema is up to date");
  } catch {
    record("Migrations", "FAIL", "pending, failed, or status unavailable");
  }
}

async function checkStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const secretMode =
    secret?.startsWith("sk_live_") || secret?.startsWith("rk_live_")
      ? "live"
      : secret?.startsWith("sk_test_") || secret?.startsWith("rk_test_")
        ? "test"
        : "unknown";
  const publishableMode = publishable?.startsWith("pk_live_")
    ? "live"
    : publishable?.startsWith("pk_test_")
      ? "test"
      : "unknown";
  record(
    "Stripe key mode",
    secretMode === "unknown" ? "FAIL" : "PASS",
    `secret=${secretMode}, publishable=${publishableMode}`,
  );

  if (process.env.BOOKING_ENABLED === "1" &&
      (secretMode !== "live" || publishableMode !== "live")) {
    record(
      "Booking payments",
      "WARN",
      "booking is on without matching Stripe live keys",
    );
  }

  if (!secret || !process.env.AUTH_URL) {
    record("Stripe webhook", "FAIL", "Stripe key or AUTH_URL is missing");
    return;
  }
  try {
    const stripe = new Stripe(secret);
    const expectedUrl = "https://www.makina.se/api/webhooks/stripe";
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
    const enabled = endpoints.data.filter((candidate) => candidate.status === "enabled");
    const elsewhere = enabled
      .map((candidate) => candidate.url.replace(/\/$/, ""))
      .filter((url) => url !== expectedUrl);
    if (elsewhere.length) {
      record(
        "Stripe webhook targets",
        "WARN",
        `enabled endpoints pointing elsewhere: ${elsewhere.join(", ")}`,
      );
    }
    const canonical = enabled.filter(
      (candidate) => candidate.url.replace(/\/$/, "") === expectedUrl,
    );
    if (canonical.length !== 1) {
      record(
        "Stripe webhook",
        "FAIL",
        `${canonical.length} enabled endpoints at ${expectedUrl}`,
      );
      return;
    }
    const endpoint = canonical[0];
    if (!endpoint) return;
    const subscribed = new Set(endpoint.enabled_events);
    const missing = subscribed.has("*")
      ? []
      : HANDLED_EVENT_TYPES.filter((event) => !subscribed.has(event));
    record(
      "Stripe webhook",
      missing.length ? "FAIL" : "PASS",
      missing.length
        ? `missing handled events: ${missing.join(", ")}`
        : `enabled with ${HANDLED_EVENT_TYPES.length} handled events`,
    );
  } catch {
    record("Stripe webhook", "FAIL", "endpoint check failed");
  }
}

async function checkElks() {
  const username = process.env.ELKS_API_USERNAME;
  const password = process.env.ELKS_API_PASSWORD;
  if (!username || !password) {
    record("46elks", "FAIL", "credentials are missing");
    return;
  }
  try {
    const response = await fetch("https://api.46elks.com/a1/me", {
      headers: {
        authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      record("46elks", "FAIL", "credentials or account check failed");
      return;
    }
    const payload = (await response.json()) as {
      balance?: number | string;
      currency?: string;
    };
    const balance = Number(payload.balance);
    if (!Number.isFinite(balance)) {
      record("46elks", "FAIL", "account balance was not returned");
      return;
    }
    const low = balance < ELKS_LOW_BALANCE_SEK;
    record(
      "46elks",
      low ? "WARN" : "PASS",
      `account reachable; balance ${balance.toFixed(2)} ${payload.currency ?? "SEK"}${
        low ? ` (below ${ELKS_LOW_BALANCE_SEK} SEK)` : ""
      }`,
    );
  } catch {
    record("46elks", "FAIL", "account check failed");
  }
}

async function checkBackups(now: Date) {
  try {
    const config = backupConfiguration();
    const newest = await newestBackupObject(config.client, config.bucket);
    const age = backupAgeHours(newest.lastModified, now);
    record(
      "R2 backup",
      age < MAX_BACKUP_AGE_HOURS ? "PASS" : "FAIL",
      `newest object is ${age.toFixed(1)} h old (limit < ${MAX_BACKUP_AGE_HOURS} h)`,
    );
  } catch {
    record("R2 backup", "FAIL", "bucket or newest backup is unavailable");
  }
}

async function checkConfiguration() {
  const missing = REQUIRED_PRODUCTION_ENVIRONMENT_VARIABLES.filter(
    (name) => !configured(name),
  );
  record(
    "Required environment",
    missing.length ? "FAIL" : "PASS",
    missing.length ? `missing: ${missing.join(", ")}` : "all required variables present",
  );

  const urls = canonicalUrlStatus(
    process.env.AUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  );
  record("Canonical URL", urls.ok ? "PASS" : "FAIL", urls.reason);
  record(
    "Sentry",
    configured("SENTRY_DSN") ? "PASS" : "FAIL",
    configured("SENTRY_DSN") ? "server DSN is set" : "SENTRY_DSN is missing",
  );

  const googleMissing = ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"].filter(
    (name) => !configured(name),
  );
  record(
    "Google sign-in",
    googleMissing.length ? "WARN" : "PASS",
    googleMissing.length ? `missing: ${googleMissing.join(", ")}` : "configured",
  );
  const mapsKey =
    configured("GOOGLE_MAPS_BROWSER_KEY") ||
    configured("NEXT_PUBLIC_GOOGLE_MAPS_KEY");
  const mapId =
    configured("GOOGLE_MAPS_MAP_ID") ||
    configured("NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID");
  record(
    "CRON_SECRET",
    configured("CRON_SECRET") ? "PASS" : "FAIL",
    configured("CRON_SECRET") ? "set" : "missing",
  );
  record(
    "Launch flags",
    "PASS",
    `BOOKING_ENABLED=${process.env.BOOKING_ENABLED ?? "unset"} INSTRUCTORS_ENABLED=${process.env.INSTRUCTORS_ENABLED ?? "unset"} THEORY_MODE=${process.env.THEORY_MODE ?? "free"}`,
  );
  await checkMaps(mapsKey, mapId);
  await checkCalendars();
}

async function checkMaps(mapsKey: boolean, mapId: boolean) {
  const key =
    process.env.GOOGLE_MAPS_BROWSER_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY?.trim();
  if (!mapsKey || !mapId || !key) {
    record("Google Maps", "WARN", "browser key or Map ID missing");
    return;
  }
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=Function.prototype`,
      {
        headers: { referer: "https://www.makina.se/" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    const body = (await response.text()).replaceAll(key, "[key]");
    const error = body.match(/Google Maps JavaScript API error: ([^\n<]+)/)?.[1];
    record(
      "Google Maps",
      response.ok && !error ? "PASS" : "FAIL",
      error ?? (response.ok ? "Maps JS API answered for www.makina.se" : `HTTP ${response.status}`),
    );
  } catch (error) {
    record(
      "Google Maps",
      "FAIL",
      error instanceof Error ? error.message : "Maps JS request failed",
    );
  }
}

async function checkCalendars() {
  if (process.env.GOOGLE_CALENDAR_SYNC_ENABLED !== "1") {
    record("Google Calendar", "WARN", "sync is off");
    return;
  }
  const { probeTeacherCalendar } = await import("../src/lib/calendar/google");
  const teachers = await db.teacherProfile.findMany({
    where: { active: true, googleCalendarEmail: { not: null } },
    select: { slug: true, googleCalendarEmail: true },
  });
  if (!teachers.length) {
    record("Google Calendar", "WARN", "no teacher calendar emails are set");
    return;
  }
  for (const teacher of teachers) {
    if (!teacher.googleCalendarEmail) continue;
    try {
      await probeTeacherCalendar(teacher.googleCalendarEmail);
      record("Google Calendar", "PASS", `${teacher.slug} reachable`);
    } catch (error) {
      record(
        "Google Calendar",
        "FAIL",
        `${teacher.slug}: ${error instanceof Error ? error.message : "unreachable"}`,
      );
    }
  }
}

function printResults() {
  const widths = {
    check: Math.max("CHECK".length, ...results.map((result) => result.check.length)),
    status: "STATUS".length,
  };
  console.log(
    `${"CHECK".padEnd(widths.check)}  ${"STATUS".padEnd(widths.status)}  DETAIL`,
  );
  for (const result of results) {
    console.log(
      `${result.check.padEnd(widths.check)}  ${result.status.padEnd(widths.status)}  ${result.detail}`,
    );
  }
}

async function main() {
  await checkConfiguration();
  await checkDatabase();
  await checkMigrations();
  await checkStripe();
  await checkElks();
  await checkBackups(new Date());
  printResults();
  if (results.some((result) => result.status === "FAIL")) process.exitCode = 1;
}

main()
  .catch(() => {
    record("Launch check", "FAIL", "unexpected check failure");
    printResults();
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
