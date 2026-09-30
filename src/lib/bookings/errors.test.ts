import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  isSerializationOrTxTimeout,
  isUniqueViolationOn,
} from "./errors";

function knownError(
  code: string,
  meta?: Record<string, unknown>,
) {
  return new Prisma.PrismaClientKnownRequestError(code, {
    code,
    clientVersion: "test",
    meta,
  });
}

describe("isSerializationOrTxTimeout", () => {
  it("matches transaction serialization and timeout codes", () => {
    expect(isSerializationOrTxTimeout(knownError("P2034"))).toBe(true);
    expect(isSerializationOrTxTimeout(knownError("P2028"))).toBe(true);
  });

  it("ignores other failures", () => {
    expect(isSerializationOrTxTimeout(knownError("P2002"))).toBe(false);
    expect(isSerializationOrTxTimeout(new Error("P2034"))).toBe(false);
  });
});

describe("isUniqueViolationOn", () => {
  it("matches the model name", () => {
    expect(
      isUniqueViolationOn(
        knownError("P2002", { modelName: "StripeEvent", target: ["id"] }),
        "StripeEvent",
      ),
    ).toBe(true);
  });

  it("matches a constraint target string or array", () => {
    expect(
      isUniqueViolationOn(
        knownError("P2002", { target: "StripeEvent_pkey" }),
        "StripeEvent",
      ),
    ).toBe(true);
    expect(
      isUniqueViolationOn(
        knownError("P2002", { target: ["StripeEvent"] }),
        "StripeEvent",
      ),
    ).toBe(true);
  });

  it("rejects a different model and non-unique errors", () => {
    expect(
      isUniqueViolationOn(
        knownError("P2002", { modelName: "Booking", target: ["idempotencyKey"] }),
        "StripeEvent",
      ),
    ).toBe(false);
    expect(isUniqueViolationOn(knownError("P2034"), "StripeEvent")).toBe(
      false,
    );
  });
});
