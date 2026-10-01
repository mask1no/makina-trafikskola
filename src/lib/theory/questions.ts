import { db } from "@/lib/db";

export function freeTheoryQuestionCount() {
  return db.theoryQuestion.count({
    where: { active: true, isFree: true },
  });
}
