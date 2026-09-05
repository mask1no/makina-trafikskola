import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

import { postgresEnvironment, r2Configuration } from "./lib/backup";

function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ["ignore", "ignore", "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`pg_dump exited with code ${code}`)),
    );
  });
}

async function main() {
  const postgres = postgresEnvironment("DATABASE_URL");
  const r2 = r2Configuration();
  const temporaryFile = join(tmpdir(), `makina-backup-${randomUUID()}.dump`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const prefix = (process.env.BACKUP_PREFIX || "postgres").replace(/^\/+|\/+$/g, "");
  const key = `${prefix}/${timestamp}.dump`;

  try {
    await run(
      process.env.PG_DUMP_BIN || "pg_dump",
      [
        "--format=custom",
        "--no-owner",
        "--no-privileges",
        "--file",
        temporaryFile,
        postgres.database,
      ],
      postgres.env,
    );
    const file = await stat(temporaryFile);
    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: createReadStream(temporaryFile),
        ContentLength: file.size,
        ContentType: "application/octet-stream",
      }),
    );
    console.log(`Backup uploaded: ${key}`);
  } finally {
    await rm(temporaryFile, { force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Backup failed");
  process.exit(1);
});
