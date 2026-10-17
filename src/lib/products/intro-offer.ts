import type { Prisma, ProductKind } from "@prisma/client";

import type { db as appDb } from "@/lib/db";

const INTRO_BLOCKING_KINDS: ProductKind[] = ["SINGLE_LESSON", "PACKAGE"];

const CANCELLED_BOOKING_STATUSES = [
  "CANCELLED_BY_STUDENT",
  "CANCELLED_BY_TEACHER",
  "EXPIRED_HOLD",
] as const;

type IntroDb = Pick<typeof appDb, "user" | "order" | "booking"> | Prisma.TransactionClient;

async function relatedUserIds(
  db: IntroDb,
  input: { userId: string; phone: string | null | undefined },
) {
  const phones = new Set<string>();
  if (input.phone?.trim()) phones.add(input.phone.trim());

  const self = await db.user.findUnique({
    where: { id: input.userId },
    select: { phone: true },
  });
  if (self?.phone) phones.add(self.phone);

  const userIds = new Set<string>([input.userId]);
  if (phones.size) {
    const matches = await db.user.findMany({
      where: { phone: { in: [...phones] } },
      select: { id: true },
    });
    for (const match of matches) userIds.add(match.id);
  }
  return [...userIds];
}

export async function hasPaidLessonOrPackage(
  db: IntroDb,
  input: { userId: string; phone: string | null | undefined },
) {
  const userIds = await relatedUserIds(db, input);
  const prior = await db.order.findFirst({
    where: {
      studentId: { in: userIds },
      status: "PAID",
      items: {
        some: {
          product: { kind: { in: INTRO_BLOCKING_KINDS } },
        },
      },
    },
    select: { id: true },
  });

  return Boolean(prior);
}

export async function hasBookedDrivingLesson(
  db: IntroDb,
  input: { userId: string; phone: string | null | undefined },
) {
  const userIds = await relatedUserIds(db, input);
  const prior = await db.booking.findFirst({
    where: {
      studentId: { in: userIds },
      status: { notIn: [...CANCELLED_BOOKING_STATUSES] },
    },
    select: { id: true },
  });
  return Boolean(prior);
}

export async function isIntroOfferEligible(
  db: IntroDb,
  input: { userId: string; phone: string | null | undefined },
) {
  if (await hasPaidLessonOrPackage(db, input)) return false;
  return !(await hasBookedDrivingLesson(db, input));
}
