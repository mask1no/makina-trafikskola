"use client";

import { useEffect, useState } from "react";

import { TheoryQuestionImage } from "@/components/TheoryQuestionImage";
import { LinkButton } from "@/components/LinkButton";

type Question = {
  id: string;
  text: string;
  imageUrl: string | null;
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
  imageMissing: string;
  next: string;
  score: string;
  reviewMistakes: string;
  retry: string;
  bookLesson: string;
};

export function StudyQuiz({
  locale,
  questions,
  copy,
  bookHref,
}: {
  locale: string;
  questions: Question[];
  authenticated?: boolean;
  copy: Copy;
  bookHref: string;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string>();
  const [results, setResults] = useState<
    Record<string, { correct: boolean; explanation: string | null; answerId: string }>
  >({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [finished, setFinished] = useState(false);

  const visible = reviewing
    ? questions.filter((question) => results[question.id] && !results[question.id]?.correct)
    : questions;
  const question = visible[index];
  const result = question ? results[question.id] : undefined;

  async function submit(answerId = picked) {
    if (!question || result) return;
    if (!answerId) {
      setError(copy.selectAnswer);
      return;
    }
    setBusy(true);
    setError("");
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
          correct: Boolean(body.correct),
          explanation: body.explanation ?? null,
          answerId,
        },
      }));
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }

  function goNext() {
    if (!question || !result) return;
    if (index + 1 >= visible.length) {
      setFinished(true);
      setReviewing(false);
      return;
    }
    setIndex(index + 1);
    setPicked(undefined);
    setError("");
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!question || finished) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const digit = Number(event.key);
      if (digit >= 1 && digit <= 4 && question.answers[digit - 1] && !result) {
        const answer = question.answers[digit - 1];
        if (!answer) return;
        setPicked(answer.id);
        void submit(answer.id);
      }
      if (event.key === "Enter" && result) goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!questions.length) return null;

  if (finished) {
    const correctCount = questions.filter((item) => results[item.id]?.correct).length;
    return (
      <div className="mt-8 grid gap-4">
        <p className="text-h2 font-black">
          {copy.score
            .replace("{correct}", String(correctCount))
            .replace("{total}", String(questions.length))}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-sm border border-border bg-card px-5 text-small font-bold"
            onClick={() => {
              const misses = questions.filter((item) => !results[item.id]?.correct);
              setReviewing(misses.length > 0);
              setFinished(false);
              setIndex(0);
            }}
          >
            {copy.reviewMistakes}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-sm border border-border bg-card px-5 text-small font-bold"
            onClick={() => {
              setResults({});
              setFinished(false);
              setReviewing(false);
              setIndex(0);
              setPicked(undefined);
            }}
          >
            {copy.retry}
          </button>
          <LinkButton href={bookHref}>{copy.bookLesson}</LinkButton>
        </div>
      </div>
    );
  }

  if (!question) return null;
  const numberLabel = copy.questionNumber
    .replace("{number}", String(index + 1))
    .replace("{n}", String(index + 1));

  return (
    <div className="mt-8 grid gap-6">
      <div className="flex gap-1 overflow-x-auto" aria-label={numberLabel}>
        {questions.map((item, itemIndex) => {
          const itemResult = results[item.id];
          return (
            <button
              key={item.id}
              type="button"
              disabled={!itemResult}
              aria-current={item.id === question.id ? "true" : undefined}
              className={`h-3 min-w-6 flex-1 rounded-sm ${
                itemResult?.correct
                  ? "bg-success-strong"
                  : itemResult
                    ? "bg-danger"
                    : "bg-border"
              }`}
              onClick={() => {
                if (!itemResult) return;
                setFinished(false);
                setReviewing(false);
                setIndex(itemIndex);
              }}
            />
          );
        })}
      </div>
      <p className="text-small font-bold text-ink-muted">{numberLabel}</p>
      <h2 className="text-h3 font-black">{question.text}</h2>
      {question.imageUrl ? (
        <TheoryQuestionImage src={question.imageUrl} alt="" missingLabel={copy.imageMissing} />
      ) : null}
      <div className="grid gap-3">
        {question.answers.map((answer) => {
          const selected = (result?.answerId ?? picked) === answer.id;
          return (
            <button
              key={answer.id}
              type="button"
              disabled={Boolean(result) || busy}
              onClick={() => {
                setPicked(answer.id);
                void submit(answer.id);
              }}
              className={`choice-card relative min-h-[52px] overflow-hidden rounded-md border border-[var(--line)] bg-card px-4 py-3 text-start font-bold shadow-soft ${
                selected ? "text-accent-ink" : ""
              }`}
              data-selected={selected ? "true" : undefined}
            >
              <span className="relative">{answer.text}</span>
            </button>
          );
        })}
      </div>
      {result ? (
        <div className="grid gap-3">
          <p className={result.correct ? "font-bold text-success" : "font-bold text-danger"}>
            {result.correct ? copy.correct : copy.incorrect}
          </p>
          {result.explanation ? <p className="max-w-[70ch] leading-7">{result.explanation}</p> : null}
          <button
            type="button"
            className="inline-flex min-h-11 w-fit items-center rounded-sm bg-accent px-5 text-small font-bold text-accent-ink"
            onClick={goNext}
          >
            {copy.next}
          </button>
        </div>
      ) : null}
      {error ? <p className="text-small font-bold text-danger">{error}</p> : null}
      <style>{`
        .choice-card[data-selected="true"] {
          background-image: linear-gradient(to right, var(--accent), var(--accent));
          background-size: 0 100%;
          background-repeat: no-repeat;
          animation: choice-fill 300ms ease forwards;
        }
        @keyframes choice-fill { to { background-size: 100% 100%; } }
        @media (prefers-reduced-motion: reduce) {
          .choice-card[data-selected="true"] { animation: none; background-size: 100% 100%; }
        }
      `}</style>
    </div>
  );
}
