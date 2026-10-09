import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export class R2ConfigurationError extends Error {
  constructor() {
    super("R2_NOT_CONFIGURED");
    this.name = "R2ConfigurationError";
  }
}

export class InvalidImageError extends Error {
  constructor(public readonly code: "IMAGE_TOO_LARGE" | "INVALID_IMAGE_TYPE") {
    super(code);
    this.name = "InvalidImageError";
  }
}

function configuration() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new R2ConfigurationError();
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export async function uploadInstructorImage(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new InvalidImageError("IMAGE_TOO_LARGE");
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new InvalidImageError("INVALID_IMAGE_TYPE");
  }

  let image: Buffer;
  try {
    image = await sharp(Buffer.from(await file.arrayBuffer()), {
      failOn: "error",
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new InvalidImageError("INVALID_IMAGE_TYPE");
  }

  const config = configuration();
  const key = `instructors/${randomUUID()}.webp`;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: image,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return {
    key,
    url: `${config.publicUrl.replace(/\/$/, "")}/${key}`,
  };
}

export async function uploadInstructorBytes(image: Buffer) {
  const config = configuration();
  const key = `instructors/${randomUUID()}.webp`;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: image,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${config.publicUrl.replace(/\/$/, "")}/${key}`;
}
