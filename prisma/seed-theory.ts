import { access } from "node:fs/promises";

import type { PrismaClient } from "@prisma/client";

import { importTheory, theoryBankPath } from "../scripts/import-theory";

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

  try {
    await access(theoryBankPath);
  } catch {
    console.log("prisma/theory-bank.json is missing. Theory import skipped.");
    return;
  }

  const count = await importTheory(db);
  console.log(`Imported ${count} theory questions.`);
}
