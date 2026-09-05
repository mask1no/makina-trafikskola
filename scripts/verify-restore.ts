import {
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

import { postgresEnvironment, r2Configuration } from "./lib/backup";

function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ["ignore", "ignore", "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`pg_restore exited with code ${code}`)),
    );
  });
}

async function newestBackupKey(
  client: ReturnType<typeof r2Configuration>["client"],
  bucket: string,
) {
  const prefix = (process.env.BACKUP_PREFIX || "postgres").replace(/^\/+|\/+$/g, "");
  const response = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: `${prefix}/` }),
  );
  const newest = response.Contents?.filter((item) => item.Key && item.LastModified)
    .sort((a, b) => b.LastModified!.getTime() - a.LastModified!.getTime())[0];
  if (!newest?.Key) throw new Error("No R2 backup object was found");
  return newest.Key;
}

async function main() {
  const postgres = postgresEnvironment("RESTORE_DATABASE_URL");
  if (!/(?:restore|test)/i.test(postgres.database)) {
    throw new Error(
      "Refusing restore: target database name must include 'restore' or 'test'",
    );
  }

  const r2 = r2Configuration();
  const key =
    process.env.BACKUP_OBJECT_KEY ||
    (await newestBackupKey(r2.client, r2.bucket));
  const temporaryFile = join(tmpdir(), `makina-restore-${randomUUID()}.dump`);

  try {
    const response = await r2.client.send(
      new GetObjectCommand({ Bucket: r2.bucket, Key: key }),
    );
    if (!response.Body) throw new Error("The selected R2 backup is empty");
    await pipeline(response.Body as Readable, createWriteStream(temporaryFile));

    const pgRestore = process.env.PG_RESTORE_BIN || "pg_restore";
    await run(pgRestore, ["--list", temporaryFile], postgres.env);
    await run(
      pgRestore,
      [
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "--exit-on-error",
        "--dbname",
        postgres.database,
        temporaryFile,
      ],
      postgres.env,
    );
    console.log(`Restore verification completed from object: ${key}`);
  } finally {
    await rm(temporaryFile, { force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Restore verification failed");
  process.exit(1);
});
