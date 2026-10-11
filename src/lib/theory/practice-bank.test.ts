import { describe, expect, it } from "vitest";

import { practiceBankQuestions } from "../../../prisma/theory/practice-bank";

describe("practice theory bank", () => {
  it("contains the committed 180-question bank", () => {
    expect(practiceBankQuestions).toHaveLength(180);
  });

  it("keeps 20 questions in every section", () => {
    for (let parm = 1; parm <= 9; parm += 1) {
      const count = practiceBankQuestions.filter((question) => question.parm === parm).length;
      expect(count).toBe(20);
    }
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
      expect(question.options_sv.length).toBeGreaterThanOrEqual(3);
      expect(question.options_sv.length).toBeLessThanOrEqual(4);
      expect(question.explanation_sv.length).toBeGreaterThan(0);
      expect(question.source_citation).toMatch(/(förordningen|lagen|balken)/i);
      expect(question.needs_image).toBe(false);
      expect(question.status).toBe("ok");
      for (const locale of ["en", "ti", "ar"] as const) {
        expect(question.translations[locale].options).toHaveLength(question.options_sv.length);
        expect(question.translations[locale].question.length).toBeGreaterThan(0);
        expect(question.translations[locale].explanation.length).toBeGreaterThan(0);
      }
    }
  });

  it("does not use joke or absurd distractors", () => {
    const copy = JSON.stringify(practiceBankQuestions).toLocaleLowerCase();
    for (const banned of [
      "blunda och gasa",
      "close your eyes and accelerate",
      "pilen är bara ett förslag",
      "the arrow is only a suggestion",
      "den som tutar kör först",
      "whoever honks goes first",
      "bara tuta",
      "only honk",
      "bara gasa",
      "only accelerate",
      "ägaren till den nyaste bilen",
      "the one with the newer car",
      "för att hälsa på en vän",
      "to greet a friend",
      "أغمض عينيك",
      "السهم مجرد اقتراح",
    ]) {
      expect(copy).not.toContain(banned);
    }
  });
});
