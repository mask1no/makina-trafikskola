import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { REQUIRED_PRODUCTION_ENVIRONMENT_VARIABLES } from "../src/lib/env";

type Mode = "check" | "apply";
type CheckStatus = "new" | "changed" | "same" | "remove-candidate";
type SafetyLevel = "WARN" | "FAIL";
type SafetyIssue = { level: SafetyLevel; message: string };

const SOURCE_FILE = ".env.production.local";
const CANONICAL_HOST = "https://www.makina.se";
const EXCLUDED_KEYS = new Set([
  "DATABASE_URL",
  "RESTORE_DATABASE_URL",
  "PG_DUMP_BIN",
  "PG_RESTORE_BIN",
  "DEV_OTP_CODE",
  "DEV_CRON_SECRET",
  "NODE_ENV",
]);
const RAILWAY_BIN = "railway";

function runRailway(args: string[]) {
  return spawnSync(RAILWAY_BIN, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    // Windows npm/global shims like railway.cmd require shell execution.
    shell: process.platform === "win32",
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const mode = args.includes("--apply") ? "apply" : "check";
  const cliFlags: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg !== "--service" && arg !== "--environment" && arg !== "--project") continue;
    const value = args[i + 1];
    if (!value || value.startsWith("-")) {
      throw new Error(`Missing value for ${arg}`);
    }
    cliFlags.push(arg, value);
    i += 1;
  }
  return { mode: mode as Mode, cliFlags };
}

function parseEnvFile(path: string) {
  const map = new Map<string, string>();
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

function parseExampleKeys() {
  const lines = readFileSync(".env.example", "utf8").split(/\r?\n/);
  const keys = new Set<string>();
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

function allowedKeys() {
  const keys = new Set<string>([
    ...REQUIRED_PRODUCTION_ENVIRONMENT_VARIABLES,
    ...parseExampleKeys(),
  ]);
  for (const excluded of EXCLUDED_KEYS) keys.delete(excluded);
  return keys;
}

function containsUnsafeValue(value: string) {
  return /localhost|127\.0\.0\.1|_test/i.test(value);
}

function looksPlaceholder(value: string) {
  return /(?:changeme|xxx|your-|replace|example|dummy|todo)/i.test(value);
}

function stripeMode(value?: string) {
  if (!value) return "unknown";
  if (value.startsWith("sk_live_") || value.startsWith("pk_live_")) return "live";
  if (value.startsWith("sk_test_") || value.startsWith("pk_test_")) return "test";
  return "unknown";
}

function evaluateSafety(source: Map<string, string>) {
  const issues: SafetyIssue[] = [];
  const maybeFail = (condition: boolean, message: string) => {
    if (condition) issues.push({ level: "FAIL", message });
  };
  const maybeWarn = (condition: boolean, message: string) => {
    if (condition) issues.push({ level: "WARN", message });
  };

  for (const [key, value] of source.entries()) {
    maybeFail(!value, `${key}: value is empty`);
    maybeFail(containsUnsafeValue(value), `${key}: contains localhost/127.0.0.1/_test`);
    maybeFail(looksPlaceholder(value), `${key}: looks like a placeholder value`);
  }

  const authUrl = source.get("AUTH_URL");
  const siteUrl = source.get("NEXT_PUBLIC_SITE_URL");
  maybeFail(authUrl !== CANONICAL_HOST, "AUTH_URL must be exactly https://www.makina.se");
  maybeFail(siteUrl !== CANONICAL_HOST, "NEXT_PUBLIC_SITE_URL must be exactly https://www.makina.se");

  const authSecret = source.get("AUTH_SECRET") ?? "";
  const cronSecret = source.get("CRON_SECRET") ?? "";
  maybeFail(authSecret.length < 32, "AUTH_SECRET must be at least 32 characters");
  maybeFail(cronSecret.length < 32, "CRON_SECRET must be at least 32 characters");

  const secretMode = stripeMode(source.get("STRIPE_SECRET_KEY"));
  const publishableMode = stripeMode(source.get("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"));
  const bookingEnabled = source.get("BOOKING_ENABLED") === "1";

  maybeFail(
    (secretMode === "live" && publishableMode === "test") ||
      (secretMode === "test" && publishableMode === "live"),
    "Stripe secret/publishable key modes do not match",
  );
  maybeFail(
    bookingEnabled && (secretMode !== "live" || publishableMode !== "live"),
    "BOOKING_ENABLED=1 requires live Stripe keys",
  );
  maybeWarn(
    !bookingEnabled && (secretMode === "test" || publishableMode === "test"),
    "Stripe test keys are allowed while BOOKING_ENABLED=0",
  );

  maybeWarn(
    !source.get("AUTH_GOOGLE_ID") || !source.get("AUTH_GOOGLE_SECRET"),
    "Google sign-in keys are missing",
  );
  const hasMapsKey =
    Boolean(source.get("GOOGLE_MAPS_BROWSER_KEY")) ||
    Boolean(source.get("NEXT_PUBLIC_GOOGLE_MAPS_KEY"));
  const hasMapId =
    Boolean(source.get("GOOGLE_MAPS_MAP_ID")) ||
    Boolean(source.get("NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID"));
  maybeWarn(!hasMapsKey || !hasMapId, "Google Maps runtime key or map ID is missing");

  return issues;
}

function maskValue(value: string | null | undefined) {
  if (!value) return "<empty>";
  const head = value.slice(0, 4);
  return `${head}…${value.length}`;
}

function parseRailwayJson(raw: string) {
  const parsed = JSON.parse(raw) as unknown;
  const result = new Map<string, string | null>();
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const key = "name" in item ? String((item as Record<string, unknown>).name) : "key" in item ? String((item as Record<string, unknown>).key) : null;
      if (!key) continue;
      const value = "value" in item ? (item as Record<string, unknown>).value : null;
      result.set(key, value == null ? null : String(value));
    }
    return result;
  }
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.variables)) {
      for (const item of obj.variables as unknown[]) {
        if (!item || typeof item !== "object") continue;
        const rec = item as Record<string, unknown>;
        const key = typeof rec.name === "string" ? rec.name : typeof rec.key === "string" ? rec.key : null;
        if (!key) continue;
        result.set(key, rec.value == null ? null : String(rec.value));
      }
      return result;
    }
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" || value === null) result.set(key, value);
    }
  }
  return result;
}

function railwayList(cliFlags: string[]) {
  const command = runRailway(["variable", "list", "--json", ...cliFlags]);
  if (command.error) {
    throw command.error;
  }
  if (command.status !== 0) {
    throw new Error((command.stderr || "Failed to list Railway variables").trim());
  }
  return parseRailwayJson(command.stdout);
}

function supportsSkipDeploys() {
  const command = runRailway(["variable", "--help"]);
  if (command.error) return false;
  return command.status === 0 && command.stdout.includes("--skip-deploys");
}

function printTable(rows: Array<{ key: string; status: CheckStatus; masked: string }>) {
  const keyWidth = Math.max(3, ...rows.map((row) => row.key.length));
  const statusWidth = Math.max(6, ...rows.map((row) => row.status.length));
  console.log(`${"KEY".padEnd(keyWidth)}  ${"STATUS".padEnd(statusWidth)}  MASKED`);
  for (const row of rows) {
    console.log(`${row.key.padEnd(keyWidth)}  ${row.status.padEnd(statusWidth)}  ${row.masked}`);
  }
}

function statusRows(source: Map<string, string>, current: Map<string, string | null>) {
  const rows: Array<{ key: string; status: CheckStatus; masked: string }> = [];
  for (const [key, value] of source.entries()) {
    if (!current.has(key)) {
      rows.push({ key, status: "new", masked: maskValue(value) });
      continue;
    }
    const currentValue = current.get(key);
    if (currentValue === value) {
      rows.push({ key, status: "same", masked: maskValue(value) });
    } else {
      rows.push({ key, status: "changed", masked: maskValue(value) });
    }
  }
  for (const [key, value] of current.entries()) {
    if (source.has(key)) continue;
    rows.push({ key, status: "remove-candidate", masked: maskValue(value) });
  }
  rows.sort((a, b) => a.key.localeCompare(b.key));
  return rows;
}

function failMessages(issues: SafetyIssue[]) {
  return issues.filter((issue) => issue.level === "FAIL").map((issue) => issue.message);
}

function warnMessages(issues: SafetyIssue[]) {
  return issues.filter((issue) => issue.level === "WARN").map((issue) => issue.message);
}

function main() {
  const { mode, cliFlags } = parseArgs();
  if (!existsSync(SOURCE_FILE)) {
    console.error(`Missing ${SOURCE_FILE}. This script only reads that file.`);
    process.exitCode = 1;
    return;
  }

  const source = parseEnvFile(SOURCE_FILE);
  const allowed = allowedKeys();
  const unknown = [...source.keys()].filter((key) => !allowed.has(key));
  const unknownIssues = unknown.map((key) => ({ level: "FAIL", message: `${key}: unknown key` } as const));
  const safety = [...unknownIssues, ...evaluateSafety(source)];

  const current = railwayList(cliFlags);
  const rows = statusRows(source, current);
  printTable(rows);

  for (const warning of warnMessages(safety)) {
    console.log(`WARN: ${warning}`);
  }

  const failures = failMessages(safety);
  if (failures.length > 0) {
    for (const failure of failures) {
      console.log(`FAIL: ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  if (mode === "check") return;

  const toSet = rows.filter((row) => row.status === "new" || row.status === "changed");
  if (toSet.length === 0) {
    console.log("No variable updates required.");
    return;
  }

  const setArgs = toSet.flatMap((row) => ["--set", `${row.key}=${source.get(row.key) ?? ""}`]);
  const args = ["variable", ...setArgs, ...cliFlags];
  if (supportsSkipDeploys()) args.push("--skip-deploys");

  const command = runRailway(args);
  if (command.error) {
    console.error(`Failed to apply Railway variables: ${command.error.message}`);
    process.exitCode = 1;
    return;
  }
  if (command.status !== 0) {
    console.error("Failed to apply Railway variables.");
    process.exitCode = 1;
    return;
  }
  console.log(`Applied ${toSet.length} variable(s).`);
}

main();
