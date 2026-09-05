import { S3Client } from "@aws-sdk/client-s3";

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
  requireEnvironment([
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BACKUP_BUCKET",
  ]);
  const accountId = process.env.R2_ACCOUNT_ID!;
  return {
    bucket: process.env.R2_BACKUP_BUCKET!,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    }),
  };
}
