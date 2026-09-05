"use client";

import { useState } from "react";

type Question = {
  id: string;
  text: string;
  answers: { id: string; text: string }[];
};

type Copy = {
  questionNumber: string;
  submit: string;
  correct: string;
  incorrect: string;
  selectAnswer: string;
  signIn: string;
  error: string;
};

export function StudyQuiz({
  locale,
  questions,
  authenticated,
  copy,
}: {
  locale: string;
  questions: Question[];
  authenticated: boolean;
  copy: Copy;
}) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [results, setResults] = useState<
    Record<string, { correct: boolean; explanation: string | null }>
  >({});
  const [busyId, setBusyId] = useState<string>();
  const [error, setError] = useState<Record<string, string>>({});

  async function answer(question: Question) {
    const answerId = selected[question.id];
    if (!authenticated) {
      setError((value) => ({ ...value, [question.id]: copy.signIn }));
      return;
    }
    if (!answerId) {
      setError((value) => ({ ...value, [question.id]: copy.selectAnswer }));
      return;
    }
    setBusyId(question.id);
    setError((value) => ({ ...value, [question.id]: "" }));
    try {
      const response = await fetch("/api/theory/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: question.id, answerId, locale }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.code);
      setResults((value) => ({
        ...value,
        [question.id]: {
          correct: body.correct,
          explanation: body.explanation,
        },
      }));
    } catch {
      setError((value) => ({ ...value, [question.id]: copy.error }));
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <div className="mt-10 grid gap-8">
      {questions.map((question, index) => {
        const result = results[question.id];
        return (
          <article key={question.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            <div className="border-b border-border bg-card-muted px-6 py-4">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-muted">
              {copy.questionNumber.replace("{number}", String(index + 1))}
            </h2>
            </div>
            <div className="p-6 sm:p-8">
            <p className="text-xl font-bold leading-8">{question.text}</p>
            <fieldset className="mt-5 grid gap-3" disabled={Boolean(result)}>
              <legend className="sr-only">{question.text}</legend>
              {question.answers.map((answer) => (
                <label
                  key={answer.id}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-sm border border-border p-4 transition has-[:checked]:border-surface has-[:checked]:bg-card-muted"
                >
                  <input
                    type="radio"
                    name={`study-${question.id}`}
                    value={answer.id}
                    checked={selected[question.id] === answer.id}
                    onChange={() =>
                      setSelected((value) => ({ ...value, [question.id]: answer.id }))
                    }
                  />
                  <span>{answer.text}</span>
                </label>
              ))}
            </fieldset>
            {!result ? (
              <button
                type="button"
                disabled={busyId === question.id}
                onClick={() => void answer(question)}
                className="mt-4 min-h-11 rounded-sm bg-accent px-5 font-bold text-accent-ink disabled:opacity-60"
              >
                {copy.submit}
              </button>
            ) : (
              <div
                className={`mt-4 rounded-sm border p-4 ${result.correct ? "border-success" : "border-danger"}`}
                aria-live="polite"
              >
                <p className="font-bold">{result.correct ? copy.correct : copy.incorrect}</p>
                {result.explanation ? <p className="mt-2 text-sm">{result.explanation}</p> : null}
              </div>
            )}
            {error[question.id] ? (
              <p className="mt-3 text-sm text-danger" role="alert">{error[question.id]}</p>
            ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
