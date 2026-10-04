import { describe, expect, it } from "vitest";

import { practiceBankQuestions } from "../../../prisma/theory/practice-bank";

describe("practice theory bank", () => {
  it("has enough questions for a 65-question mock exam", () => {
    expect(practiceBankQuestions.length).toBeGreaterThanOrEqual(65);
  });

  it("keeps a valid correct option in every language", () => {
    const ids = new Set<string>();
    for (const question of practiceBankQuestions) {
      expect(ids.has(question.id)).toBe(false);
      ids.add(question.id);
      expect(question.parm).toBeGreaterThanOrEqual(1);
      expect(question.parm).toBeLessThanOrEqual(9);
      expect(question.correct_index).toBeGreaterThanOrEqual(0);
      expect(question.correct_index).toBeLessThan(question.options_sv.length);
      expect(question.options_sv).toHaveLength(3);
      for (const locale of ["en", "ti", "ar", "so"] as const) {
        expect(question.translations?.[locale]?.options).toHaveLength(3);
        expect(question.translations?.[locale]?.question.length).toBeGreaterThan(0);
      }
    }
  });
});
