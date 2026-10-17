import { describe, expect, it } from "vitest";

import { roadSignQuestions } from "../../../prisma/theory/road-sign-bank";

describe("road-sign game bank", () => {
  it("has 100 questions and never repeats the same sign twice in a row", () => {
    expect(roadSignQuestions).toHaveLength(100);
    expect(roadSignQuestions.length).toBeLessThanOrEqual(300);
    expect(new Set(roadSignQuestions.map((question) => question.id)).size).toBe(100);
    expect(new Set(roadSignQuestions.map((question) => question.image_url)).size).toBe(25);
    for (let index = 1; index < roadSignQuestions.length; index += 1) {
      expect(roadSignQuestions[index]?.image_url).not.toBe(roadSignQuestions[index - 1]?.image_url);
    }
    expect(
      roadSignQuestions.every(
        (question) =>
          question.parm === 10 &&
          question.needs_image &&
          question.image_url?.startsWith("/road-signs/") &&
          question.status === "review",
      ),
    ).toBe(true);
  });

  it("keeps four realistic options and the same correct answer in every locale", () => {
    for (const question of roadSignQuestions) {
      expect(question.options_sv).toHaveLength(4);
      expect(question.translations.en.options).toHaveLength(4);
      expect(question.translations.ti.options).toHaveLength(4);
      expect(question.translations.ar.options).toHaveLength(4);
      expect(question.correct_index).toBeGreaterThanOrEqual(0);
      expect(question.correct_index).toBeLessThan(4);
      expect(new Set(question.options_sv).size).toBe(4);
    }
  });
});
