import { backupConfiguration } from "../../src/lib/ops/readiness";

export function requireEnvironment(names: readonly string[]) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function postgresEnvironment(variable: string) {
  const raw = process.env[variable];
  if (!raw) throw new Error(`Missing required environment variable: ${variable}`);

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${variable} must be a valid PostgreSQL URL`);
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error(`${variable} must use the postgresql protocol`);
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) throw new Error(`${variable} must include a database name`);

  return {
    database,
    env: {
      ...process.env,
      PGHOST: url.hostname,
      PGPORT: url.port || "5432",
      PGUSER: decodeURIComponent(url.username),
      PGPASSWORD: decodeURIComponent(url.password),
      PGDATABASE: database,
      ...(url.searchParams.get("sslmode")
        ? { PGSSLMODE: url.searchParams.get("sslmode")! }
        : {}),
    },
  };
}

export function r2Configuration() {
  return backupConfiguration();
}
