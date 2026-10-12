import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  otpUpsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    rateLimit: {
      findUnique: mocks.findUnique,
      upsert: mocks.upsert,
      update: mocks.update,
    },
    otpCode: {
      upsert: mocks.otpUpsert,
    },
  },
}));

import {
  allowLoginAttempt,
  checkOtpRequestLimits,
  otpDailyCap,
} from "./otp-store";

function installCounterStore() {
  const store = new Map<string, { count: number; expiresAt: Date }>();
  mocks.findUnique.mockImplementation(
    async ({ where }: { where: { key: string } }) => {
      return store.get(where.key) ?? null;
    },
  );
  mocks.upsert.mockImplementation(
    async ({
      where,
      create,
    }: {
      where: { key: string };
      create: { count: number; expiresAt: Date };
    }) => {
      store.set(where.key, {
        count: create.count,
        expiresAt: create.expiresAt,
      });
      return store.get(where.key);
    },
  );
  mocks.update.mockImplementation(
    async ({ where }: { where: { key: string } }) => {
      const current = store.get(where.key);
      if (!current) throw new Error("missing");
      current.count += 1;
      store.set(where.key, current);
      return current;
    },
  );
  return store;
}

describe("otp cost protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OTP_DAILY_CAP;
  });

  it("defaults OTP_DAILY_CAP to 300", () => {
    expect(otpDailyCap()).toBe(300);
    process.env.OTP_DAILY_CAP = "50";
    expect(otpDailyCap()).toBe(50);
  });

  it("blocks when the global daily OTP cap is exceeded", async () => {
    process.env.OTP_DAILY_CAP = "2";
    installCounterStore();
    const now = new Date("2026-10-12T10:00:00.000Z");

    expect(
      (await checkOtpRequestLimits("+46701111111", now, { ip: "1.1.1.1" }))
        .allowed,
    ).toBe(true);
    expect(
      (await checkOtpRequestLimits("+46702222222", now, { ip: "1.1.1.2" }))
        .allowed,
    ).toBe(true);
    expect(
      await checkOtpRequestLimits("+46703333333", now, { ip: "1.1.1.3" }),
    ).toMatchObject({ allowed: false, reason: "global" });
  });

  it("blocks when the per-IP OTP window is exceeded", async () => {
    process.env.OTP_DAILY_CAP = "1000";
    installCounterStore();
    const now = new Date("2026-10-12T10:00:00.000Z");

    for (let i = 0; i < 10; i += 1) {
      const result = await checkOtpRequestLimits(`+4670100000${i}`, now, {
        ip: "9.9.9.9",
      });
      expect(result.allowed).toBe(true);
    }
    expect(
      await checkOtpRequestLimits("+46701999999", now, { ip: "9.9.9.9" }),
    ).toMatchObject({ allowed: false, reason: "ip" });
  });

  it("limits password login attempts per identifier and IP", async () => {
    installCounterStore();
    const now = new Date("2026-10-12T10:00:00.000Z");

    for (let i = 0; i < 5; i += 1) {
      expect(await allowLoginAttempt("user@example.com", "1.1.1.1", now)).toBe(
        true,
      );
    }
    expect(await allowLoginAttempt("user@example.com", "1.1.1.1", now)).toBe(
      false,
    );
  });
});
