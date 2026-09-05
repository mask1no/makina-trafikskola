export type ExamQuestionCandidate = {
  id: string;
  difficulty: number;
};

const EXAM_MINUTES = 50;
const PASSING_SCORE = 52;

export function scoreMockExam(input: {
  startedAt: Date;
  finishedAt: Date;
  correctCount: number;
}) {
  const expiresAt = new Date(
    input.startedAt.getTime() + EXAM_MINUTES * 60 * 1000,
  );
  const expired = input.finishedAt >= expiresAt;

  return {
    expired,
    passed: !expired && input.correctCount >= PASSING_SCORE,
  };
}

function seedNumber(seed: string) {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function shuffle<T>(values: T[], seed: string) {
  const result = [...values];
  let state = seedNumber(seed) || 1;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/**
 * BUILD_SPEC fixes the exam at 65 questions but gives no difficulty ratio.
 * Use a near-even 22/22/21 mix; when a bucket is short, fill from the seeded
 * remainder so the exam remains available without reverting to easiest-first.
 */
export function composeMockExam(
  candidates: ExamQuestionCandidate[],
  seed: string,
) {
  const targets = new Map([
    [1, 22],
    [2, 22],
    [3, 21],
  ]);
  const selected: ExamQuestionCandidate[] = [];
  const selectedIds = new Set<string>();

  for (const [difficulty, target] of targets) {
    for (const question of shuffle(
      candidates.filter((item) => item.difficulty === difficulty),
      `${seed}:${difficulty}`,
    ).slice(0, target)) {
      selected.push(question);
      selectedIds.add(question.id);
    }
  }

  if (selected.length < 65) {
    for (const question of shuffle(
      candidates.filter((item) => !selectedIds.has(item.id)),
      `${seed}:fallback`,
    ).slice(0, 65 - selected.length)) {
      selected.push(question);
    }
  }

  return shuffle(selected, `${seed}:order`).slice(0, 65);
}
