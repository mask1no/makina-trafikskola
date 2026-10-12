"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";

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
      router.refresh();
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "UNKNOWN";
      setError(errors.has(code) ? errors(code) : errors("UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 grid gap-3 border-t border-border pt-5">
      <h3 className="font-bold">{t("editTitle")}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input id="admin-first" label={t("firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input id="admin-last" label={t("lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Input id="admin-email" type="email" label={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input id="admin-phone" type="tel" label={t("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {saved ? <Notice tone="success">{t("saved")}</Notice> : null}
      <Button type="button" disabled={busy} onClick={() => void save()}>
        {busy ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
