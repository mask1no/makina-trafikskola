"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Question = {
  id: string;
  text: string;
  imageUrl: string | null;
  answers: { id: string; text: string }[];
};

type Copy = {
  start: string;
  starting: string;
  finish: string;
  finishing: string;
  next: string;
  selectAnswer: string;
  progress: string;
  timeRemaining: string;
  passed: string;
  failed: string;
  error: string;
};

type Result = { correctCount: number; questionCount: number; passed: boolean };

export function ExamClient({
  locale,
  available,
  copy,
}: {
  locale: string;
  available: boolean;
  copy: Copy;
}) {
  const [sessionId, setSessionId] = useState<string>();
  const [expiresAt, setExpiresAt] = useState<string>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answerId, setAnswerId] = useState("");
  const [remaining, setRemaining] = useState(50 * 60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result>();

  const finish = useCallback(async () => {
    if (!sessionId || result) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/theory/exam/${sessionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "finish" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.code);
      setResult(body);
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }, [copy.error, result, sessionId]);

  useEffect(() => {
    if (!expiresAt || result) return;
    const update = () => {
      const seconds = Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) void finish();
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, finish, result]);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const createdResponse = await fetch("/api/theory/exam", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const created = await createdResponse.json();
      if (!createdResponse.ok) throw new Error(created.error?.code);
      const examResponse = await fetch(
        `/api/theory/exam/${created.id}?locale=${encodeURIComponent(locale)}`,
      );
      const exam = await examResponse.json();
      if (!examResponse.ok || exam.questions.length !== 65) {
        throw new Error(exam.error?.code);
      }
      setSessionId(exam.id);
      setExpiresAt(exam.expiresAt);
      setQuestions(exam.questions);
      setRemaining(Math.max(0, Math.ceil((Date.parse(exam.expiresAt) - Date.now()) / 1000)));
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    const question = questions[index];
    if (!question || !answerId || !sessionId) {
      setError(copy.selectAnswer);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/theory/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: question.id, answerId, sessionId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.code);
      setAnswerId("");
      if (index === questions.length - 1) await finish();
      else setIndex((value) => value + 1);
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <section className="mt-8 rounded-md bg-page p-6 text-center" aria-live="polite">
        <p className="text-3xl font-black [direction:ltr]">
          {result.correctCount}/{result.questionCount} · {result.passed ? copy.passed : copy.failed}
        </p>
      </section>
    );
  }

  if (!sessionId) {
    return (
      <div className="mt-8">
        <button
          type="button"
          disabled={!available || busy}
          onClick={() => void start()}
          className="min-h-11 w-full rounded-sm bg-accent px-5 font-bold text-accent-ink disabled:cursor-not-allowed disabled:bg-border disabled:text-ink-muted"
        >
          {busy ? copy.starting : copy.start}
        </button>
        {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
      </div>
    );
  }

  const question = questions[index];
  const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");

  return (
    <section className="mt-8" aria-labelledby="exam-question">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-page p-4">
        <p>{copy.progress.replace("{current}", String(index + 1)).replace("{total}", "65")}</p>
        <p aria-live="polite">
          {copy.timeRemaining}{" "}
          <span className="font-black tabular-nums [direction:ltr]">{minutes}:{seconds}</span>
        </p>
      </div>
      <h2 id="exam-question" className="mt-6 text-xl font-black">{question.text}</h2>
      {question.imageUrl ? (
        <Image
          src={question.imageUrl}
          alt={question.text}
          width={800}
          height={450}
          unoptimized
          className="mt-4 h-auto w-full rounded-md"
        />
      ) : null}
      <fieldset className="mt-5 grid gap-3">
        <legend className="sr-only">{question.text}</legend>
        {question.answers.map((answer) => (
          <label
            key={answer.id}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-border p-3 has-[:checked]:border-accent has-[:checked]:bg-page"
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={answer.id}
              checked={answerId === answer.id}
              onChange={() => setAnswerId(answer.id)}
            />
            <span>{answer.text}</span>
          </label>
        ))}
      </fieldset>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submitAnswer()}
          className="min-h-11 flex-1 rounded-sm bg-accent px-5 font-bold text-accent-ink disabled:opacity-60"
        >
          {copy.next}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void finish()}
          className="min-h-11 rounded-sm border border-border px-5 font-bold disabled:opacity-60"
        >
          {busy ? copy.finishing : copy.finish}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
    </section>
  );
}
