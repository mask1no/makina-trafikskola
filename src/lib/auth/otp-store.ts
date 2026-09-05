import { createHash } from "node:crypto";

import bcrypt from "bcryptjs";
import { createClient, type RedisClientType } from "redis";

const HOURLY_LIMIT = 3;
const DAILY_LIMIT = 6;
const OTP_TTL_SECONDS = 10 * 60;
const HOUR_SECONDS = 60 * 60;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_LIMIT = 5;

type MemoryEntry = {
  hourStartedAt: number;
  hourlyCount: number;
  dayStartedAt: number;
  dailyCount: number;
  codeHash?: string;
  codeExpiresAt?: number;
};

type MemoryStore = Map<string, MemoryEntry>;
type LoginMemoryStore = Map<string, { startedAt: number; count: number }>;
type ActionMemoryStore = Map<string, { startedAt: number; count: number }>;

const globalForOtp = globalThis as unknown as {
  otpMemory?: MemoryStore;
  loginMemory?: LoginMemoryStore;
  actionMemory?: ActionMemoryStore;
  otpRedis?: RedisClientType;
};

const memory = globalForOtp.otpMemory ?? new Map<string, MemoryEntry>();
const loginMemory =
  globalForOtp.loginMemory ??
  new Map<string, { startedAt: number; count: number }>();
const actionMemory =
  globalForOtp.actionMemory ??
  new Map<string, { startedAt: number; count: number }>();

if (process.env.NODE_ENV !== "production") {
  globalForOtp.otpMemory = memory;
  globalForOtp.loginMemory = loginMemory;
  globalForOtp.actionMemory = actionMemory;
}

function phoneKey(phone: string) {
  return createHash("sha256").update(phone).digest("hex");
}

async function getRedis() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  const client =
    globalForOtp.otpRedis ??
    createClient({
      url: process.env.REDIS_URL,
    });

  if (!client.isOpen) {
    await client.connect();
  }

  globalForOtp.otpRedis = client;
  return client;
}

export type OtpStoreResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export async function storeOtp(
  phone: string,
  code: string,
  now: Date,
): Promise<OtpStoreResult> {
  const key = phoneKey(phone);
  const codeHash = await bcrypt.hash(code, 10);
  const redis = await getRedis();

  if (redis) {
    const script = `
      local hourly = redis.call("INCR", KEYS[1])
      if hourly == 1 then redis.call("EXPIRE", KEYS[1], ARGV[2]) end
      local daily = redis.call("INCR", KEYS[2])
      if daily == 1 then redis.call("EXPIRE", KEYS[2], ARGV[3]) end
      if hourly > tonumber(ARGV[4]) or daily > tonumber(ARGV[5]) then
        return {0, math.max(redis.call("TTL", KEYS[1]), redis.call("TTL", KEYS[2]))}
      end
      redis.call("SET", KEYS[3], ARGV[1], "EX", ARGV[6])
      return {1, 0}
    `;
    const result = (await redis.eval(script, {
      keys: [`otp:${key}:hour`, `otp:${key}:day`, `otp:${key}:code`],
      arguments: [
        codeHash,
        String(HOUR_SECONDS),
        String(DAY_SECONDS),
        String(HOURLY_LIMIT),
        String(DAILY_LIMIT),
        String(OTP_TTL_SECONDS),
      ],
    })) as [number, number];

    return result[0] === 1
      ? { allowed: true }
      : { allowed: false, retryAfterSeconds: result[1] };
  }

  const nowMs = now.getTime();
  const entry = memory.get(key) ?? {
    hourStartedAt: nowMs,
    hourlyCount: 0,
    dayStartedAt: nowMs,
    dailyCount: 0,
  };

  if (nowMs - entry.hourStartedAt >= HOUR_SECONDS * 1000) {
    entry.hourStartedAt = nowMs;
    entry.hourlyCount = 0;
  }

  if (nowMs - entry.dayStartedAt >= DAY_SECONDS * 1000) {
    entry.dayStartedAt = nowMs;
    entry.dailyCount = 0;
  }

  entry.hourlyCount += 1;
  entry.dailyCount += 1;

  if (entry.hourlyCount > HOURLY_LIMIT || entry.dailyCount > DAILY_LIMIT) {
    memory.set(key, entry);
    const hourRemaining =
      HOUR_SECONDS - Math.floor((nowMs - entry.hourStartedAt) / 1000);
    const dayRemaining =
      DAY_SECONDS - Math.floor((nowMs - entry.dayStartedAt) / 1000);

    return {
      allowed: false,
      retryAfterSeconds:
        entry.hourlyCount > HOURLY_LIMIT ? hourRemaining : dayRemaining,
    };
  }

  entry.codeHash = codeHash;
  entry.codeExpiresAt = nowMs + OTP_TTL_SECONDS * 1000;
  memory.set(key, entry);

  return { allowed: true };
}

export async function consumeOtp(
  phone: string,
  code: string,
  now: Date,
): Promise<boolean> {
  const key = phoneKey(phone);
  const redis = await getRedis();

  if (redis) {
    const redisKey = `otp:${key}:code`;
    const codeHash = await redis.get(redisKey);
    if (!codeHash || !(await bcrypt.compare(code, codeHash))) {
      return false;
    }

    await redis.del(redisKey);
    return true;
  }

  const entry = memory.get(key);
  if (
    !entry?.codeHash ||
    !entry.codeExpiresAt ||
    entry.codeExpiresAt < now.getTime() ||
    !(await bcrypt.compare(code, entry.codeHash))
  ) {
    return false;
  }

  delete entry.codeHash;
  delete entry.codeExpiresAt;
  memory.set(key, entry);
  return true;
}

export async function allowLoginAttempt(
  identifier: string,
  ip: string,
  now: Date,
): Promise<boolean> {
  const key = phoneKey(`${ip}:${identifier}`);
  const redis = await getRedis();

  if (redis) {
    const redisKey = `login:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, LOGIN_WINDOW_SECONDS);
    }
    return count <= LOGIN_LIMIT;
  }

  const nowMs = now.getTime();
  const entry = loginMemory.get(key) ?? { startedAt: nowMs, count: 0 };
  if (nowMs - entry.startedAt >= LOGIN_WINDOW_SECONDS * 1000) {
    entry.startedAt = nowMs;
    entry.count = 0;
  }
  entry.count += 1;
  loginMemory.set(key, entry);
  return entry.count <= LOGIN_LIMIT;
}

export async function allowRateLimitedAction(
  action: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
  now: Date,
) {
  const key = phoneKey(`${action}:${identifier}`);
  const redis = await getRedis();
  if (redis) {
    const redisKey = `action:${action}:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, windowSeconds);
    return count <= limit;
  }

  const nowMs = now.getTime();
  const entry = actionMemory.get(key) ?? { startedAt: nowMs, count: 0 };
  if (nowMs - entry.startedAt >= windowSeconds * 1000) {
    entry.startedAt = nowMs;
    entry.count = 0;
  }
  entry.count += 1;
  actionMemory.set(key, entry);
  return entry.count <= limit;
}
