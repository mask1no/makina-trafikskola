import { describe, expect, it } from "vitest";

import { answerStreaks } from "./streak";

describe("answerStreaks", () => {
  it("keeps the current run and the best run", () => {
    expect(
      answerStreaks([
        { correct: true },
        { correct: true },
        { correct: false },
        { correct: true },
      ]),
    ).toEqual({ current: 1, best: 2 });
  });
});
