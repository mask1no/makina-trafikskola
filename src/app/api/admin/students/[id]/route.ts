import { invalidInput, apiError, errorResponse } from "@/lib/api/http";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { maskEmail, maskName, maskPhone } from "@/lib/auth/mask";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { calculateAvailableCreditBalance } from "@/lib/credits/ledger";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().cuid() }).strict();

const patchSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().toLowerCase().email().max(254).nullable().optional(),
    phone: z.string().trim().min(3).max(32).nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.firstName !== undefined ||
      value.lastName !== undefined ||
      value.email !== undefined ||
      value.phone !== undefined,
    { message: "INVALID_INPUT" },
  );

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse((await context.params));
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  try {
    requireRole(await auth(), ["ADMIN"]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return apiError(error.code, error.status);
    }
    throw error;
  }

  const student = await db.user.findFirst({
    where: { id: parsed.data.id, role: "STUDENT", deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      localePref: true,
      credits: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          delta: true,
          reason: true,
          orderItemId: true,
          expiresAt: true,
          note: true,
          createdAt: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          totalOre: true,
          vatOre: true,
          createdAt: true,
          payment: {
            select: {
              provider: true,
              method: true,
              amountOre: true,
              refundedOre: true,
              status: true,
            },
          },
        },
      },
    },
  });
  if (!student) {
    return errorResponse("STUDENT_NOT_FOUND", 404);
  }

  const now = new Date();
  const balance = calculateAvailableCreditBalance(student.credits, now).balance;

  return Response.json({ ...student, balance });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return invalidInput(params.error.flatten().fieldErrors);
  }
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  let adminId: string;
  try {
    adminId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return apiError(error.code, error.status);
    }
    throw error;
  }

  let phone: string | null | undefined = parsed.data.phone;
  if (typeof phone === "string") {
    const normalized = normalizeSwedishPhone(phone);
    if (!normalized) {
      return errorResponse("INVALID_PHONE", 400);
    }
    phone = normalized;
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const before = await tx.user.findFirst({
        where: { id: params.data.id, role: "STUDENT", deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      });
      if (!before) {
        throw new Error("STUDENT_NOT_FOUND");
      }

      if (phone) {
        const conflict = await tx.user.findFirst({
          where: { phone, deletedAt: null, id: { not: before.id } },
          select: { id: true },
        });
        if (conflict) throw new Error("PHONE_IN_USE");
      }
      if (parsed.data.email) {
        const conflict = await tx.user.findFirst({
          where: {
            email: parsed.data.email,
            deletedAt: null,
            id: { not: before.id },
          },
          select: { id: true },
        });
        if (conflict) throw new Error("EMAIL_TAKEN");
      }

      const after = await tx.user.update({
        where: { id: before.id },
        data: {
          ...(parsed.data.firstName !== undefined
            ? { firstName: parsed.data.firstName }
            : {}),
          ...(parsed.data.lastName !== undefined
            ? { lastName: parsed.data.lastName }
            : {}),
          ...(parsed.data.email !== undefined
            ? {
                email: parsed.data.email,
                emailVerifiedAt: parsed.data.email ? new Date() : null,
              }
            : {}),
          ...(phone !== undefined
            ? {
                phone,
                phoneVerifiedAt: phone ? new Date() : null,
              }
            : {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: "admin.student_updated",
          entityType: "User",
          entityId: before.id,
          before: {
            ...maskName(before.firstName, before.lastName),
            email: maskEmail(before.email),
            phone: maskPhone(before.phone),
          },
          after: {
            ...maskName(after.firstName, after.lastName),
            email: maskEmail(after.email),
            phone: maskPhone(after.phone),
          },
        },
      });

      return after;
    });

    return Response.json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "STUDENT_NOT_FOUND") {
      return errorResponse("STUDENT_NOT_FOUND", 404);
    }
    if (code === "PHONE_IN_USE") return errorResponse("PHONE_IN_USE", 409);
    if (code === "EMAIL_TAKEN") return errorResponse("EMAIL_TAKEN", 409);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse("EMAIL_TAKEN", 409);
    }
    throw error;
  }
}
