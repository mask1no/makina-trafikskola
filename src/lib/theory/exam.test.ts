import { describe, expect, it } from "vitest";

import { composeMockExam, scoreMockExam } from "./exam";

describe("composeMockExam", () => {
  const candidates = [1, 2, 3].flatMap((difficulty) =>
    Array.from({ length: 30 }, (_, index) => ({
      id: `${difficulty}-${index}`,
      difficulty,
    })),
  );

  it("builds a seeded 22/22/21 difficulty-balanced set", () => {
    const first = composeMockExam(candidates, "seed-one");
    const replay = composeMockExam(candidates, "seed-one");

    expect(first).toEqual(replay);
    expect(first).toHaveLength(65);
    expect(
      first.reduce<Record<number, number>>((counts, question) => {
        counts[question.difficulty] =
          (counts[question.difficulty] ?? 0) + 1;
        return counts;
      }, {}),
    ).toEqual({ 1: 22, 2: 22, 3: 21 });
  });

  it("fills a short difficulty bucket from the seeded remainder", () => {
    const result = composeMockExam(
      candidates.filter((question) =>
        question.difficulty === 3
          ? Number(question.id.split("-")[1]) < 10
          : true,
      ),
      "short-bucket",
    );

    expect(result).toHaveLength(65);
    expect(new Set(result.map(({ id }) => id)).size).toBe(65);
  });
});

describe("scoreMockExam", () => {
  const startedAt = new Date("2026-09-05T08:00:00.000Z");

  it("passes a qualifying score immediately before the deadline", () => {
    expect(
      scoreMockExam({
        startedAt,
        finishedAt: new Date("2026-09-05T08:49:59.999Z"),
        correctCount: 52,
      }),
    ).toEqual({ expired: false, passed: true });
  });

  it("fails a qualifying score at the exact deadline", () => {
    expect(
      scoreMockExam({
        startedAt,
        finishedAt: new Date("2026-09-05T08:50:00.000Z"),
        correctCount: 65,
      }),
    ).toEqual({ expired: true, passed: false });
  });

  it("fails a qualifying score after the deadline", () => {
    expect(
      scoreMockExam({
        startedAt,
        finishedAt: new Date("2026-09-05T08:50:00.001Z"),
        correctCount: 65,
      }),
    ).toEqual({ expired: true, passed: false });
  });
});
