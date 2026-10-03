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
  const secretMode = secret?.startsWith("sk_live_")
    ? "live"
    : secret?.startsWith("sk_test_")
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
    const expectedUrl = `${new URL(process.env.AUTH_URL).origin}/api/webhooks/stripe`;
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
    const endpoint = endpoints.data.find(
      (candidate) => candidate.url.replace(/\/$/, "") === expectedUrl,
    );
    if (!endpoint) {
      record("Stripe webhook", "FAIL", "canonical endpoint does not exist");
      return;
    }
    if (endpoint.status !== "enabled") {
      record("Stripe webhook", "FAIL", "canonical endpoint is disabled");
      return;
    }
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

function checkConfiguration() {
  const missing = REQUIRED_PRODUCTION_ENVIRONMENT_VARIABLES.filter(
    (name) => !configured(name),
  );
  record(
    "Required environment",
    missing.length ? "FAIL" : "PASS",
    missing.length ? `missing: ${missing.join(", ")}` : "all required variables present",
  );

  const booking = process.env.BOOKING_ENABLED === "1";
  const instructors = process.env.INSTRUCTORS_ENABLED === "1";
  record(
    "Launch flags",
    booking || instructors ? "WARN" : "PASS",
    `BOOKING_ENABLED=${booking ? "on" : "off"}, INSTRUCTORS_ENABLED=${
      instructors ? "on" : "off"
    }`,
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
    "Google Maps",
    mapsKey && mapId ? "PASS" : "WARN",
    mapsKey && mapId ? "browser key and Map ID configured" : "browser key or Map ID missing",
  );
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
  checkConfiguration();
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
