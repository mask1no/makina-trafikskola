import { addMinutes } from "date-fns";
import { z } from "zod";

import { auth } from "@/auth";
import {
  apiError,
  authorizationError,
  invalidInput,
} from "@/lib/api/http";
import { requireRole } from "@/lib/auth/guards";
import { resolveContent } from "@/lib/content/fallback";
import { db } from "@/lib/db";
import { hasTheoryAccess } from "@/lib/theory/access";
import { locales } from "@/i18n/routing";

const attemptSchema = z
  .object({
    questionId: z.string().cuid(),
    answerId: z.string().cuid(),
    sessionId: z.string().cuid().optional(),
    locale: z.enum(locales).optional(),
  })
  .strict();

export async function POST(request: Request) {
  const parsed = attemptSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  let studentId: string;
  try {
    studentId = requireRole(await auth(), ["STUDENT"]).user.id;
  } catch (error) {
    return authorizationError(error);
  }

  const now = new Date();
  const [student, question, session] = await Promise.all([
    db.user.findFirst({
      where: { id: studentId, role: "STUDENT", deletedAt: null },
      select: { id: true, localePref: true },
    }),
    db.theoryQuestion.findFirst({
      where: { id: parsed.data.questionId, active: true },
      include: {
        translations: true,
        answers: {
          where: { id: parsed.data.answerId },
          select: { id: true, isCorrect: true },
        },
      },
    }),
    parsed.data.sessionId
      ? db.theoryExamSession.findUnique({
          where: { id: parsed.data.sessionId },
          select: {
            id: true,
            studentId: true,
            startedAt: true,
            finishedAt: true,
            questionCount: true,
            selectedQuestionIds: true,
          },
        })
      : Promise.resolve(null),
  ]);
  if (!student) return apiError("STUDENT_NOT_FOUND", 404);
  if (parsed.data.sessionId && (!session || session.studentId !== studentId)) {
    return apiError("THEORY_EXAM_NOT_FOUND", 404);
  }
  if (!question || !question.answers[0]) {
    return apiError("THEORY_QUESTION_NOT_FOUND", 404);
  }
  if (session) {
    if (!session.selectedQuestionIds.includes(question.id)) {
      return apiError("THEORY_QUESTION_NOT_FOUND", 404);
    }
    if (session.finishedAt) return apiError("THEORY_EXAM_FINISHED", 409);
    if (now >= addMinutes(session.startedAt, 50)) {
      return apiError("THEORY_EXAM_EXPIRED", 409);
    }
    const answered = await db.theoryAttempt.groupBy({
      by: ["questionId"],
      where: {
        sessionId: session.id,
        studentId,
        questionId: { in: session.selectedQuestionIds },
      },
    });
    if (
      answered.length >= session.questionCount &&
      !answered.some((item) => item.questionId === question.id)
    ) {
      return apiError("THEORY_EXAM_COMPLETE", 409);
    }
  }
  if (
    !question.isFree &&
    !(await hasTheoryAccess(db, studentId, now))
  ) {
    return apiError("THEORY_ACCESS_REQUIRED", 403);
  }

  const selectedAnswer = question.answers[0];
  const attempt = await db.theoryAttempt.create({
    data: {
      studentId,
      questionId: question.id,
      answerId: selectedAnswer.id,
      correct: selectedAnswer.isCorrect,
      sessionId: session?.id,
      answeredAt: now,
    },
    select: { id: true, correct: true, answeredAt: true, sessionId: true },
  });
  const content = resolveContent(
    question.translations,
    parsed.data.locale ?? student.localePref,
  );

  if (session) {
    return Response.json(
      {
        id: attempt.id,
        answeredAt: attempt.answeredAt,
        sessionId: attempt.sessionId,
      },
      { status: 201 },
    );
  }

  return Response.json({
    ...attempt,
    explanation: content.translation?.explanation ?? null,
    explanationLocale: content.translation?.locale ?? null,
  }, { status: 201 });
}
