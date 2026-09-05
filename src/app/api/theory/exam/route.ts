import { randomUUID } from "node:crypto";

import { addMinutes } from "date-fns";
import { z } from "zod";

import { auth } from "@/auth";
import {
  apiError,
  authorizationError,
  invalidInput,
} from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { locales } from "@/i18n/routing";
import { hasTheoryAccess } from "@/lib/theory/access";
import { composeMockExam } from "@/lib/theory/exam";

const examSchema = z
  .object({ locale: z.enum(locales).optional() })
  .strict()
  .default({});

export async function POST(request: Request) {
  const raw = await request.text();
  let body: unknown = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return invalidInput({});
  }
  const parsed = examSchema.safeParse(body);
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

  const now = new Date();
  const paid = await hasTheoryAccess(db, studentId, now);
  if (!paid) return apiError("THEORY_ACCESS_REQUIRED", 403);

  const questions = await db.theoryQuestion.findMany({
    where: { active: true },
    select: { id: true, difficulty: true },
  });
  if (questions.length < 65) {
    return apiError("THEORY_EXAM_UNAVAILABLE", 409);
  }

  const selectedQuestionIds = composeMockExam(
    questions,
    randomUUID(),
  ).map((question) => question.id);
  const session = await db.theoryExamSession.create({
    data: {
      studentId,
      locale: parsed.data.locale ?? student.localePref,
      startedAt: now,
      questionCount: 65,
      selectedQuestionIds,
    },
  });

  return Response.json({
    id: session.id,
    startedAt: session.startedAt,
    expiresAt: addMinutes(now, 50),
    questionCount: session.questionCount,
  }, { status: 201 });
}
