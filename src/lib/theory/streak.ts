export function answerStreaks(attempts: readonly { correct: boolean }[]) {
  let best = 0;
  let current = 0;
  for (const attempt of attempts) {
    current = attempt.correct ? current + 1 : 0;
    if (current > best) best = current;
  }
  return { current, best };
}
