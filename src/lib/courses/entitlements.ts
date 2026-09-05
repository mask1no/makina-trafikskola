import type {
  BookingStatus,
  CourseKind,
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

export type CourseEntitlement = {
  productId: string;
  quantity: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus | null;
  refundedOre: number;
  includesRisk1: boolean;
  includesRisk2: boolean;
  redeemedKinds: CourseKind[];
};

export function productGrantsCourseKind(
  item: Pick<
    CourseEntitlement,
    "productId" | "includesRisk1" | "includesRisk2"
  >,
  courseProductId: string,
  kind: CourseKind,
) {
  return (
    item.productId === courseProductId ||
    (kind === "RISK1" && item.includesRisk1) ||
    (kind === "RISK2" && item.includesRisk2)
  );
}

export function remainingCourseEntitlements(
  item: CourseEntitlement,
  courseProductId: string,
  kind: CourseKind,
) {
  if (
    item.orderStatus !== "PAID" ||
    item.paymentStatus !== "SUCCEEDED" ||
    item.refundedOre !== 0 ||
    item.quantity < 1 ||
    !productGrantsCourseKind(item, courseProductId, kind)
  ) {
    return 0;
  }

  const usedForKind = item.redeemedKinds.filter(
    (redeemedKind) => redeemedKind === kind,
  ).length;
  return Math.max(0, item.quantity - usedForKind);
}

export function courseBookingOccupiesSeat(
  booking: {
    status: BookingStatus;
    createdAt: Date;
  },
  now: Date,
  holdMinutes: number,
) {
  if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
    return true;
  }
  return (
    booking.status === "PENDING_PAYMENT" &&
    booking.createdAt.getTime() + holdMinutes * 60_000 > now.getTime()
  );
}

export function resolvePaidCourseHold(input: {
  status: BookingStatus;
  matchesEntitlement: boolean;
  occasionCancelled: boolean;
  occasionStartsAt: Date;
  holdExpiresAt: Date;
  receivedAt: Date;
  occupiedSeats: number;
  capacity: number;
}) {
  if (
    input.status === "PENDING_PAYMENT" &&
    input.matchesEntitlement &&
    !input.occasionCancelled &&
    input.occasionStartsAt > input.receivedAt &&
    input.holdExpiresAt > input.receivedAt &&
    input.occupiedSeats <= input.capacity
  ) {
    return "CONFIRM" as const;
  }
  if (
    input.status === "PENDING_PAYMENT" ||
    input.status === "EXPIRED_HOLD"
  ) {
    return "REBOOK" as const;
  }
  return "IGNORE" as const;
}
