import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";

const HOURLY_LIMIT = 3;
const DAILY_LIMIT = 6;
const OTP_TTL_SECONDS = 10 * 60;
const HOUR_SECONDS = 60 * 60;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_LIMIT = 5;
const MAX_OTP_ATTEMPTS = 5;

export type OtpStoreResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function phoneKey(phone: string) {
  return createHash("sha256").update(phone).digest("hex");
}

async function bumpRateLimit(key: string, windowSeconds: number, now: Date) {
  const existing = await db.rateLimit.findUnique({ where: { key } });
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
  if (!existing || existing.expiresAt <= now) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: 1, expiresAt },
    });
    return { count: 1, retryAfterSeconds: windowSeconds };
  }
  const updated = await db.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000),
  );
  return { count: updated.count, retryAfterSeconds };
}

export async function storeOtp(
  phone: string,
  code: string,
  now: Date,
): Promise<OtpStoreResult> {
  const key = phoneKey(phone);
  const hourly = await bumpRateLimit(`otp:${key}:hour`, HOUR_SECONDS, now);
  const daily = await bumpRateLimit(`otp:${key}:day`, DAY_SECONDS, now);
  if (hourly.count > HOURLY_LIMIT || daily.count > DAILY_LIMIT) {
    return {
      allowed: false,
      retryAfterSeconds:
        hourly.count > HOURLY_LIMIT
          ? hourly.retryAfterSeconds
          : daily.retryAfterSeconds,
    };
  }

  await db.otpCode.upsert({
    where: { phoneHash: key },
    create: {
      phoneHash: key,
      codeHash: await bcrypt.hash(code, 10),
      attempts: 0,
      expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
    },
    update: {
      codeHash: await bcrypt.hash(code, 10),
      attempts: 0,
      expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
    },
  });

  return { allowed: true };
}

export async function consumeOtp(
  phone: string,
  code: string,
  now: Date,
  client: Pick<Prisma.TransactionClient, "otpCode"> = db,
): Promise<boolean> {
  const key = phoneKey(phone);
  const entry = await client.otpCode.findUnique({ where: { phoneHash: key } });
  if (!entry || entry.expiresAt < now) return false;

  if (!(await bcrypt.compare(code, entry.codeHash))) {
    const attempts = entry.attempts + 1;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await client.otpCode.delete({ where: { phoneHash: key } });
    } else {
      await client.otpCode.update({
        where: { phoneHash: key },
        data: { attempts },
      });
    }
    return false;
  }

  await client.otpCode.delete({ where: { phoneHash: key } });
  return true;
}

export async function allowLoginAttempt(
  identifier: string,
  _ip: string,
  now: Date,
): Promise<boolean> {
  const key = `login:${phoneKey(identifier)}`;
  const result = await bumpRateLimit(key, LOGIN_WINDOW_SECONDS, now);
  return result.count <= LOGIN_LIMIT;
}

export async function allowRateLimitedAction(
  action: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
  now: Date,
) {
  const key = `action:${phoneKey(`${action}:${identifier}`)}`;
  const result = await bumpRateLimit(key, windowSeconds, now);
  return result.count <= limit;
}
