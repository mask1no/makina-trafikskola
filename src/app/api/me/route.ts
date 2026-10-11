import { invalidInput, apiError, errorResponse } from "@/lib/api/http";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { consumeOtp } from "@/lib/auth/otp-store";
import { db } from "@/lib/db";
import { getStripe, stripeIsConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

const deleteSchema = z
  .object({
    confirm: z.literal("DELETE"),
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  let studentId: string;
  try {
    studentId = requireRole(await auth(), ["STUDENT"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return apiError(error.code, error.status);
    }
    throw error;
  }

  const now = new Date();
  const user = await db.user.findFirst({
    where: { id: studentId, role: "STUDENT", deletedAt: null },
    select: {
      id: true,
      phone: true,
      _count: {
        select: {
          bookings: {
            where: { status: "CONFIRMED", startsAt: { gt: now } },
          },
          courseBookings: {
            where: {
              status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
              occasion: { startsAt: { gt: now }, cancelled: false },
            },
          },
        },
      },
      orders: {
        where: {
          status: "PENDING",
          payment: {
            is: {
              status: "PENDING",
              stripePaymentIntentId: { not: null },
            },
          },
        },
        select: {
          id: true,
          payment: { select: { stripePaymentIntentId: true } },
        },
      },
    },
  });
  if (!user) {
    return errorResponse("ACCOUNT_NOT_FOUND", 404);
  }
  if (
    user._count.bookings > 0 ||
    user._count.courseBookings > 0
  ) {
    return errorResponse("ACCOUNT_HAS_ACTIVE_BOOKINGS", 409);
  }
  if (
    !user.phone ||
    !(await consumeOtp(user.phone, parsed.data.code, now))
  ) {
    return errorResponse("INVALID_OTP", 401);
  }

  if (user.orders.length && !stripeIsConfigured()) {
    return errorResponse("PAYMENT_PROVIDER_NOT_CONFIGURED", 503);
  }
  for (const order of user.orders) {
    const intentId = order.payment?.stripePaymentIntentId;
    if (!intentId) continue;
    try {
      const intent = await getStripe().paymentIntents.retrieve(intentId);
      if (["succeeded", "processing"].includes(intent.status)) {
        return errorResponse("ACCOUNT_HAS_ACTIVE_BOOKINGS", 409);
      }
      if (intent.status !== "canceled") {
        await getStripe().paymentIntents.cancel(intent.id);
      }
    } catch {
      return errorResponse("PAYMENT_PROVIDER_ERROR", 502);
    }
  }

  await db.$transaction(
    async (tx) => {
      const pendingOrderIds = user.orders.map((order) => order.id);
      if (pendingOrderIds.length) {
        await tx.payment.updateMany({
          where: { orderId: { in: pendingOrderIds }, status: "PENDING" },
          data: { status: "FAILED" },
        });
        await tx.order.updateMany({
          where: { id: { in: pendingOrderIds }, status: "PENDING" },
          data: { status: "FAILED" },
        });
      }
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: null,
          phone: null,
          googleSub: null,
          emailVerifiedAt: null,
          phoneVerifiedAt: null,
          passwordHash: null,
          identityVerifiedAt: null,
          firstName: "Deleted",
          lastName: `User-${user.id.slice(-8)}`,
          deletedAt: now,
        },
      });
      await tx.studentProfile.updateMany({
        where: { userId: user.id },
        data: {
          defaultPickupAddress: null,
          defaultPickupLat: null,
          defaultPickupLng: null,
          notes: null,
          preferredLanguages: [],
          preferredTransmission: null,
        },
      });
      await tx.booking.updateMany({
        where: { studentId: user.id },
        data: {
          pickupAddress: null,
          pickupLat: null,
          pickupLng: null,
          studentNote: null,
        },
      });
      await tx.review.updateMany({
        where: { studentId: user.id },
        data: { comment: null, published: false },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "user.anonymize",
          entityType: "User",
          entityId: user.id,
          before: { anonymized: false },
          after: { deletedAt: now.toISOString(), anonymized: true },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return new Response(null, { status: 204 });
}
