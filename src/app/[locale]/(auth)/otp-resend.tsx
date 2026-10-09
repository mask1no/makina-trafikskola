"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/Input";

export function OtpResend({
  code,
  onCodeChange,
  codeSent,
  secondsLeft,
  devCode,
  busy,
  onResend,
  hint = false,
  children,
}: {
  code: string;
  onCodeChange: (value: string) => void;
  codeSent: boolean;
  secondsLeft: number;
  devCode: string;
  busy: boolean;
  onResend: () => void;
  hint?: boolean;
  children?: ReactNode;
}) {
  const t = useTranslations("auth");
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-200 ease-premium ${
        codeSent ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <div className="grid gap-3 pt-1">
          <Input
            name="code"
            label={t("code")}
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required={codeSent}
            disabled={!codeSent}
          />
          {hint ? <p className="text-small leading-6 text-ink-muted">{t("codeSentHint")}</p> : null}
          {devCode ? (
            <p className="rounded-sm bg-page p-3 text-small text-ink">
              {t("devCode", { code: devCode })}
            </p>
          ) : null}
          {children}
          <button
            type="button"
            onClick={onResend}
            disabled={busy || secondsLeft > 0}
            className="min-h-11 text-start text-small font-bold text-ink underline disabled:no-underline disabled:opacity-60"
          >
            {secondsLeft > 0 ? t("resendWait", { seconds: secondsLeft }) : t("resendCode")}
          </button>
        </div>
      </div>
    </div>
  );
}
