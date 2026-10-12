"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";

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

export function StudentEditor({
  student,
}: {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
}) {
  const t = useTranslations("admin.students");
  const errors = useTranslations("errors");
  const router = useRouter();
  const desktop = useDesktop();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(student.firstName);
  const [lastName, setLastName] = useState(student.lastName);
  const [email, setEmail] = useState(student.email ?? "");
  const [phone, setPhone] = useState(student.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: email.trim() ? email.trim().toLowerCase() : null,
          phone: phone.trim() ? phone.trim() : null,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.code ?? "UNKNOWN");
      }
      setSaved(true);
      setOpen(false);
      router.refresh();
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "UNKNOWN";
      setError(errors.has(code) ? errors(code) : errors("UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  const form = (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="admin-first"
          label={t("firstName")}
          value={firstName}
          autoComplete="given-name"
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          id="admin-last"
          label={t("lastName")}
          value={lastName}
          autoComplete="family-name"
          onChange={(e) => setLastName(e.target.value)}
        />
        <Input
          id="admin-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          label={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          id="admin-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          label={t("phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {saved && desktop ? <Notice tone="success">{t("saved")}</Notice> : null}
      <Button type="button" className="w-full" disabled={busy} onClick={() => void save()}>
        {busy ? t("saving") : t("save")}
      </Button>
    </div>
  );

  return (
    <div className="mt-5 grid gap-3 border-t border-border pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">{t("editTitle")}</h3>
        <Button
          type="button"
          variant="tertiary"
          onClick={() => {
            setOpen((value) => !value);
            setError("");
            setSaved(false);
          }}
        >
          {open ? t("close") : t("edit")}
        </Button>
      </div>
      {open && desktop ? form : null}
      {open && !desktop ? (
        <BottomSheet
          title={t("editTitle")}
          onClose={() => {
            setOpen(false);
            setError("");
          }}
        >
          {form}
        </BottomSheet>
      ) : null}
    </div>
  );
}
