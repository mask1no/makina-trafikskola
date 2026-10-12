"use client";

import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LinkButton } from "@/components/LinkButton";
import { Notice } from "@/components/Notice";
import { normalizeSwedishPhone } from "@/lib/auth/phone";

type Profile = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  localePref: string;
  hasPassword: boolean;
  googleLinked: boolean;
  unusedLessonCredits: number;
};

function useDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return desktop;
}

function SettingCard({
  title,
  value,
  open,
  onToggle,
  children,
  desktop,
}: {
  title: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  desktop: boolean;
}) {
  const t = useTranslations("student.profile");
  return (
    <article className="rounded-md border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-extrabold">{title}</h2>
          <p className="mt-1 break-words text-small text-ink-muted">{value}</p>
        </div>
        <Button type="button" variant="tertiary" onClick={onToggle}>
          {open ? t("close") : t("edit")}
        </Button>
      </div>
      {open && desktop ? (
        <div className="mt-4 grid gap-4 border-t border-border pt-4">{children}</div>
      ) : null}
      {open && !desktop ? (
        <BottomSheet title={title} onClose={onToggle}>
          <div className="grid gap-4">{children}</div>
        </BottomSheet>
      ) : null}
    </article>
  );
}

export function ProfileSettings({ initial }: { initial: Profile }) {
  const t = useTranslations("student.profile");
  const errors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const desktop = useDesktop();
  const [profile, setProfile] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [email, setEmail] = useState(initial.email ?? "");
  const [emailProof, setEmailProof] = useState<"password" | "sms">("password");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordCode, setPasswordCode] = useState("");
  const [passwordProof, setPasswordProof] = useState<"password" | "sms">(
    initial.hasPassword ? "password" : "sms",
  );
  const [newPhone, setNewPhone] = useState("");
  const [lostOld, setLostOld] = useState(false);
  const [currentPhoneCode, setCurrentPhoneCode] = useState("");
  const [newPhoneCode, setNewPhoneCode] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteProof, setDeleteProof] = useState<"password" | "sms">("sms");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteAck, setDeleteAck] = useState(false);

  function errText(code: string) {
    return errors.has(code) ? errors(code) : errors("UNKNOWN");
  }

  async function requestOtp(phone: string, purpose: string) {
    const response = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, purpose }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
    return payload;
  }

  async function saveName() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      setProfile((p) => ({
        ...p,
        firstName: payload.firstName,
        lastName: payload.lastName,
      }));
      setSuccess(t("saved"));
      setOpen(null);
      router.refresh();
    } catch (reason) {
      setError(errText(reason instanceof Error ? reason.message : "UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  async function saveEmail() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/me/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          ...(emailProof === "password"
            ? { password: emailPassword }
            : { code: emailCode }),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.code ?? "UNKNOWN");
      }
      setProfile((p) => ({ ...p, email: email.trim().toLowerCase() }));
      setSuccess(t("emailSaved"));
      setOpen(null);
      router.refresh();
    } catch (reason) {
      setError(errText(reason instanceof Error ? reason.message : "UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/me/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password,
          ...(passwordProof === "password"
            ? { currentPassword }
            : { code: passwordCode }),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.code ?? "UNKNOWN");
      }
      setProfile((p) => ({ ...p, hasPassword: true }));
      setSuccess(t("passwordSaved"));
      setPassword("");
      setCurrentPassword("");
      setPasswordCode("");
      setOpen(null);
    } catch (reason) {
      setError(errText(reason instanceof Error ? reason.message : "UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  async function savePhone() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const normalized = normalizeSwedishPhone(newPhone);
      if (!normalized) throw new Error("INVALID_PHONE");
      const response = await fetch("/api/me/phone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: normalized,
          newCode: newPhoneCode,
          ...(lostOld
            ? { lostOldNumber: true, password: phonePassword || undefined }
            : { currentCode: currentPhoneCode }),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.code ?? "UNKNOWN");
      }
      setProfile((p) => ({ ...p, phone: normalized }));
      setSuccess(t("phoneChanged"));
      setOpen(null);
      router.refresh();
    } catch (reason) {
      setError(errText(reason instanceof Error ? reason.message : "UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  async function removeAccount() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/me", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          confirm: "DELETE",
          unusedCreditsAck: true,
          ...(deleteProof === "password"
            ? { password: deletePassword }
            : { code: deleteCode }),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.code ?? "UNKNOWN");
      }
      await signOut({ callbackUrl: `/${locale}` });
    } catch (reason) {
      setError(errText(reason instanceof Error ? reason.message : "UNKNOWN"));
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 grid gap-4">
      {success ? <Notice tone="success">{success}</Notice> : null}
      {error && !open && !deleteOpen ? (
        <Notice tone="danger">{error}</Notice>
      ) : null}

      <SettingCard
        title={t("name")}
        value={`${profile.firstName} ${profile.lastName}`}
        open={open === "name"}
        onToggle={() => {
          setOpen(open === "name" ? null : "name");
          setError("");
        }}
        desktop={desktop}
      >
        <Input id="profile-first" label={t("firstName")} value={firstName} autoComplete="given-name" onChange={(e) => setFirstName(e.target.value)} required />
        <Input id="profile-last" label={t("lastName")} value={lastName} autoComplete="family-name" onChange={(e) => setLastName(e.target.value)} required />
        {error && open === "name" ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="button" disabled={busy || !firstName.trim()} onClick={() => void saveName()}>
          {busy ? t("saving") : t("save")}
        </Button>
      </SettingCard>

      <SettingCard
        title={t("email")}
        value={profile.email ?? t("missing")}
        open={open === "email"}
        onToggle={() => {
          setOpen(open === "email" ? null : "email");
          setError("");
        }}
        desktop={desktop}
      >
        <Input id="profile-email" type="email" inputMode="email" autoComplete="email" label={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <fieldset className="grid gap-2">
          <legend className="text-small font-bold">{t("confirmWith")}</legend>
          <label className="flex min-h-11 items-center gap-2 text-small">
            <input type="radio" checked={emailProof === "password"} onChange={() => setEmailProof("password")} />
            {t("confirmPassword")}
          </label>
          <label className="flex min-h-11 items-center gap-2 text-small">
            <input type="radio" checked={emailProof === "sms"} onChange={() => setEmailProof("sms")} />
            {t("confirmSms")}
          </label>
        </fieldset>
        {emailProof === "password" ? (
          <Input id="email-password" type="password" label={t("password")} value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} autoComplete="current-password" />
        ) : (
          <div className="grid gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !profile.phone}
              onClick={() => void requestOtp(profile.phone!, "change-email").catch((reason) => setError(errText(reason instanceof Error ? reason.message : "UNKNOWN")))}
            >
              {t("sendCode")}
            </Button>
            <Input id="email-code" label={t("smsCode")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={emailCode} onChange={(e) => setEmailCode(e.target.value)} />
          </div>
        )}
        {error && open === "email" ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="button" disabled={busy} onClick={() => void saveEmail()}>
          {busy ? t("saving") : t("save")}
        </Button>
      </SettingCard>

      <SettingCard
        title={t("password")}
        value={profile.hasPassword ? t("passwordSet") : t("passwordMissing")}
        open={open === "password"}
        onToggle={() => {
          setOpen(open === "password" ? null : "password");
          setError("");
        }}
        desktop={desktop}
      >
        <Input id="new-password" type="password" label={t("newPassword")} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        {profile.hasPassword ? (
          <fieldset className="grid gap-2">
            <legend className="text-small font-bold">{t("confirmWith")}</legend>
            <label className="flex min-h-11 items-center gap-2 text-small">
              <input type="radio" checked={passwordProof === "password"} onChange={() => setPasswordProof("password")} />
              {t("confirmPassword")}
            </label>
            <label className="flex min-h-11 items-center gap-2 text-small">
              <input type="radio" checked={passwordProof === "sms"} onChange={() => setPasswordProof("sms")} />
              {t("confirmSms")}
            </label>
          </fieldset>
        ) : null}
        {passwordProof === "password" && profile.hasPassword ? (
          <Input id="current-password" type="password" label={t("currentPassword")} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
        ) : (
          <div className="grid gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !profile.phone}
              onClick={() => void requestOtp(profile.phone!, "change-password").catch((reason) => setError(errText(reason instanceof Error ? reason.message : "UNKNOWN")))}
            >
              {t("sendCode")}
            </Button>
            <Input id="password-code" label={t("smsCode")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={passwordCode} onChange={(e) => setPasswordCode(e.target.value)} />
          </div>
        )}
        {error && open === "password" ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="button" disabled={busy || password.length < 8} onClick={() => void savePassword()}>
          {busy ? t("saving") : t("save")}
        </Button>
      </SettingCard>

      <SettingCard
        title={t("phone")}
        value={profile.phone ?? t("missing")}
        open={open === "phone"}
        onToggle={() => {
          setOpen(open === "phone" ? null : "phone");
          setError("");
        }}
        desktop={desktop}
      >
        <Input id="new-phone" type="tel" inputMode="tel" autoComplete="tel" label={t("newPhone")} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
        <label className="flex min-h-11 items-start gap-2 text-small">
          <input
            type="checkbox"
            className="mt-1"
            checked={lostOld}
            onChange={(e) => setLostOld(e.target.checked)}
          />
          <span>{t("lostOldNumber")}</span>
        </label>
        {lostOld ? (
          <Input id="phone-password" type="password" autoComplete="current-password" label={t("password")} value={phonePassword} onChange={(e) => setPhonePassword(e.target.value)} hint={t("lostOldNumberHint")} />
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {!lostOld ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !profile.phone}
              onClick={() => void requestOtp(profile.phone!, "change-phone").catch((reason) => setError(errText(reason instanceof Error ? reason.message : "UNKNOWN")))}
            >
              {t("sendCurrentCode")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            disabled={busy || newPhone.trim().length < 3}
            onClick={() => {
              const normalized = normalizeSwedishPhone(newPhone);
              if (!normalized) {
                setError(errText("INVALID_PHONE"));
                return;
              }
              void requestOtp(normalized, "change-phone").catch((reason) =>
                setError(errText(reason instanceof Error ? reason.message : "UNKNOWN")),
              );
            }}
          >
            {t("sendNewCode")}
          </Button>
        </div>
        {!lostOld ? (
          <Input id="current-phone-code" label={t("currentPhoneCode")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={currentPhoneCode} onChange={(e) => setCurrentPhoneCode(e.target.value)} />
        ) : null}
        <Input id="new-phone-code" label={t("newPhoneCode")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={newPhoneCode} onChange={(e) => setNewPhoneCode(e.target.value)} />
        {error && open === "phone" ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="button" disabled={busy || newPhoneCode.length !== 6} onClick={() => void savePhone()}>
          {busy ? t("savingPhone") : t("verifyPhone")}
        </Button>
      </SettingCard>

      <article className="rounded-md border border-border bg-card p-5 shadow-soft">
        <h2 className="font-extrabold">{t("smsLanguage")}</h2>
        <p className="mt-1 text-small text-ink-muted">{t("smsLanguageHelp")}</p>
        <div className="mt-4">
          <LanguageSwitcher authenticated />
        </div>
      </article>

      <section className="rounded-md border border-danger bg-danger-soft p-5 sm:p-6">
        <h2 className="text-xl font-bold">{t("privacyTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{t("privacyDescription")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <LinkButton href="/api/me/export" variant="tertiary">
            {t("export")}
          </LinkButton>
          <Button
            type="button"
            variant="tertiary"
            className="border-danger text-danger hover:bg-danger-soft"
            onClick={() => {
              setDeleteOpen(true);
              setError("");
            }}
          >
            {t("delete")}
          </Button>
        </div>
      </section>

      {deleteOpen ? (
        <BottomSheet
          title={t("delete")}
          onClose={() => {
            if (!busy) {
              setDeleteOpen(false);
              setDeleteAck(false);
            }
          }}
        >
          <p className="leading-7 text-ink-muted">{t("deleteConfirm")}</p>
          {profile.unusedLessonCredits > 0 ? (
            <Notice className="mt-4" tone="danger">
              {t("unusedCreditsWarning", { count: profile.unusedLessonCredits })}
            </Notice>
          ) : null}
          <label className="mt-4 flex min-h-11 items-start gap-2 text-small">
            <input
              type="checkbox"
              className="mt-1"
              checked={deleteAck}
              onChange={(e) => setDeleteAck(e.target.checked)}
            />
            <span>{t("unusedCreditsAck")}</span>
          </label>
          <fieldset className="mt-4 grid gap-2">
            <legend className="text-small font-bold">{t("confirmWith")}</legend>
            <label className="flex min-h-11 items-center gap-2 text-small">
              <input type="radio" checked={deleteProof === "sms"} onChange={() => setDeleteProof("sms")} />
              {t("confirmSms")}
            </label>
            <label className="flex min-h-11 items-center gap-2 text-small">
              <input type="radio" checked={deleteProof === "password"} onChange={() => setDeleteProof("password")} />
              {t("confirmPassword")}
            </label>
          </fieldset>
          {deleteProof === "password" ? (
            <Input id="delete-password" type="password" autoComplete="current-password" className="mt-4" label={t("password")} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
          ) : (
            <div className="mt-4 grid gap-3">
              <Button
                type="button"
                disabled={busy || !profile.phone}
                onClick={() => void requestOtp(profile.phone!, "delete-account").catch((reason) => setError(errText(reason instanceof Error ? reason.message : "UNKNOWN")))}
              >
                {t("deleteSendCode")}
              </Button>
              <Input id="delete-code" label={t("deleteCode")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={deleteCode} onChange={(e) => setDeleteCode(e.target.value)} />
            </div>
          )}
          {error ? <Notice className="mt-4" tone="danger">{error}</Notice> : null}
          <Button
            className="mt-5 w-full border-danger bg-danger text-ink-inverse hover:bg-danger"
            type="button"
            disabled={busy || !deleteAck}
            onClick={() => void removeAccount()}
          >
            {busy ? t("deleting") : t("deleteConfirmAction")}
          </Button>
        </BottomSheet>
      ) : null}
    </div>
  );
}
