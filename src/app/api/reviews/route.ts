import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import {
  apiError,
  authorizationError,
  invalidInput,
} from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { allowRateLimitedAction } from "@/lib/auth/otp-store";
import { db } from "@/lib/db";

const reviewSchema = z
  .object({
    bookingId: z.string().cuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(2000).optional(),
  })
  .strict();

export async function POST(request: Request) {
  const parsed = reviewSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  let studentId: string;
  try {
    studentId = requireRole(await auth(), ["STUDENT"]).user.id;
  } catch (error) {
    return authorizationError(error);
  }

  const booking = await db.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: {
      id: true,
      studentId: true,
      teacherId: true,
      status: true,
      review: { select: { id: true } },
    },
  });
  if (!booking || booking.studentId !== studentId) {
    return apiError("BOOKING_NOT_FOUND", 404);
  }
  if (booking.status !== "COMPLETED") {
    return apiError("BOOKING_NOT_COMPLETED", 409);
  }
  if (booking.review) return apiError("REVIEW_EXISTS", 409);

  const now = new Date();
  const configuredLimit = Number(process.env.REVIEW_RATE_LIMIT ?? "5");
  const limit =
    Number.isInteger(configuredLimit) && configuredLimit > 0
      ? configuredLimit
      : 5;
  if (
    !(await allowRateLimitedAction("review", studentId, limit, 3600, now))
  ) {
    return apiError("RATE_LIMITED", 429);
  }

  try {
    const review = await db.review.create({
      data: {
        bookingId: booking.id,
        studentId,
        teacherId: booking.teacherId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        createdAt: now,
      },
      select: {
        id: true,
        bookingId: true,
        rating: true,
        comment: true,
        published: true,
        createdAt: true,
      },
    });
    return Response.json(review, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("REVIEW_EXISTS", 409);
    }
    throw error;
  }
}
