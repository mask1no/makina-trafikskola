import type { Prisma } from "@prisma/client";

import { resolveContent } from "@/lib/content/fallback";

type TheoryAccessStore = Pick<Prisma.TransactionClient, "theoryAccess">;

export function getActiveTheoryAccess(
  tx: TheoryAccessStore,
  studentId: string,
  now: Date,
) {
  return tx.theoryAccess.findFirst({
    where: { studentId, expiresAt: { gt: now } },
    orderBy: { expiresAt: "desc" },
    select: { expiresAt: true },
  });
}

export async function hasTheoryAccess(
  tx: TheoryAccessStore,
  studentId: string,
  now: Date,
) {
  return Boolean(await getActiveTheoryAccess(tx, studentId, now));
}

type QuestionWithContent = Prisma.TheoryQuestionGetPayload<{
  include: {
    translations: true;
    category: { include: { translations: true } };
    answers: { include: { translations: true } };
  };
}>;

export function presentQuestion(question: QuestionWithContent, locale: string) {
  const questionContent = resolveContent(question.translations, locale);
  const categoryContent = resolveContent(question.category.translations, locale);
  if (!questionContent.translation || !categoryContent.translation) return null;

  const answers = question.answers.flatMap((answer) => {
    const content = resolveContent(answer.translations, locale);
    return content.translation
      ? [{
          id: answer.id,
          order: answer.order,
          text: content.translation.text,
          contentLocale: content.translation.locale,
          swedishOnly: content.swedishOnly,
        }]
      : [];
  });
  if (!answers.length) return null;

  return {
    id: question.id,
    category: {
      slug: question.category.slug,
      name: categoryContent.translation.name,
      contentLocale: categoryContent.translation.locale,
    },
    isFree: question.isFree,
    imageUrl: question.imageUrl,
    difficulty: question.difficulty,
    version: question.version,
    text: questionContent.translation.text,
    audioUrl: questionContent.translation.audioUrl,
    contentLocale: questionContent.translation.locale,
    swedishOnly: questionContent.swedishOnly,
    answers,
  };
}
