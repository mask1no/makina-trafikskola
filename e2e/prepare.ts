import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import integrationGlobalSetup from "../vitest.integration.global-setup";

function databaseUrlFromEnvFile() {
  if (process.env.DATABASE_URL?.trim()) return;
  try {
    const text = readFileSync(".env", "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("DATABASE_URL=")) continue;
      const value = trimmed.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
      if (value) process.env.DATABASE_URL = value;
      return;
    }
  } catch {
    // CI sets DATABASE_URL. A missing .env is fine there.
  }
  process.env.DATABASE_URL ??=
    "postgresql://makina:makina_local_dev@localhost:5433/makina_test";
}

databaseUrlFromEnvFile();
integrationGlobalSetup();

function runPrisma(args: string[]) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", ...args],
    {
      env: { ...process.env, NODE_ENV: "test" },
      stdio: "inherit",
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

runPrisma(["migrate", "deploy"]);
runPrisma(["db", "seed"]);
