import {
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { db } from "@/lib/db";

export const MAX_BACKUP_AGE_HOURS = 26;
export const ELKS_LOW_BALANCE_SEK = 100;

type Environment = Record<string, string | undefined>;

export function canonicalUrlStatus(
  authUrl: string | undefined,
  canonicalUrl: string | undefined,
) {
  try {
    if (!authUrl || !canonicalUrl) {
      return { ok: false, reason: "AUTH_URL and NEXT_PUBLIC_SITE_URL are required" };
    }
    const auth = new URL(authUrl);
    const canonical = new URL(canonicalUrl);
    if (auth.protocol !== "https:") {
      return { ok: false, reason: "AUTH_URL must use https" };
    }
    if (canonical.protocol !== "https:") {
      return { ok: false, reason: "NEXT_PUBLIC_SITE_URL must use https" };
    }
    if (auth.host !== canonical.host) {
      return { ok: false, reason: "AUTH_URL must match the canonical host" };
    }
    return { ok: true, reason: "https and canonical host match" };
  } catch {
    return { ok: false, reason: "AUTH_URL and NEXT_PUBLIC_SITE_URL must be valid URLs" };
  }
}

export function backupAgeHours(lastModified: Date, now: Date) {
  return Math.max(0, (now.getTime() - lastModified.getTime()) / 3_600_000);
}

export function backupConfiguration(environment: Environment = process.env) {
  const required = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BACKUP_BUCKET",
  ] as const;
  const missing = required.filter((name) => !environment[name]?.trim());
  if (missing.length) {
    throw new Error(`Missing backup configuration: ${missing.join(", ")}`);
  }
  return {
    bucket: environment.R2_BACKUP_BUCKET!,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${environment.R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: environment.R2_ACCESS_KEY_ID!,
        secretAccessKey: environment.R2_SECRET_ACCESS_KEY!,
      },
    }),
  };
}

export async function newestBackupObject(
  client: S3Client,
  bucket: string,
  environment: Environment = process.env,
) {
  const prefix = (environment.BACKUP_PREFIX || "postgres").replace(
    /^\/+|\/+$/g,
    "",
  );
  let continuationToken: string | undefined;
  let newest: { Key?: string; LastModified?: Date } | undefined;
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${prefix}/`,
        ContinuationToken: continuationToken,
      }),
    );
    for (const item of response.Contents ?? []) {
      if (
        item.Key &&
        item.LastModified &&
        (!newest?.LastModified ||
          item.LastModified.getTime() > newest.LastModified.getTime())
      ) {
        newest = item;
      }
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  if (!newest?.Key || !newest.LastModified) {
    throw new Error("No R2 backup object was found");
  }
  return { key: newest.Key, lastModified: newest.LastModified };
}

export async function migrationStatus() {
  const migrationsDirectory = resolve("prisma", "migrations");
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  const expected = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const rows = await db.$queryRaw<
    Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>
  >`
    SELECT "migration_name", "finished_at", "rolled_back_at"
    FROM "_prisma_migrations"
  `;
  const applied = new Set(
    rows
      .filter((row) => row.finished_at && !row.rolled_back_at)
      .map((row) => row.migration_name),
  );
  const failed = rows
    .filter((row) => !row.finished_at && !row.rolled_back_at)
    .map((row) => row.migration_name)
    .sort();
  const pending = expected.filter((name) => !applied.has(name));
  return {
    upToDate: pending.length === 0 && failed.length === 0,
    applied: applied.size,
    pending,
    failed,
  };
}
