import { z } from "zod";

import { auth } from "@/auth";
import { authorizationError, errorResponse, invalidInput } from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { checkoutHoldError } from "@/lib/bookings/hold";
import { db } from "@/lib/db";
import { createPaymentIntentForOrder } from "@/lib/payments/payment-intents";
import { stripeIsConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
  bookingId: z.string().cuid().optional(),
  termsAccepted: z.literal(true),
  withdrawalAcknowledged: z.literal(true),
}).strict();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  let session;
  try {
    session = requireRole(await auth(), ["STUDENT"]);
  } catch (error) {
    return authorizationError(error);
  }
  const now = new Date();
  const student = await db.user.findUnique({
    where: { id: session.user.id },
    select: { localePref: true },
  });
  if (!student) {
    return errorResponse("UNAUTHENTICATED", 401);
  }

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId },
    include: { translations: true },
  });
  if (
    !product?.active ||
    product.kind === "TEST_LESSON" ||
    (product.kind === "THEORY_ACCESS" && process.env.THEORY_MODE !== "full")
  ) {
    return errorResponse("PRODUCT_INACTIVE", 409);
  }
  if (parsed.data.bookingId && product.lessonCredits < 1) {
    return errorResponse("INVALID_INPUT", 400);
  }

  if (parsed.data.bookingId) {
    const booking = await db.booking.findUnique({
      where: { id: parsed.data.bookingId },
      select: {
        studentId: true,
        status: true,
        creditCharged: true,
        holdExpiresAt: true,
      },
    });
    const holdError = checkoutHoldError(booking, session.user.id, now);
    if (holdError) {
      return errorResponse(
        holdError,
        holdError === "BOOKING_NOT_FOUND" ? 404 : 409,
      );
    }
  }

  if (!stripeIsConfigured() && process.env.NODE_ENV === "production") {
    return errorResponse("PAYMENT_PROVIDER_NOT_CONFIGURED", 503);
  }

  const translation =
    product.translations.find(
      (item) => item.locale === student.localePref,
    ) ??
    product.translations.find((item) => item.locale === "sv") ??
    product.translations[0];
  if (!translation) {
    return errorResponse("PRODUCT_TRANSLATION_MISSING", 409);
  }

  const totalOre = product.priceOre * parsed.data.quantity;
  const vatOre = Math.round(
    (totalOre * product.vatRatePct) / (100 + product.vatRatePct),
  );

  const order = await db.order.create({
    data: {
      studentId: session.user.id,
      totalOre,
      vatOre,
      items: {
        create: {
          productId: product.id,
          quantity: parsed.data.quantity,
          unitPriceOre: product.priceOre,
          vatRatePct: product.vatRatePct,
          productNameSnapshot: translation.name,
        },
      },
      payment: {
        create: {
          amountOre: totalOre,
        },
      },
    },
    include: { payment: true },
  });

  try {
    const paymentIntent = await createPaymentIntentForOrder(order.id, {
      bookingId: parsed.data.bookingId,
    });
    return Response.json({
      url: paymentIntent.url,
      status: paymentIntent.mock ? "MOCK" : "PENDING_PAYMENT",
    });
  } catch {
    return errorResponse("PAYMENT_PROVIDER_ERROR", 502);
  }
}
