import { readFile } from "node:fs/promises";

import type { PrismaClient } from "@prisma/client";

import { practiceBankQuestions } from "./theory/practice-bank";
import { roadSignQuestions } from "./theory/road-sign-bank";
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
    where: {
      question: {
        OR: [
          { id: { startsWith: "seed-q-" } },
          { sourceRef: { startsWith: "original-free-" } },
        ],
      },
    },
  });
  await db.theoryAnswer.deleteMany({
    where: {
      question: {
        OR: [
          { id: { startsWith: "seed-q-" } },
          { sourceRef: { startsWith: "original-free-" } },
        ],
      },
    },
  });
  await db.theoryQuestion.deleteMany({
    where: {
      OR: [
        { id: { startsWith: "seed-q-" } },
        { sourceRef: { startsWith: "original-free-" } },
      ],
    },
  });
  await db.theoryCategory.deleteMany({
    where: {
      OR: [
        { id: { startsWith: "seed-cat-" } },
        { slug: { in: PLACEHOLDER_SLUGS } },
      ],
    },
  });

  const practiceCount = await importTheoryQuestions(db, await questionsToImport());
  const signCount = await importTheoryQuestions(db, roadSignQuestions);
  console.log(`Imported ${practiceCount} theory questions and ${signCount} road-sign rounds.`);
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
