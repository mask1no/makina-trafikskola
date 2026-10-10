import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const LOCALES = ["sv", "en", "ti", "ar", "so"] as const;
const NON_SWEDISH_LOCALES = ["en", "ti", "ar", "so"] as const;

const localizedQuestionSchema = z.object({
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).min(2),
  explanation: z.string().trim().min(1),
});

const bankQuestionSchema = z.object({
  id: z.string().trim().min(1),
  parm: z.number().int().min(1).max(9),
  question_sv: z.string().trim().min(1),
  options_sv: z.array(z.string().trim().min(1)).min(2),
  explanation_sv: z.string().trim().min(1).optional(),
  translations: z
    .object({
      en: localizedQuestionSchema.optional(),
      ti: localizedQuestionSchema.optional(),
      ar: localizedQuestionSchema.optional(),
      so: localizedQuestionSchema.optional(),
    })
    .optional(),
  correct_index: z.number().int().min(0),
  difficulty: z.number().int().min(1).max(3).optional(),
  needs_image: z.boolean(),
  status: z.enum(["ok", "review"]),
});

export type TheoryBankQuestion = z.infer<typeof bankQuestionSchema>;

const bankFileSchema = z.union([
  z.array(bankQuestionSchema),
  z.object({ questions: z.array(bankQuestionSchema) }),
]);

export const theoryBankPath = path.join(process.cwd(), "prisma", "theory-bank.json");
export { bankFileSchema };

const CATEGORY_NAMES: Record<
  number,
  Record<(typeof LOCALES)[number], string>
> = {
  1: {
    sv: "Trafikregler",
    en: "Traffic rules",
    ti: "ሕግታት ትራፊክ",
    ar: "قواعد المرور",
    so: "Xeerarka waddooyinka",
  },
  2: {
    sv: "Trafiksäkerhet",
    en: "Road safety",
    ti: "ድሕነት ትራፊክ",
    ar: "السلامة المرورية",
    so: "Badbaadada waddooyinka",
  },
  3: {
    sv: "Människan i trafiken",
    en: "People in traffic",
    ti: "ሰብ ኣብ ትራፊክ",
    ar: "الإنسان في المرور",
    so: "Dadka waddooyinka",
  },
  4: { sv: "Fordon", en: "Vehicles", ti: "ተሽከርከርቲ", ar: "المركبات", so: "Gaadiidka" },
  5: { sv: "Miljö", en: "Environment", ti: "ከባቢ", ar: "البيئة", so: "Deegaanka" },
  6: { sv: "Landsväg", en: "Rural roads", ti: "ገጠራዊ መንገዲ", ar: "الطرق الريفية", so: "Waddooyinka miyiga" },
  7: { sv: "Stadstrafik", en: "Urban traffic", ti: "ትራፊክ ከተማ", ar: "المرور داخل المدن", so: "Gaadiidka magaalada" },
  8: { sv: "Parkering", en: "Parking", ti: "ምዕራፍ", ar: "الوقوف", so: "Baarkinka" },
  9: { sv: "Blandade frågor", en: "Mixed questions", ti: "ዝተፈላለዩ ሕቶታት", ar: "أسئلة متنوعة", so: "Su'aalo isku dhafan" },
};

export async function importTheory(db: PrismaClient) {
  const raw = await readFile(theoryBankPath, "utf8");
  const parsed = bankFileSchema.parse(JSON.parse(raw));
  const questions = Array.isArray(parsed) ? parsed : parsed.questions;
  return importTheoryQuestions(db, questions);
}

export async function importTheoryQuestions(
  db: PrismaClient,
  questions: TheoryBankQuestion[],
) {

  const categories = new Map<number, { id: string }>();
  for (let parm = 1; parm <= 9; parm += 1) {
    const slug = `del-${parm}`;
    const category = await db.theoryCategory.upsert({
      where: { slug },
      update: { order: parm },
      create: { slug, order: parm },
    });
    for (const locale of LOCALES) {
      const name = CATEGORY_NAMES[parm]?.[locale] ?? `Del ${parm}`;
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
    const indexInCategory = seenInCategory.get(question.parm) ?? 0;
    seenInCategory.set(question.parm, indexInCategory + 1);
    const category = categories.get(question.parm);
    if (!category) throw new Error(`THEORY_BANK_PARM ${question.id}`);
    const isFree = indexInCategory < 20;

    const row = await db.theoryQuestion.upsert({
      where: { sourceRef: question.id },
      update: {
        categoryId: category.id,
        isFree,
        difficulty: question.difficulty ?? 2,
        active: question.status === "ok",
        imageUrl: question.needs_image ? `/theory/${question.id}.webp` : null,
      },
      create: {
        sourceRef: question.id,
        categoryId: category.id,
        isFree,
        difficulty: question.difficulty ?? 2,
        active: question.status === "ok",
        imageUrl: question.needs_image ? `/theory/${question.id}.webp` : null,
      },
    });

    const translations = [
      {
        locale: "sv" as const,
        question: question.question_sv,
        options: question.options_sv,
        explanation: question.explanation_sv,
      },
      ...NON_SWEDISH_LOCALES.flatMap((locale) => {
        const translation = question.translations?.[locale];
        return translation ? [{ locale, ...translation }] : [];
      }),
    ];

    for (const translation of translations) {
      await db.theoryQuestionTranslation.upsert({
        where: {
          questionId_locale: {
            questionId: row.id,
            locale: translation.locale,
          },
        },
        update: {
          text: translation.question,
          explanation: translation.explanation,
        },
        create: {
          questionId: row.id,
          locale: translation.locale,
          text: translation.question,
          explanation: translation.explanation,
        },
      });
    }

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
      for (const locale of NON_SWEDISH_LOCALES) {
        const translatedText = question.translations?.[locale]?.options[index];
        if (!translatedText) continue;
        await db.theoryAnswerTranslation.upsert({
          where: { answerId_locale: { answerId, locale } },
          update: { text: translatedText },
          create: { answerId, locale, text: translatedText },
        });
      }
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
