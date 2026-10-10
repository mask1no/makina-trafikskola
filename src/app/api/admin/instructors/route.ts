import { errorResponse, invalidInput } from "@/lib/api/http";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { revalidateTeacherLanguages } from "@/lib/admin/revalidate-public";
import { db } from "@/lib/db";
import { isLocale } from "@/i18n/routing";
import { TEACHING_LANGUAGES } from "@/lib/teachers/languages";

export const runtime = "nodejs";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const requestSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(1).max(30),
    initialPassword: z.string().min(8).max(128),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    languages: z
      .array(z.enum(TEACHING_LANGUAGES))
      .min(1)
      .max(TEACHING_LANGUAGES.length),
    transmissions: z.array(z.enum(["MANUAL", "AUTOMATIC"])).min(1).max(2),
    locationIds: z.array(z.string().cuid()).min(1).max(20),
    hours: z
      .array(
        z
          .object({
            dayOfWeek: z.number().int().min(0).max(6),
            startTime: timeSchema,
            endTime: timeSchema,
            locationId: z.string().cuid().optional(),
          })
          .strict()
          .refine(({ startTime, endTime }) => startTime < endTime, {
            path: ["endTime"],
            message: "INVALID_TIME_RANGE",
          }),
      )
      .min(1)
      .max(50),
    yearsExperience: z.number().int().min(0).max(70).default(0),
  })
  .strict();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return errorResponse(error.code, error.status);
    }
    throw error;
  }

  const uniqueLocationIds = [...new Set(parsed.data.locationIds)];
  const hourLocationIds = parsed.data.hours.flatMap((hour) =>
    hour.locationId ? [hour.locationId] : [],
  );
  if (hourLocationIds.some((id) => !uniqueLocationIds.includes(id))) {
    return errorResponse("LOCATION_NOT_ASSIGNED", 400);
  }
  const locations = await db.location.findMany({
    where: { id: { in: uniqueLocationIds }, active: true },
    select: { id: true },
  });
  if (locations.length !== uniqueLocationIds.length) {
    return errorResponse("LOCATION_NOT_FOUND", 404);
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) return errorResponse("ACCOUNT_EXISTS", 409);
  const existingSlug = await db.teacherProfile.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (existingSlug) return errorResponse("SLUG_EXISTS", 409);
  const phone = normalizeSwedishPhone(parsed.data.phone);
  if (!phone) return errorResponse("INVALID_PHONE", 400);

  const passwordHash = await bcrypt.hash(parsed.data.initialPassword, 12);
  try {
    const teacher = await db.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            email: parsed.data.email,
            phone,
            passwordHash,
            role: "TEACHER",
            localePref:
              parsed.data.languages.find((language) => isLocale(language)) ??
              "sv",
            teacherProfile: {
              create: {
                slug: parsed.data.slug,
                languages: parsed.data.languages,
                transmissions: parsed.data.transmissions,
                yearsExperience: parsed.data.yearsExperience,
              },
            },
          },
          select: { id: true, teacherProfile: { select: { id: true } } },
        });
        const teacherId = user.teacherProfile!.id;
        await tx.teacherLocation.createMany({
          data: uniqueLocationIds.map((locationId) => ({
            teacherId,
            locationId,
          })),
        });
        await tx.teacherAvailability.createMany({
          data: parsed.data.hours.map((hour) => ({
            teacherId,
            dayOfWeek: hour.dayOfWeek,
            startTime: hour.startTime,
            endTime: hour.endTime,
            locationId: hour.locationId,
          })),
        });
        await tx.auditLog.create({
          data: {
            actorId,
            action: "teacher.create",
            entityType: "TeacherProfile",
            entityId: teacherId,
            after: {
              userId: user.id,
              languages: parsed.data.languages,
              transmissions: parsed.data.transmissions,
              locationIds: uniqueLocationIds,
              hours: parsed.data.hours,
            },
          },
        });
        return { id: teacherId, userId: user.id };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    revalidateTeacherLanguages();
    return Response.json(teacher, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;
      const targetText = Array.isArray(target)
        ? target.join(" ")
        : String(target ?? "");
      if (targetText.includes("phone")) {
        return errorResponse("PHONE_IN_USE", 409);
      }
      return errorResponse("ACCOUNT_OR_SLUG_EXISTS", 409);
    }
    throw error;
  }
}
