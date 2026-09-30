import { addDays, fromUnixTime } from "date-fns";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";

import { isUniqueViolationOn } from "@/lib/bookings/errors";
import { resolvePaidLessonHold } from "@/lib/bookings/hold";
import {
  CreditLockBusyError,
  lockBookingKeys,
  lockStudentCredits,
  studentLockKey,
} from "@/lib/bookings/locks";
import { getCreditBalance } from "@/lib/credits/ledger";
import {
  productGrantsCourseKind,
  resolvePaidCourseHold,
} from "@/lib/courses/entitlements";
import { db } from "@/lib/db";
import { bookingNotificationContext } from "@/lib/notifications/context";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { enqueueBookingNotifications, enqueueTeacherBookingNotification } from "@/lib/notifications/queue";
import {
  enqueueOrderReceipt,
  enqueuePaymentFailed,
} from "@/lib/notifications/queue";
import {
  normalizeStripeEvent,
  refundableUnusedCredits,
  shouldFulfillPayment,
  type NormalizedStripeEvent,
} from "@/lib/payments/stripe-events";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function configurationError() {
  return Response.json(
    {
      error: {
        code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
        message: "PAYMENT_PROVIDER_NOT_CONFIGURED",
      },
    },
    { status: 503 },
  );
}

function internalCheckoutUrl(locale: string, orderId: string) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let base: URL;
  try {
    base = new URL(configured);
  } catch {
    base = new URL("http://localhost:3000");
  }
  if (!["http:", "https:"].includes(base.protocol)) {
    base = new URL("http://localhost:3000");
  }

  return new URL(
    `/${encodeURIComponent(locale)}/checkout/${encodeURIComponent(orderId)}`,
    base.origin,
  ).toString();
}

function orderStatusUrl(locale: string, orderId: string) {
  return internalCheckoutUrl(locale, orderId).replace(
    `/${encodeURIComponent(locale)}/checkout/`,
    `/${encodeURIComponent(locale)}/mina-sidor/betalningar/`,
  );
}

function stripeNotificationId(
  eventId: string,
  template:
    | "order_receipt"
    | "payment_failed"
    | "lesson_payment_needs_rebooking"
    | "course_payment_needs_rebooking"
    | "booking_confirmed"
    | "teacher_booking_new",
  channel: "SMS" | "INAPP" = "INAPP",
) {
  return `stripe:${eventId}:${template}:${channel}`;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return configurationError();
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json(
      {
        error: {
          code: "INVALID_WEBHOOK_SIGNATURE",
          message: "INVALID_WEBHOOK_SIGNATURE",
        },
      },
      { status: 400 },
    );
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      raw,
      signature,
      webhookSecret,
    );
  } catch {
    return Response.json(
      {
        error: {
          code: "INVALID_WEBHOOK_SIGNATURE",
          message: "INVALID_WEBHOOK_SIGNATURE",
        },
      },
      { status: 400 },
    );
  }

  return processVerifiedStripeEvent(event);
}

async function studentIdForCreditLock(
  normalized: NormalizedStripeEvent | null,
) {
  if (normalized?.kind === "charge_refunded" && normalized.paymentIntentId) {
    const payment = await db.payment.findUnique({
      where: { stripePaymentIntentId: normalized.paymentIntentId },
      select: { order: { select: { studentId: true } } },
    });
    return payment?.order.studentId ?? null;
  }
  if (normalized?.kind === "payment_succeeded" && normalized.bookingId) {
    const order = await db.order.findUnique({
      where: { id: normalized.orderId },
      select: { studentId: true },
    });
    return order?.studentId ?? null;
  }
  return null;
}

export async function processVerifiedStripeEvent(
  event: Stripe.Event,
  receivedAt = new Date(),
) {
  const eventTime = fromUnixTime(event.created);
  const normalized = normalizeStripeEvent(event);
  let notificationIds: string[] = [];
  const replayNotificationIds =
    normalized?.kind === "payment_succeeded"
      ? [
          stripeNotificationId(event.id, "order_receipt"),
          stripeNotificationId(
            event.id,
            "lesson_payment_needs_rebooking",
          ),
          stripeNotificationId(
            event.id,
            "lesson_payment_needs_rebooking",
            "INAPP",
          ),
          stripeNotificationId(
            event.id,
            "course_payment_needs_rebooking",
          ),
          stripeNotificationId(
            event.id,
            "course_payment_needs_rebooking",
            "INAPP",
          ),
        ]
      : normalized?.kind === "payment_failed"
        ? [stripeNotificationId(event.id, "payment_failed")]
        : [];

  const creditStudentId = await studentIdForCreditLock(normalized);

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      notificationIds = await db.$transaction(
      async (tx) => {
        if (creditStudentId) {
          await lockStudentCredits(tx, creditStudentId);
        }
        const queuedNotificationIds: string[] = [];
        await tx.stripeEvent.create({
          data: { id: event.id, type: event.type },
        });

        if (normalized?.kind === "payment_succeeded") {
          const order = await tx.order.findUnique({
            where: { id: normalized.orderId },
            include: {
              payment: true,
              student: { select: { localePref: true } },
              items: {
                include: {
                  product: true,
                  courseBookings: {
                    include: {
                      occasion: {
                        include: { course: true },
                      },
                    },
                  },
                },
              },
            },
          });
          if (!order?.payment) {
            throw new Error("ORDER_NOT_FOUND");
          }
          if (
            (normalized.amountOre !== null &&
              normalized.amountOre !== order.totalOre) ||
            (order.payment.stripePaymentIntentId &&
              normalized.paymentIntentId !==
                order.payment.stripePaymentIntentId) ||
            (order.payment.stripeCheckoutSessionId &&
              normalized.checkoutSessionId &&
              normalized.checkoutSessionId !==
                order.payment.stripeCheckoutSessionId)
          ) {
            throw new Error("PAYMENT_ORDER_MISMATCH");
          }
          if (
            !shouldFulfillPayment({
              orderStatus: order.status,
              paymentStatus: order.payment.status,
            })
          ) {
            return queuedNotificationIds;
          }

          await tx.order.update({
            where: { id: order.id },
            data: { status: "PAID", paidAt: eventTime },
          });
          await tx.payment.update({
            where: { orderId: order.id },
            data: {
              status: "SUCCEEDED",
              ...(normalized.checkoutSessionId
                ? {
                    stripeCheckoutSessionId:
                      normalized.checkoutSessionId,
                  }
                : {}),
              ...(normalized.paymentIntentId
                ? {
                    stripePaymentIntentId:
                      normalized.paymentIntentId,
                  }
                : {}),
              ...(normalized.method
                ? { method: normalized.method }
                : {}),
            },
          });

          for (const item of order.items) {
            const credits = item.product.lessonCredits * item.quantity;
            if (credits > 0) {
              await tx.creditTransaction.create({
                data: {
                  studentId: order.studentId,
                  delta: credits,
                  reason: "PURCHASE",
                  orderItemId: item.id,
                  expiresAt: addDays(
                    eventTime,
                    item.product.creditValidDays,
                  ),
                },
              });
            }

            if (item.product.includesTheory) {
              await tx.theoryAccess.create({
                data: {
                  studentId: order.studentId,
                  grantedAt: eventTime,
                  expiresAt: null,
                  sourceOrderItemId: item.id,
                },
              });
            }

            for (const courseBooking of item.courseBookings) {
              const occasion = courseBooking.occasion;
              await tx.$executeRaw`
                SELECT pg_advisory_xact_lock(
                  hashtext(${"course-occasion:" + occasion.id})
                )
              `;
              const holdMinutes = Math.max(
                1,
                Number.parseInt(
                  process.env.BOOKING_HOLD_MINUTES ?? "15",
                  10,
                ) || 15,
              );
              const holdExpiresAt = new Date(
                courseBooking.createdAt.getTime() +
                  holdMinutes * 60_000,
              );
              const matchingItem = productGrantsCourseKind(
                {
                  productId: item.productId,
                  includesRisk1: item.product.includesRisk1,
                  includesRisk2: item.product.includesRisk2,
                },
                occasion.course.productId,
                occasion.course.kind,
              );
              const occupied = await tx.courseBooking.count({
                where: {
                  occasionId: occasion.id,
                  OR: [
                    { status: { in: ["CONFIRMED", "COMPLETED"] } },
                    {
                      status: "PENDING_PAYMENT",
                      createdAt: {
                        gt: new Date(
                          receivedAt.getTime() -
                            holdMinutes * 60_000,
                        ),
                      },
                    },
                  ],
                },
              });
              const holdResolution = resolvePaidCourseHold({
                status: courseBooking.status,
                matchesEntitlement: matchingItem,
                occasionCancelled: occasion.cancelled,
                occasionStartsAt: occasion.startsAt,
                holdExpiresAt,
                receivedAt,
                occupiedSeats: occupied,
                capacity: occasion.capacity,
              });
              if (holdResolution === "CONFIRM") {
                await tx.courseBooking.update({
                  where: { id: courseBooking.id },
                  data: { status: "CONFIRMED" },
                });
              } else if (holdResolution === "REBOOK") {
                if (courseBooking.status === "PENDING_PAYMENT") {
                  await tx.courseBooking.update({
                    where: { id: courseBooking.id },
                    data: { status: "EXPIRED_HOLD" },
                  });
                }
                const coursesUrl = new URL(
                  `/${encodeURIComponent(order.student.localePref)}/kurser`,
                  new URL(
                    process.env.NEXT_PUBLIC_SITE_URL ??
                      "http://localhost:3000",
                  ).origin,
                ).toString();
                for (const channel of ["SMS", "INAPP"] as const) {
                  const notification =
                    await tx.notification.create({
                      data: {
                        id: stripeNotificationId(
                          event.id,
                          "course_payment_needs_rebooking",
                          channel,
                        ),
                        userId: order.studentId,
                        channel,
                        template:
                          "course_payment_needs_rebooking",
                        locale: order.student.localePref,
                        payload: {
                          orderId: order.id,
                          coursesUrl,
                        },
                        sendAfter: eventTime,
                      },
                      select: { id: true },
                    });
                  queuedNotificationIds.push(notification.id);
                }
              }
            }
          }

          const bookingId = normalized.bookingId;
          if (bookingId) {
            const heldBooking = await tx.booking.findUnique({
              where: { id: bookingId },
            });
            await lockBookingKeys(tx, [studentLockKey(order.studentId)]);
            const availableBalance = await getCreditBalance(
              tx,
              order.studentId,
              receivedAt,
            );
            const holdResolution = resolvePaidLessonHold({
              booking: heldBooking,
              studentId: order.studentId,
              availableBalance,
              now: receivedAt,
            });
            if (heldBooking && holdResolution === "CONFIRM") {
              const converted = await tx.booking.updateMany({
                where: {
                  id: heldBooking.id,
                  status: "CONFIRMED",
                  creditCharged: false,
                  holdExpiresAt: { gt: receivedAt },
                },
                data: { creditCharged: true, holdExpiresAt: null },
              });
              if (converted.count === 1) {
                await tx.creditTransaction.create({
                  data: {
                    studentId: order.studentId,
                    bookingId: heldBooking.id,
                    delta: -1,
                    reason: "BOOKING_CONSUMED",
                  },
                });
                const context = await bookingNotificationContext(
                  tx,
                  heldBooking.id,
                );
                queuedNotificationIds.push(
                  ...(await enqueueBookingNotifications(tx, {
                    userId: order.studentId,
                    locale: order.student.localePref,
                    template: "booking_confirmed",
                    bookingId: heldBooking.id,
                    startsAt: heldBooking.startsAt,
                    teacherFirstName: context.teacherFirstName,
                    placeLabel: context.placeLabel,
                    schoolPhone: context.schoolPhone,
                    now: eventTime,
                    ids: {
                      SMS: stripeNotificationId(
                        event.id,
                        "booking_confirmed",
                        "SMS",
                      ),
                      INAPP: stripeNotificationId(
                        event.id,
                        "booking_confirmed",
                        "INAPP",
                      ),
                    },
                  })),
                  await enqueueTeacherBookingNotification(tx, {
                    id: stripeNotificationId(
                      event.id,
                      "teacher_booking_new",
                    ),
                    userId: context.teacherUserId,
                    locale: context.teacherLocale,
                    template: "teacher_booking_new",
                    bookingId: heldBooking.id,
                    startsAt: heldBooking.startsAt,
                    studentFirstName: context.studentFirstName,
                    placeLabel: context.placeLabel,
                    now: eventTime,
                  }),
                );
              }
            } else if (heldBooking && holdResolution === "REBOOK") {
              await tx.booking.updateMany({
                where: {
                  id: heldBooking.id,
                  status: "CONFIRMED",
                  creditCharged: false,
                },
                data: {
                  status: "EXPIRED_HOLD",
                  cancelledAt: receivedAt,
                  cancelReason: "PAYMENT_SUCCEEDED_AFTER_HOLD_EXPIRED",
                  holdExpiresAt: null,
                },
              });
              const bookingUrl = new URL(
                `/${encodeURIComponent(order.student.localePref)}/boka`,
                new URL(
                  process.env.NEXT_PUBLIC_SITE_URL ??
                    "http://localhost:3000",
                ).origin,
              ).toString();
              for (const channel of ["SMS", "INAPP"] as const) {
                const notification =
                  await tx.notification.create({
                    data: {
                      id: stripeNotificationId(
                        event.id,
                        "lesson_payment_needs_rebooking",
                        channel,
                      ),
                      userId: order.studentId,
                      channel,
                      template:
                        "lesson_payment_needs_rebooking",
                      locale: order.student.localePref,
                      payload: { orderId: order.id, bookingUrl },
                      sendAfter: eventTime,
                    },
                    select: { id: true },
                  });
                queuedNotificationIds.push(notification.id);
              }
            }
          }

          queuedNotificationIds.push(
            await enqueueOrderReceipt(tx, {
              notificationId: stripeNotificationId(
                event.id,
                "order_receipt",
              ),
              userId: order.studentId,
              locale: order.student.localePref,
              payload: {
                orderId: order.id,
                items: order.items.map((item) => ({
                  productName: item.productNameSnapshot,
                  quantity: item.quantity,
                })),
                totalOre: order.totalOre,
                vatOre: order.vatOre,
                statusUrl: orderStatusUrl(
                  order.student.localePref,
                  order.id,
                ),
              },
              now: eventTime,
            }),
          );
        }

        if (normalized?.kind === "payment_failed") {
          const payment = await tx.payment.findFirst({
            where: {
              status: { in: ["PENDING", "FAILED"] },
              OR: [
                {
                  stripePaymentIntentId:
                    normalized.paymentIntentId,
                },
                ...(normalized.orderId
                  ? [{ orderId: normalized.orderId }]
                  : []),
              ],
            },
            include: {
              order: {
                include: {
                  student: { select: { localePref: true } },
                },
              },
            },
          });
          if (payment) {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: "FAILED",
                stripePaymentIntentId:
                  normalized.paymentIntentId,
              },
            });
            queuedNotificationIds.push(
              await enqueuePaymentFailed(tx, {
                notificationId: stripeNotificationId(
                  event.id,
                  "payment_failed",
                ),
                userId: payment.order.studentId,
                locale: payment.order.student.localePref,
                payload: {
                  orderId: payment.orderId,
                  resumeUrl: internalCheckoutUrl(
                    payment.order.student.localePref,
                    payment.orderId,
                  ),
                },
                now: eventTime,
              }),
            );
          }
        }

        if (event.type === "charge.refunded") {
          const charge = event.data.object;
          const paymentIntentId =
            typeof charge.payment_intent === "string"
              ? charge.payment_intent
              : charge.payment_intent?.id;
          if (!paymentIntentId) {
            throw new Error("PAYMENT_INTENT_MISSING");
          }

          const payment = await tx.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
            include: {
              order: {
                include: {
                  items: {
                    include: {
                      product: true,
                      courseBookings: {
                        include: {
                          occasion: { select: { startsAt: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          });
          if (!payment) {
            throw new Error("PAYMENT_NOT_FOUND");
          }

          const refundedOre = Math.min(
            charge.amount_refunded,
            payment.amountOre,
          );
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              refundedOre,
              status:
                refundedOre >= payment.amountOre
                  ? "REFUNDED"
                  : "SUCCEEDED",
            },
          });
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              status:
                refundedOre >= payment.amountOre
                  ? "REFUNDED"
                  : "PARTIALLY_REFUNDED",
            },
          });

          await lockBookingKeys(tx, [
            studentLockKey(payment.order.studentId),
          ]);
          for (const item of payment.order.items) {
            const purchasedCredits =
              item.product.lessonCredits * item.quantity;
            const desiredReversal = Math.floor(
              (purchasedCredits * refundedOre) / payment.amountOre,
            );
            const refundedCredits = await tx.creditTransaction.findMany({
              where: {
                orderItemId: item.id,
                reason: "PAYMENT_REFUND",
              },
              select: { delta: true },
            });
            const reversedAlready = -refundedCredits.reduce(
              (sum, credit) => sum + credit.delta,
              0,
            );
            const availableBalance = await getCreditBalance(
              tx,
              payment.order.studentId,
              eventTime,
            );
            const creditsToReverse = refundableUnusedCredits({
              desiredReversal,
              reversedAlready,
              availableBalance,
            });

            if (creditsToReverse > 0) {
              await tx.creditTransaction.create({
                data: {
                  studentId: payment.order.studentId,
                  orderItemId: item.id,
                  delta: -creditsToReverse,
                  reason: "PAYMENT_REFUND",
                  note: `Stripe refund event ${event.id}`,
                },
              });
            }

            if (refundedOre >= payment.amountOre) {
              for (const courseBooking of item.courseBookings) {
                if (
                  courseBooking.status === "CONFIRMED" &&
                  courseBooking.occasion.startsAt > eventTime
                ) {
                  await tx.courseBooking.update({
                    where: { id: courseBooking.id },
                    data: { status: "CANCELLED_BY_STUDENT" },
                  });
                  await tx.auditLog.create({
                    data: {
                      action: "course_booking.refund_revoke",
                      entityType: "CourseBooking",
                      entityId: courseBooking.id,
                      before: { status: "CONFIRMED" },
                      after: {
                        status: "CANCELLED_BY_STUDENT",
                        stripeEventId: event.id,
                      },
                    },
                  });
                }
              }
            }
          }
        }

        return queuedNotificationIds;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      break;
    } catch (error) {
      if (
        error instanceof CreditLockBusyError ||
        (error instanceof Error && error.message === "CREDIT_LOCK_BUSY")
      ) {
        if (attempt === 20) throw error;
        await new Promise((resolve) => setTimeout(resolve, 25));
        continue;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        isUniqueViolationOn(error, "StripeEvent")
      ) {
        notificationIds = replayNotificationIds;
        break;
      }
      throw error;
    }
  }

  await dispatchNotifications(notificationIds, eventTime);
  return new Response(null, { status: 200 });
}
