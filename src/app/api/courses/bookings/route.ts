import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import {
  apiError,
  authorizationError,
  invalidInput,
} from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { remainingCourseEntitlements } from "@/lib/courses/entitlements";
import { db } from "@/lib/db";
import { createPaymentIntentForOrder } from "@/lib/payments/payment-intents";
import { stripeIsConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

const bookingSchema = z
  .object({
    occasionId: z.string().cuid(),
    termsAccepted: z.literal(true),
    withdrawalAcknowledged: z.literal(true),
  })
  .strict();

const holdMinutes = Math.max(
  1,
  Number.parseInt(process.env.BOOKING_HOLD_MINUTES ?? "15", 10) || 15,
);

class CourseBookingError extends Error {}

export async function POST(request: Request) {
  const parsed = bookingSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  let studentId: string;
  try {
    studentId = requireRole(await auth(), ["STUDENT"]).user.id;
  } catch (error) {
    return authorizationError(error);
  }

  const student = await db.user.findFirst({
    where: { id: studentId, role: "STUDENT", deletedAt: null },
    select: { id: true, localePref: true },
  });
  if (!student) return apiError("STUDENT_NOT_FOUND", 404);
  if (!stripeIsConfigured() && process.env.NODE_ENV === "production") {
    return apiError("PAYMENT_PROVIDER_NOT_CONFIGURED", 503);
  }

  const now = new Date();
  const holdCutoff = new Date(now.getTime() - holdMinutes * 60_000);

  try {
    const result = await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(${"course-occasion:" + parsed.data.occasionId})
          )
        `;

        const existing = await tx.courseBooking.findUnique({
          where: {
            occasionId_studentId: {
              occasionId: parsed.data.occasionId,
              studentId,
            },
          },
        });
        if (
          existing?.status === "CONFIRMED" ||
          existing?.status === "COMPLETED"
        ) {
          throw new CourseBookingError("COURSE_ALREADY_BOOKED");
        }

        if (existing?.status === "PENDING_PAYMENT") {
          const pendingPayment = existing.sourceOrderItemId
            ? await tx.payment.findFirst({
                where: {
                  order: {
                    items: {
                      some: { id: existing.sourceOrderItemId },
                    },
                  },
                },
                select: {
                  status: true,
                  orderId: true,
                  stripePaymentIntentId: true,
                },
              })
            : null;
          if (
            existing.createdAt > holdCutoff &&
            pendingPayment &&
            ["PENDING", "FAILED"].includes(pendingPayment.status) &&
            (pendingPayment.stripePaymentIntentId ||
              !stripeIsConfigured())
          ) {
            return {
              type: "existing" as const,
              bookingId: existing.id,
              orderId: pendingPayment.orderId,
              locale: student.localePref,
            };
          }
          await tx.courseBooking.update({
            where: { id: existing.id },
            data: { status: "EXPIRED_HOLD" },
          });
        }

        const occasion = await tx.courseOccasion.findFirst({
          where: {
            id: parsed.data.occasionId,
            cancelled: false,
            startsAt: { gt: now },
          },
          select: {
            id: true,
            capacity: true,
            course: {
              select: {
                kind: true,
                productId: true,
                product: {
                  include: { translations: true },
                },
              },
            },
          },
        });
        if (!occasion) {
          throw new CourseBookingError("COURSE_OCCASION_NOT_FOUND");
        }

        const occupied = await tx.courseBooking.count({
          where: {
            occasionId: occasion.id,
            OR: [
              { status: { in: ["CONFIRMED", "COMPLETED"] } },
              {
                status: "PENDING_PAYMENT",
                createdAt: { gt: holdCutoff },
              },
            ],
          },
        });
        if (occupied >= occasion.capacity) {
          throw new CourseBookingError("COURSE_FULL");
        }

        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(
              ${"course-entitlement:" + studentId + ":" + occasion.course.kind}
            )
          )
        `;

        const candidates = await tx.orderItem.findMany({
          where: {
            order: {
              studentId,
              status: "PAID",
              payment: {
                is: { status: "SUCCEEDED", refundedOre: 0 },
              },
            },
            OR: [
              { productId: occasion.course.productId },
              ...(occasion.course.kind === "RISK1"
                ? [{ product: { includesRisk1: true } }]
                : []),
              ...(occasion.course.kind === "RISK2"
                ? [{ product: { includesRisk2: true } }]
                : []),
            ],
          },
          orderBy: { order: { paidAt: "asc" } },
          include: {
            order: { select: { status: true, payment: true } },
            product: true,
            courseBookings: {
              where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
              select: {
                occasion: { select: { course: { select: { kind: true } } } },
              },
            },
          },
        });

        const entitlement = candidates.find(
          (item) =>
            remainingCourseEntitlements(
              {
                productId: item.productId,
                quantity: item.quantity,
                orderStatus: item.order.status,
                paymentStatus: item.order.payment?.status ?? null,
                refundedOre: item.order.payment?.refundedOre ?? 0,
                includesRisk1: item.product.includesRisk1,
                includesRisk2: item.product.includesRisk2,
                redeemedKinds: item.courseBookings.map(
                  (booking) => booking.occasion.course.kind,
                ),
              },
              occasion.course.productId,
              occasion.course.kind,
            ) > 0,
        );

        if (entitlement) {
          const booking = existing
            ? await tx.courseBooking.update({
                where: { id: existing.id },
                data: {
                  status: "CONFIRMED",
                  sourceOrderItemId: entitlement.id,
                  createdAt: now,
                },
              })
            : await tx.courseBooking.create({
                data: {
                  occasionId: occasion.id,
                  studentId,
                  status: "CONFIRMED",
                  sourceOrderItemId: entitlement.id,
                },
              });
          return { type: "confirmed" as const, bookingId: booking.id };
        }

        const product = occasion.course.product;
        if (!product.active || product.kind !== "COURSE_SEAT") {
          throw new CourseBookingError("PRODUCT_INACTIVE");
        }
        const translation =
          product.translations.find(
            (item) => item.locale === student.localePref,
          ) ??
          product.translations.find((item) => item.locale === "sv") ??
          product.translations[0];
        if (!translation) {
          throw new CourseBookingError("PRODUCT_TRANSLATION_MISSING");
        }

        const totalOre = product.priceOre;
        const vatOre = Math.round(
          (totalOre * product.vatRatePct) / (100 + product.vatRatePct),
        );
        const order = await tx.order.create({
          data: {
            studentId,
            totalOre,
            vatOre,
            items: {
              create: {
                productId: product.id,
                quantity: 1,
                unitPriceOre: product.priceOre,
                vatRatePct: product.vatRatePct,
                productNameSnapshot: translation.name,
              },
            },
            payment: { create: { amountOre: totalOre } },
          },
          include: { items: true },
        });
        const orderItem = order.items[0];
        if (!orderItem) throw new Error("ORDER_ITEM_NOT_CREATED");

        const booking = existing
          ? await tx.courseBooking.update({
              where: { id: existing.id },
              data: {
                status: "PENDING_PAYMENT",
                sourceOrderItemId: orderItem.id,
                createdAt: now,
              },
            })
          : await tx.courseBooking.create({
              data: {
                occasionId: occasion.id,
                studentId,
                status: "PENDING_PAYMENT",
                sourceOrderItemId: orderItem.id,
              },
            });

        return {
          type: "checkout" as const,
          bookingId: booking.id,
          orderId: order.id,
          locale: student.localePref,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (result.type === "confirmed") {
      return Response.json(
        { bookingId: result.bookingId, status: "CONFIRMED" },
        { status: 201 },
      );
    }

    if (result.type === "existing") {
      return Response.json({
        bookingId: result.bookingId,
        status: "PENDING_PAYMENT",
        url: `/${encodeURIComponent(result.locale)}/checkout/${encodeURIComponent(result.orderId)}`,
      });
    }

    try {
      const paymentIntent = await createPaymentIntentForOrder(
        result.orderId,
        {
          courseBookingId: result.bookingId,
        },
      );
      return Response.json(
        {
          bookingId: result.bookingId,
          status: paymentIntent.mock ? "MOCK" : "PENDING_PAYMENT",
          url: paymentIntent.url,
        },
        { status: 201 },
      );
    } catch {
      // Shared PaymentIntent creation marks both money records failed and
      // releases the course hold before control returns here.
      return apiError("PAYMENT_PROVIDER_ERROR", 502);
    }
  } catch (error) {
    if (
      error instanceof CourseBookingError &&
      error.message === "COURSE_OCCASION_NOT_FOUND"
    ) {
      return apiError("COURSE_OCCASION_NOT_FOUND", 404);
    }
    if (
      (error instanceof CourseBookingError &&
        ["COURSE_FULL", "COURSE_ALREADY_BOOKED"].includes(error.message)) ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034")
    ) {
      return apiError(
        error instanceof CourseBookingError
          ? error.message
          : "COURSE_FULL",
        409,
      );
    }
    if (
      error instanceof CourseBookingError &&
      ["PRODUCT_INACTIVE", "PRODUCT_TRANSLATION_MISSING"].includes(
        error.message,
      )
    ) {
      return apiError(error.message, 409);
    }
    throw error;
  }
}
