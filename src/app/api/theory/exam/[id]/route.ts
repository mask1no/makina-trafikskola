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
import { hasTheoryAccess, presentQuestion } from "@/lib/theory/access";
import { scoreMockExam } from "@/lib/theory/exam";

const paramsSchema = z.object({ id: z.string().cuid() });
const localeSchema = z.enum(["sv", "en", "ti", "ar", "so"]);

const inputSchema = z.object({
  id: z.string().cuid(),
  body: z.object({ action: z.literal("finish").optional() }).strict(),
});

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const parsedParams = paramsSchema.safeParse(await props.params);
  const parsedLocale = localeSchema.safeParse(
    new URL(request.url).searchParams.get("locale") ?? "sv",
  );
  if (!parsedParams.success || !parsedLocale.success) {
    return invalidInput({
      ...(!parsedParams.success ? parsedParams.error.flatten().fieldErrors : {}),
      ...(!parsedLocale.success ? { locale: ["INVALID_INPUT"] } : {}),
    });
  }

  let studentId: string;
  try {
    studentId = requireRole(await auth(), ["STUDENT"]).user.id;
  } catch (error) {
    return authorizationError(error);
  }

  const session = await db.theoryExamSession.findUnique({
    where: { id: parsedParams.data.id },
    select: {
      id: true,
      studentId: true,
      locale: true,
      startedAt: true,
      finishedAt: true,
      questionCount: true,
      selectedQuestionIds: true,
      correctCount: true,
      passed: true,
      attempts: {
        where: { studentId },
        select: { questionId: true },
      },
    },
  });
  if (!session || session.studentId !== studentId) {
    return apiError("THEORY_EXAM_NOT_FOUND", 404);
  }
  if (!(await hasTheoryAccess(db, studentId, new Date()))) {
    return apiError("THEORY_ACCESS_REQUIRED", 403);
  }

  const questions = await db.theoryQuestion.findMany({
    where: { id: { in: session.selectedQuestionIds }, active: true },
    include: {
      translations: true,
      category: { include: { translations: true } },
      answers: {
        orderBy: { order: "asc" },
        include: { translations: true },
      },
    },
  });
  const byId = new Map(questions.map((question) => [question.id, question]));
  const presented = session.selectedQuestionIds.flatMap((id) => {
    const question = byId.get(id);
    if (!question) return [];
    const value = presentQuestion(question, parsedLocale.data);
    return value ? [value] : [];
  });
  if (presented.length !== session.questionCount) {
    return apiError("THEORY_EXAM_UNAVAILABLE", 409);
  }

  return Response.json({
    id: session.id,
    startedAt: session.startedAt,
    expiresAt: addMinutes(session.startedAt, 50),
    finishedAt: session.finishedAt,
    questionCount: session.questionCount,
    answeredQuestionIds: [...new Set(session.attempts.map((item) => item.questionId))],
    questions: presented,
    ...(session.finishedAt
      ? { correctCount: session.correctCount, passed: session.passed }
      : {}),
  });
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const parsed = inputSchema.safeParse({
    id: params.id,
    body: await request.json().catch(() => ({})),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  let studentId: string;
  try {
    studentId = requireRole(await auth(), ["STUDENT"]).user.id;
  } catch (error) {
    return authorizationError(error);
  }

  const session = await db.theoryExamSession.findUnique({
    where: { id: parsed.data.id },
    include: {
      attempts: {
        where: { studentId },
        orderBy: { answeredAt: "asc" },
        select: { questionId: true, correct: true, answeredAt: true },
      },
    },
  });
  if (!session || session.studentId !== studentId) {
    return apiError("THEORY_EXAM_NOT_FOUND", 404);
  }
  if (session.finishedAt) {
    return Response.json({
      id: session.id,
      correctCount: session.correctCount,
      questionCount: session.questionCount,
      passed: session.passed,
      finishedAt: session.finishedAt,
      expired: session.finishedAt >= addMinutes(session.startedAt, 50),
    });
  }

  const latestByQuestion = new Map<string, boolean>();
  for (const attempt of session.attempts) {
    if (session.selectedQuestionIds.includes(attempt.questionId)) {
      latestByQuestion.set(attempt.questionId, attempt.correct);
    }
  }
  const correctCount = [...latestByQuestion.values()]
    .filter(Boolean).length;
  const now = new Date();
  const result = scoreMockExam({
    startedAt: session.startedAt,
    finishedAt: now,
    correctCount,
  });
  const updated = await db.theoryExamSession.update({
    where: { id: session.id },
    data: {
      finishedAt: now,
      correctCount,
      passed: result.passed,
    },
  });

  return Response.json({
    id: updated.id,
    correctCount: updated.correctCount,
    questionCount: updated.questionCount,
    passed: updated.passed,
    finishedAt: updated.finishedAt,
    expired: result.expired,
  });
}
