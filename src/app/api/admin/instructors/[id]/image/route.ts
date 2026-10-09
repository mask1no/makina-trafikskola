import { apiError } from "@/lib/api/http";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  InvalidImageError,
  R2ConfigurationError,
  uploadInstructorImage,
} from "@/lib/storage/r2";

export const runtime = "nodejs";

const MAX_MULTIPART_BYTES = 5 * 1024 * 1024 + 64 * 1024;
const inputSchema = z.object({
  id: z.string().cuid(),
  image: z
    .custom<File>((value) => value instanceof File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "IMAGE_TOO_LARGE")
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "INVALID_IMAGE_TYPE",
    ),
});



export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_MULTIPART_BYTES) {
    return apiError("IMAGE_TOO_LARGE", 413);
  }

  const formData = await request.formData().catch(() => null);
  const parsed = inputSchema.safeParse({
    id: (await context.params).id,
    image: formData?.get("image"),
  });
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message ?? "INVALID_INPUT";
    return apiError(code, code === "IMAGE_TOO_LARGE" ? 413 : 400);
  }

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return apiError(error.code, error.status);
    }
    throw error;
  }

  const teacher = await db.teacherProfile.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, photoUrl: true },
  });
  if (!teacher) return apiError("TEACHER_NOT_FOUND", 404);

  try {
    const uploaded = await uploadInstructorImage(parsed.data.image);
    await db.$transaction([
      db.teacherProfile.update({
        where: { id: teacher.id },
        data: { photoUrl: uploaded.url },
      }),
      db.auditLog.create({
        data: {
          actorId,
          action: "teacher.image.update",
          entityType: "TeacherProfile",
          entityId: teacher.id,
          before: { photoUrl: teacher.photoUrl },
          after: { photoUrl: uploaded.url },
        },
      }),
    ]);
    return Response.json({ url: uploaded.url });
  } catch (error) {
    if (error instanceof R2ConfigurationError) {
      return apiError("R2_NOT_CONFIGURED", 503);
    }
    if (error instanceof InvalidImageError) {
      return apiError(error.code, error.code === "IMAGE_TOO_LARGE" ? 413 : 400);
    }
    throw error;
  }
}
