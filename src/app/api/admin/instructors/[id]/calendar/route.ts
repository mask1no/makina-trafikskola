import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import { probeTeacherCalendar } from "@/lib/calendar/google";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function apiError(code: string, status: number) {
  return Response.json({ error: { code, message: code } }, { status });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireRole(await auth(), ["ADMIN"]);
  } catch (error) {
    if (error instanceof AuthorizationError) return apiError(error.code, error.status);
    throw error;
  }
  const teacher = await db.teacherProfile.findUnique({
    where: { id: (await context.params).id },
    select: { googleCalendarEmail: true },
  });
  if (!teacher) return apiError("TEACHER_NOT_FOUND", 404);
  if (!teacher.googleCalendarEmail) return apiError("CALENDAR_EMAIL_MISSING", 400);
  try {
    const result = await probeTeacherCalendar(teacher.googleCalendarEmail);
    return Response.json({ ok: true, message: result });
  } catch (error) {
    return Response.json({
      ok: false,
      message: error instanceof Error ? error.message : "CALENDAR_UNREACHABLE",
    });
  }
}
