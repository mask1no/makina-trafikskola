import { readFile } from "node:fs/promises";

import type { PrismaClient } from "@prisma/client";

import { practiceBankQuestions } from "./theory/practice-bank";
import {
  bankFileSchema,
  importTheoryQuestions,
  theoryBankPath,
  type TheoryBankQuestion,
} from "../scripts/import-theory";

const PLACEHOLDER_SLUGS = [
  "vagmarken",
  "trafikregler",
  "fordonskannedom",
  "miljo",
  "manniskan-i-trafiken",
  "sakerhet",
  "motorvag-och-landsvag",
  "parkering",
];

export async function seedTheory(db: PrismaClient) {
  await db.theoryAttempt.deleteMany({
    where: { question: { id: { startsWith: "seed-q-" } } },
  });
  await db.theoryAnswer.deleteMany({
    where: { questionId: { startsWith: "seed-q-" } },
  });
  await db.theoryQuestion.deleteMany({
    where: { id: { startsWith: "seed-q-" } },
  });
  await db.theoryCategory.deleteMany({
    where: {
      OR: [
        { id: { startsWith: "seed-cat-" } },
        { slug: { in: PLACEHOLDER_SLUGS } },
      ],
    },
  });

  const count = await importTheoryQuestions(db, await questionsToImport());
  console.log(`Imported ${count} theory questions.`);
}

async function questionsToImport(): Promise<TheoryBankQuestion[]> {
  try {
    const raw = await readFile(theoryBankPath, "utf8");
    const parsed = bankFileSchema.parse(JSON.parse(raw));
    const fromFile = Array.isArray(parsed) ? parsed : parsed.questions;
    if (fromFile.length > practiceBankQuestions.length) return fromFile;
  } catch {
    // A missing or unreadable external bank falls back to the committed set.
  }
  return practiceBankQuestions;
}
