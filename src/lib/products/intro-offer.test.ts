import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  hasBookedDrivingLesson,
  hasPaidLessonOrPackage,
  isIntroOfferEligible,
} from "./intro-offer";

type OrderFind = ReturnType<typeof vi.fn>;

function mockDb(overrides?: {
  userPhone?: string | null;
  phoneUsers?: { id: string }[];
  priorOrder?: { id: string } | null;
  priorBooking?: { id: string } | null;
}) {
  const findUnique = vi.fn(async () => ({
    phone: overrides?.userPhone ?? null,
  }));
  const findMany = vi.fn(async () => overrides?.phoneUsers ?? []);
  const findFirst: OrderFind = vi.fn(async () => overrides?.priorOrder ?? null);
  const bookingFindFirst = vi.fn(async () => overrides?.priorBooking ?? null);
  return {
    user: { findUnique, findMany },
    order: { findFirst },
    booking: { findFirst: bookingFindFirst },
  };
}

describe("intro offer eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows the first paid lesson for a new customer", async () => {
    const db = mockDb();
    await expect(
      isIntroOfferEligible(db as never, {
        userId: "user-1",
        phone: "+46701234567",
      }),
    ).resolves.toBe(true);
    await expect(
      hasPaidLessonOrPackage(db as never, {
        userId: "user-1",
        phone: "+46701234567",
      }),
    ).resolves.toBe(false);
  });

  it("blocks a second intro purchase for the same user", async () => {
    const db = mockDb({ priorOrder: { id: "order-1" } });
    await expect(
      isIntroOfferEligible(db as never, {
        userId: "user-1",
        phone: "+46701234567",
      }),
    ).resolves.toBe(false);
  });

  it("blocks a new account that shares a phone with a prior buyer", async () => {
    const db = mockDb({
      userPhone: null,
      phoneUsers: [{ id: "user-old" }, { id: "user-new" }],
      priorOrder: { id: "order-old" },
    });
    await expect(
      isIntroOfferEligible(db as never, {
        userId: "user-new",
        phone: "+46701234567",
      }),
    ).resolves.toBe(false);
    expect(db.user.findMany).toHaveBeenCalled();
    expect(db.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: { in: expect.arrayContaining(["user-new", "user-old"]) },
        }),
      }),
    );
  });

  it("blocks anyone who has booked a driving lesson", async () => {
    const db = mockDb({ priorBooking: { id: "booking-1" } });
    await expect(
      isIntroOfferEligible(db as never, {
        userId: "user-1",
        phone: "+46701234567",
      }),
    ).resolves.toBe(false);
    await expect(
      hasBookedDrivingLesson(db as never, {
        userId: "user-1",
        phone: "+46701234567",
      }),
    ).resolves.toBe(true);
    expect(db.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: {
            notIn: [
              "CANCELLED_BY_STUDENT",
              "CANCELLED_BY_TEACHER",
              "EXPIRED_HOLD",
            ],
          },
        }),
      }),
    );
  });
});
