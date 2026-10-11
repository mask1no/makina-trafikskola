import { writeFile } from "node:fs/promises";
import path from "node:path";

import { practiceBankQuestions } from "../prisma/theory/practice-bank";

function csv(value: string | number | boolean) {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

const headers = [
  "id",
  "category",
  "question_sv",
  "correct_answer_sv",
  "explanation_sv",
  "source_citation",
  "active",
  "is_free",
  "needs_review",
  "review_status",
  "review_notes",
];

const rows = practiceBankQuestions.map((question) => [
  question.id,
  question.parm,
  question.question_sv,
  question.options_sv[question.correct_index] ?? "",
  question.explanation_sv,
  question.source_citation,
  true,
  true,
  true,
  "",
  "",
]);

const output = [headers, ...rows]
  .map((row) => row.map(csv).join(","))
  .join("\r\n");
const target = path.join(process.cwd(), "theory-review.csv");

async function main() {
  await writeFile(target, `${output}\r\n`, "utf8");
  console.log(`Exported ${rows.length} questions to ${target}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
