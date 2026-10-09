import { apiError, errorResponse } from "@/lib/api/http";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const querySchema = z.object({}).strict();

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", 400);
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

  const user = await db.user.findFirst({
    where: { id: studentId, role: "STUDENT", deletedAt: null },
    select: {
      id: true,
      email: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      localePref: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
      studentProfile: {
        select: {
          korkortstillstand: true,
          preferredLanguages: true,
          preferredTransmission: true,
          defaultPickupAddress: true,
        },
      },
      bookings: {
        select: {
          id: true,
          teacherId: true,
          locationId: true,
          pickupAddress: true,
          startsAt: true,
          endsAt: true,
          status: true,
          creditCharged: true,
          cancelledAt: true,
          cancelReason: true,
          studentNote: true,
          createdAt: true,
        },
      },
      credits: {
        select: {
          id: true,
          delta: true,
          reason: true,
          bookingId: true,
          orderItemId: true,
          expiresAt: true,
          note: true,
          createdAt: true,
        },
      },
      orders: {
        select: {
          id: true,
          status: true,
          totalOre: true,
          vatOre: true,
          createdAt: true,
          paidAt: true,
          items: {
            select: {
              productId: true,
              quantity: true,
              unitPriceOre: true,
              vatRatePct: true,
              productNameSnapshot: true,
            },
          },
          payment: {
            select: {
              provider: true,
              method: true,
              amountOre: true,
              refundedOre: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
      theoryAccess: true,
      theoryAttempts: {
        select: {
          questionId: true,
          answerId: true,
          correct: true,
          sessionId: true,
          answeredAt: true,
        },
      },
      theoryExams: {
        select: {
          id: true,
          locale: true,
          startedAt: true,
          finishedAt: true,
          questionCount: true,
          correctCount: true,
          passed: true,
        },
      },
      courseBookings: {
        select: { id: true, occasionId: true, status: true, createdAt: true },
      },
      reviews: {
        select: {
          id: true,
          bookingId: true,
          rating: true,
          comment: true,
          published: true,
          createdAt: true,
        },
      },
    },
  });
  if (!user) {
    return errorResponse("ACCOUNT_NOT_FOUND", 404);
  }

  return Response.json(
    { exportedAt: new Date().toISOString(), user },
    {
      headers: {
        "content-disposition": 'attachment; filename="makina-data-export.json"',
        "cache-control": "private, no-store",
      },
    },
  );
}
