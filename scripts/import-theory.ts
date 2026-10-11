import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { practiceBankQuestions } from "../prisma/theory/practice-bank";
import { roadSignQuestions } from "../prisma/theory/road-sign-bank";

const LOCALES = ["sv", "en", "ti", "ar"] as const;
const NON_SWEDISH_LOCALES = ["en", "ti", "ar"] as const;

const localizedQuestionSchema = z.object({
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).min(3).max(4),
  explanation: z.string().trim().min(1),
});

const bankQuestionSchema = z.object({
  id: z.string().trim().min(1),
  parm: z.number().int().min(1).max(10),
  question_sv: z.string().trim().min(1),
  options_sv: z.array(z.string().trim().min(1)).min(3).max(4),
  explanation_sv: z.string().trim().min(1),
  source_citation: z.string().trim().min(8),
  translations: z.object({
    en: localizedQuestionSchema,
    ti: localizedQuestionSchema,
    ar: localizedQuestionSchema,
  }),
  correct_index: z.number().int().min(0),
  difficulty: z.number().int().min(1).max(3).optional(),
  needs_image: z.boolean(),
  image_url: z.string().trim().startsWith("/road-signs/").optional(),
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
  },
  2: {
    sv: "Trafiksäkerhet",
    en: "Road safety",
    ti: "ድሕነት ትራፊክ",
    ar: "السلامة المرورية",
  },
  3: {
    sv: "Människan i trafiken",
    en: "People in traffic",
    ti: "ሰብ ኣብ ትራፊክ",
    ar: "الإنسان في المرور",
  },
  4: { sv: "Fordon", en: "Vehicles", ti: "ተሽከርከርቲ", ar: "المركبات" },
  5: { sv: "Miljö", en: "Environment", ti: "ከባቢ", ar: "البيئة" },
  6: { sv: "Landsväg", en: "Rural roads", ti: "ገጠራዊ መንገዲ", ar: "الطرق الريفية" },
  7: { sv: "Stadstrafik", en: "Urban traffic", ti: "ትራፊክ ከተማ", ar: "المرور داخل المدن" },
  8: { sv: "Parkering", en: "Parking", ti: "ምዕራፍ", ar: "الوقوف" },
  9: { sv: "Blandade frågor", en: "Mixed questions", ti: "ዝተፈላለዩ ሕቶታት", ar: "أسئلة متنوعة" },
  10: { sv: "Vägmärkesspel", en: "Road-sign game", ti: "ጸወታ ምልክታት መንገዲ", ar: "لعبة إشارات المرور" },
};

export async function importTheory(db: PrismaClient) {
  let questions = practiceBankQuestions;
  try {
    const raw = await readFile(theoryBankPath, "utf8");
    const parsed = bankFileSchema.parse(JSON.parse(raw));
    const external = Array.isArray(parsed) ? parsed : parsed.questions;
    if (external.length > questions.length) questions = external;
  } catch {
    // A missing external client bank uses the committed 180-question set.
  }
  const practiceCount = await importTheoryQuestions(db, questions);
  const signCount = await importTheoryQuestions(db, roadSignQuestions);
  return practiceCount + signCount;
}

export async function importTheoryQuestions(
  db: PrismaClient,
  questions: TheoryBankQuestion[],
) {
  const ids = new Set(questions.map((question) => question.id));
  if (ids.size !== questions.length) throw new Error("THEORY_BANK_DUPLICATE_ID");
  for (const question of questions) {
    for (const locale of NON_SWEDISH_LOCALES) {
      if (question.translations[locale].options.length !== question.options_sv.length) {
        throw new Error(`THEORY_BANK_OPTION_COUNT ${question.id} ${locale}`);
      }
    }
  }

  const categories = new Map<number, { id: string }>();
  for (let parm = 1; parm <= 10; parm += 1) {
    const slug = parm === 10 ? "vagmarkesspel" : `del-${parm}`;
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
    const isFree = true;

    const row = await db.theoryQuestion.upsert({
      where: { sourceRef: question.id },
      update: {
        categoryId: category.id,
        isFree,
        needsReview: true,
        sourceCitation: question.source_citation,
        difficulty: question.difficulty ?? 2,
        active: true,
        imageUrl: question.image_url ?? null,
      },
      create: {
        sourceRef: question.id,
        categoryId: category.id,
        isFree,
        needsReview: true,
        sourceCitation: question.source_citation,
        difficulty: question.difficulty ?? 2,
        active: true,
        imageUrl: question.image_url ?? null,
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
        const translation = question.translations[locale];
        return [{ locale, ...translation }];
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
        const translatedText = question.translations[locale].options[index];
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
