"use client";

import Image from "next/image";
import { useRef, useState } from "react";

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
  streak: string;
  best: string;
  correct: string;
  incorrect: string;
  next: string;
  finish: string;
  score: string;
  retry: string;
  error: string;
  history: string;
};

type HistoryItem = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  picked: string;
  correct: boolean;
  explanation: string | null;
};

const CORRECT_DELAY_MS = 800;
const INCORRECT_DELAY_MS = 2800;

export function RoadSignGame({
  locale,
  questions,
  copy,
  initialStreak = 0,
  initialBest = 0,
  startIndex = 0,
}: {
  locale: string;
  questions: RoadSignQuestion[];
  copy: Copy;
  initialStreak?: number;
  initialBest?: number;
  startIndex?: number;
}) {
  const [index, setIndex] = useState(startIndex);
  const [result, setResult] = useState<{
    answerId: string;
    correct: boolean;
    correctAnswerId: string | null;
    explanation: string | null;
  }>();
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(initialStreak);
  const [bestStreak, setBestStreak] = useState(Math.max(initialBest, initialStreak));
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const advanceTimer = useRef<number | null>(null);
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
        correctAnswerId?: string | null;
        explanation?: string | null;
      };
      if (!response.ok || typeof body.correct !== "boolean") {
        throw new Error("ATTEMPT_FAILED");
      }
      if (body.correct) {
        setScore((value) => value + 1);
        setStreak((value) => {
          const nextStreak = value + 1;
          setBestStreak((best) => Math.max(best, nextStreak));
          return nextStreak;
        });
      } else {
        setStreak(0);
      }
      setResult({
        answerId,
        correct: body.correct,
        correctAnswerId: body.correctAnswerId ?? null,
        explanation: body.explanation ?? null,
      });
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      const atEnd = index + 1 >= questions.length;
      const snapshot: HistoryItem = {
        id: question.id,
        prompt: question.text,
        imageUrl: question.imageUrl,
        picked: question.answers.find((option) => option.id === answerId)?.text ?? "",
        correct: body.correct,
        explanation: body.explanation ?? null,
      };
      advanceTimer.current = window.setTimeout(() => {
        setHistory((items) => [snapshot, ...items]);
        if (atEnd) setFinished(true);
        else setIndex((value) => value + 1);
        setResult(undefined);
        setError("");
      }, body.correct ? CORRECT_DELAY_MS : INCORRECT_DELAY_MS);
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    setIndex(0);
    setResult(undefined);
    setScore(0);
    setFinished(false);
    setError("");
    setHistory([]);
  }

  const historyList = history.length ? (
    <section className="mt-10">
      <h3 className="text-xl font-black">{copy.history}</h3>
      <ul className="mt-4 grid gap-3">
        {history.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3 rounded-md border border-border bg-card p-3 shadow-soft"
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt=""
                width={72}
                height={72}
                unoptimized
                className="size-16 object-contain"
              />
            ) : (
              <span />
            )}
            <div>
              <p className="font-black">{item.prompt}</p>
              <p className={`mt-1 text-sm font-bold ${item.correct ? "text-[var(--success)]" : "text-danger"}`}>
                {item.correct ? copy.correct : copy.incorrect}
                {item.picked ? ` · ${item.picked}` : ""}
              </p>
              {item.explanation ? (
                <p className="mt-1 text-sm text-ink-muted">{item.explanation}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  if (!question) return null;
  if (finished) {
    return (
      <div>
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
        {historyList}
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto mt-10 grid max-w-3xl justify-items-center gap-6 text-center">
        <div className="w-full">
          <p className="numbers-ltr text-sm font-bold text-ink-muted">
            {copy.progress
              .replace("{current}", String(index + 1))
              .replace("{total}", String(questions.length))}
            {" · "}
            {copy.streak.replace("{count}", String(streak))}
            {" · "}
            {copy.best.replace("{count}", String(bestStreak))}
          </p>
          <h2 className="mt-3 text-2xl font-black">{question.text}</h2>
          <div className="mt-4 grid min-h-72 place-items-center rounded-lg border border-border bg-card p-6 shadow-soft">
            {question.imageUrl ? (
              <Image
                key={question.id}
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
        </div>
        <div className="w-full">
          <div className="grid gap-3 sm:grid-cols-2">
            {question.answers.map((option) => {
              const revealed = Boolean(result);
              const isCorrectOption = revealed && result?.correctAnswerId === option.id;
              const isWrongPick =
                revealed && result?.answerId === option.id && result.correct === false;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={busy || revealed}
                  data-selected={isCorrectOption ? "true" : undefined}
                  className={`choice-card min-h-[52px] rounded-md border bg-card px-4 py-3 text-center font-bold shadow-soft disabled:cursor-default ${
                    isWrongPick
                      ? "border-danger"
                      : isCorrectOption
                        ? "border-[var(--success)]"
                        : "border-border"
                  }`}
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
            </div>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm font-bold text-danger" aria-live="polite">
              {error}
            </p>
          ) : null}
        </div>
      </div>
      {historyList}
    </div>
  );
}
