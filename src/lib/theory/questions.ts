import { cache } from "react";

import { db } from "@/lib/db";

export const freeTheoryQuestionCount = cache(function freeTheoryQuestionCount() {
  return db.theoryQuestion.count({
    where: { active: true, isFree: true },
  });
});
