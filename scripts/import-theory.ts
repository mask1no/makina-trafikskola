import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const LOCALES = ["sv", "en", "ti", "ar", "so"] as const;

const bankQuestionSchema = z.object({
  id: z.string().trim().min(1),
  parm: z.number().int().min(1).max(9),
  question_sv: z.string().trim().min(1),
  options_sv: z.array(z.string().trim().min(1)).min(2),
  correct_index: z.number().int().min(0),
  needs_image: z.boolean(),
  status: z.enum(["ok", "review"]),
});

const bankFileSchema = z.union([
  z.array(bankQuestionSchema),
  z.object({ questions: z.array(bankQuestionSchema) }),
]);

export const theoryBankPath = path.join(process.cwd(), "prisma", "theory-bank.json");

export async function importTheory(db: PrismaClient) {
  const raw = await readFile(theoryBankPath, "utf8");
  const parsed = bankFileSchema.parse(JSON.parse(raw));
  const questions = Array.isArray(parsed) ? parsed : parsed.questions;

  const categories = new Map<number, { id: string }>();
  for (let parm = 1; parm <= 9; parm += 1) {
    const slug = `del-${parm}`;
    const name = `Del ${parm}`;
    const category = await db.theoryCategory.upsert({
      where: { slug },
      update: { order: parm },
      create: { slug, order: parm },
    });
    for (const locale of LOCALES) {
      await db.theoryCategoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale } },
        update: { name },
        create: { categoryId: category.id, locale, name },
      });
    }
    categories.set(parm, category);
  }

  const seenInCategory = new Map<number, number>();
  for (const question of questions) {
    if (question.correct_index >= question.options_sv.length) {
      throw new Error(`THEORY_BANK_CORRECT_INDEX ${question.id}`);
    }
    const count = seenInCategory.get(question.parm) ?? 0;
    seenInCategory.set(question.parm, count + 1);
    const category = categories.get(question.parm);
    if (!category) throw new Error(`THEORY_BANK_PARM ${question.id}`);

    const row = await db.theoryQuestion.upsert({
      where: { sourceRef: question.id },
      update: {
        categoryId: category.id,
        isFree: count < 3,
        difficulty: 2,
        active: question.status === "ok",
        imageUrl: question.needs_image ? `/theory/${question.id}.webp` : null,
      },
      create: {
        sourceRef: question.id,
        categoryId: category.id,
        isFree: count < 3,
        difficulty: 2,
        active: question.status === "ok",
        imageUrl: question.needs_image ? `/theory/${question.id}.webp` : null,
      },
    });

    await db.theoryQuestionTranslation.upsert({
      where: { questionId_locale: { questionId: row.id, locale: "sv" } },
      update: { text: question.question_sv },
      create: { questionId: row.id, locale: "sv", text: question.question_sv },
    });

    for (const [index, text] of question.options_sv.entries()) {
      const answerId = `bank-${question.id}-a${index}`;
      await db.theoryAnswer.upsert({
        where: { id: answerId },
        update: {
          questionId: row.id,
          isCorrect: index === question.correct_index,
          order: index,
        },
        create: {
          id: answerId,
          questionId: row.id,
          isCorrect: index === question.correct_index,
          order: index,
        },
      });
      await db.theoryAnswerTranslation.upsert({
        where: { answerId_locale: { answerId, locale: "sv" } },
        update: { text },
        create: { answerId, locale: "sv", text },
      });
    }
  }

  return questions.length;
}

async function main() {
  const db = new PrismaClient();
  try {
    const count = await importTheory(db);
    console.log(`Imported ${count} theory questions.`);
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1]?.includes("import-theory")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
