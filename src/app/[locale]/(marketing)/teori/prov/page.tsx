import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { hasTheoryAccess } from "@/lib/theory/access";

import { ExamClient } from "./ExamClient";

export const dynamic = "force-dynamic";

export default async function TeoriprovPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const [t, errors, session] = await Promise.all([
    getTranslations("theory.exam"),
    getTranslations("errors"),
    auth(),
  ]);
  const now = new Date();
  const paid =
    session?.user?.role === "STUDENT" &&
    (await hasTheoryAccess(db, session.user.id, now));
  const count = paid
    ? await db.theoryQuestion.count({ where: { active: true } })
    : 0;
  const available = Boolean(paid && count >= 65);

  return (
    <div className="px-4 py-12 sm:py-20">
      <article className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6 sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-4xl font-black">{t("title")}</h1>
        <p className="mt-4 text-lg leading-8 text-ink-muted">{t("description")}</p>
        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md bg-page p-4"><dt className="font-bold">{t("questions")}</dt><dd className="mt-1 text-2xl font-black">65</dd></div>
          <div className="rounded-md bg-page p-4"><dt className="font-bold">{t("time")}</dt><dd className="mt-1 text-2xl font-black">50</dd></div>
          <div className="rounded-md bg-page p-4"><dt className="font-bold">{t("pass")}</dt><dd className="mt-1 text-2xl font-black">52</dd></div>
        </dl>
        <p className="mt-8 rounded-sm border border-border bg-page p-4 text-sm text-ink-muted">
          {available
            ? t("ready")
            : session?.user?.role === "STUDENT"
              ? paid
                ? t("unavailable")
                : errors("THEORY_ACCESS_REQUIRED")
              : t("signIn")}
        </p>
        <ExamClient
          locale={params.locale}
          available={available}
          copy={{
            start: t("start"),
            starting: t("starting"),
            finish: t("finish"),
            finishing: t("finishing"),
            next: t("next"),
            selectAnswer: t("selectAnswer"),
            progress: t("progress"),
            timeRemaining: t("timeRemaining"),
            passed: t("passed"),
            failed: t("failed"),
            error: t("error"),
          }}
        />
      </article>
    </div>
  );
}
