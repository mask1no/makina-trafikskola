"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";

type RoadSignQuestion = {
  id: string;
  text: string;
  imageUrl: string | null;
  answers: { id: string; text: string }[];
};

type Copy = {
  progress: string;
  correct: string;
  incorrect: string;
  next: string;
  finish: string;
  score: string;
  retry: string;
  error: string;
};

export function RoadSignGame({
  locale,
  questions,
  copy,
}: {
  locale: string;
  questions: RoadSignQuestion[];
  copy: Copy;
}) {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<{
    answerId: string;
    correct: boolean;
    explanation: string | null;
  }>();
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const question = questions[index];

  async function answer(answerId: string) {
    if (!question || result || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/theory/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: question.id, answerId, locale }),
      });
      const body = (await response.json()) as {
        correct?: boolean;
        explanation?: string | null;
      };
      if (!response.ok) throw new Error("ATTEMPT_FAILED");
      const correct = Boolean(body.correct);
      if (correct) setScore((value) => value + 1);
      setResult({
        answerId,
        correct,
        explanation: body.explanation ?? null,
      });
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setResult(undefined);
    setError("");
  }

  function retry() {
    setIndex(0);
    setResult(undefined);
    setScore(0);
    setFinished(false);
    setError("");
  }

  if (!question) return null;
  if (finished) {
    return (
      <div className="mt-10 rounded-lg border border-border bg-card p-7 text-center shadow-soft">
        <p className="numbers-ltr text-4xl font-black">
          {copy.score
            .replace("{correct}", String(score))
            .replace("{total}", String(questions.length))}
        </p>
        <Button className="mt-6" type="button" onClick={retry}>
          {copy.retry}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <div className="grid min-h-72 place-items-center rounded-lg border border-border bg-card p-6 shadow-soft">
        {question.imageUrl ? (
          <Image
            src={question.imageUrl}
            alt=""
            width={240}
            height={240}
            sizes="(max-width: 1024px) 192px, 240px"
            unoptimized
            className="size-48 object-contain sm:size-60"
            priority={index === 0}
          />
        ) : null}
      </div>
      <div>
        <p className="numbers-ltr text-sm font-bold text-ink-muted">
          {copy.progress
            .replace("{current}", String(index + 1))
            .replace("{total}", String(questions.length))}
        </p>
        <h2 className="mt-3 text-2xl font-black">{question.text}</h2>
        <div className="mt-6 grid gap-3">
          {question.answers.map((option) => {
            const selected = result?.answerId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={busy || Boolean(result)}
                data-selected={selected ? "true" : undefined}
                className="choice-card min-h-[52px] rounded-md border border-border bg-card px-4 py-3 text-start font-bold shadow-soft disabled:cursor-default"
                onClick={() => void answer(option.id)}
              >
                {option.text}
              </button>
            );
          })}
        </div>
        {result ? (
          <div className="mt-5">
            <Notice tone={result.correct ? "success" : "danger"}>
              <strong>{result.correct ? copy.correct : copy.incorrect}</strong>
              {result.explanation ? (
                <span className="mt-1 block">{result.explanation}</span>
              ) : null}
            </Notice>
            <Button className="mt-4" type="button" onClick={next}>
              {index + 1 >= questions.length ? copy.finish : copy.next}
            </Button>
          </div>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm font-bold text-danger" aria-live="polite">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
