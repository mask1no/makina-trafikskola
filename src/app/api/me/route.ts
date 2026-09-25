import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const deleteSchema = z.object({ confirm: z.literal("DELETE") }).strict();

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "INVALID_INPUT",
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  let studentId: string;
  try {
    studentId = requireRole(await auth(), ["STUDENT"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json(
        { error: { code: error.code, message: error.code } },
        { status: error.status },
      );
    }
    throw error;
  }

  const now = new Date();
  const user = await db.user.findFirst({
    where: { id: studentId, role: "STUDENT", deletedAt: null },
    select: {
      id: true,
      _count: {
        select: {
          bookings: {
            where: { status: "CONFIRMED", startsAt: { gt: now } },
          },
        },
      },
    },
  });
  if (!user) {
    return Response.json(
      { error: { code: "ACCOUNT_NOT_FOUND", message: "ACCOUNT_NOT_FOUND" } },
      { status: 404 },
    );
  }
  if (user._count.bookings > 0) {
    return Response.json(
      {
        error: {
          code: "ACCOUNT_HAS_ACTIVE_BOOKINGS",
          message: "ACCOUNT_HAS_ACTIVE_BOOKINGS",
        },
      },
      { status: 409 },
    );
  }

  await db.$transaction(
    async (tx) => {
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
