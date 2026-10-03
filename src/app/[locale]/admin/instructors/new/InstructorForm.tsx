"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";
import { TEACHING_LANGUAGES } from "@/lib/teachers/languages";

type Location = { id: string; name: string };
type Hours = { enabled: boolean; startTime: string; endTime: string };

const transmissionValues = ["MANUAL", "AUTOMATIC"] as const;

export function InstructorForm({ locations }: { locations: Location[] }) {
  const t = useTranslations("admin.instructors");
  const authT = useTranslations("auth");
  const languageNames = useTranslations("language");
  const errors = useTranslations("errors");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [yearsExperience, setYearsExperience] = useState("0");
  const [languages, setLanguages] = useState<string[]>(["sv"]);
  const [transmissions, setTransmissions] = useState<string[]>(["MANUAL"]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [hours, setHours] = useState<Hours[]>(
    Array.from({ length: 7 }, (_, day) => ({
      enabled: day >= 1 && day <= 5,
      startTime: "09:00",
      endTime: "17:00",
    })),
  );
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  function toggle(
    value: string,
    values: string[],
    setter: (next: string[]) => void,
  ) {
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCreated(false);
    try {
      const response = await fetch("/api/admin/instructors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          initialPassword: password,
          slug,
          yearsExperience: Number(yearsExperience),
          languages,
          transmissions,
          locationIds,
          hours: hours.flatMap((entry, dayOfWeek) =>
            entry.enabled
              ? [
                  {
                    dayOfWeek,
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                  },
                ]
              : [],
          ),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      if (image) {
        const formData = new FormData();
        formData.set("image", image);
        const imageResponse = await fetch(
          `/api/admin/instructors/${payload.id}/image`,
          { method: "POST", body: formData },
        );
        const imagePayload = await imageResponse.json().catch(() => null);
        if (!imageResponse.ok) {
          throw new Error(imagePayload?.error?.code ?? "UNKNOWN");
        }
      }
      setCreated(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setSlug("");
      setImage(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-6 rounded-md border border-border bg-card p-5 sm:p-6"
    >
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-bold">{t("account")}</legend>
        {[
          [t("firstName"), firstName, setFirstName, "given-name", "text"],
          [t("lastName"), lastName, setLastName, "family-name", "text"],
          [t("email"), email, setEmail, "email", "email"],
          [t("initialPassword"), password, setPassword, "new-password", "password"],
          [t("slug"), slug, setSlug, "off", "text"],
          [
            t("yearsExperience"),
            yearsExperience,
            setYearsExperience,
            "off",
            "number",
          ],
        ].map(([label, value, setter, autoComplete, type]) => {
          const id = `instructor-${String(label)}`;
          return (
              <Input
                key={String(label)}
                id={id}
                label={label as string}
                value={value as string}
                onChange={(event) =>
                  (setter as (value: string) => void)(event.target.value)
                }
                autoComplete={autoComplete as string}
                type={type as string}
                min={type === "number" ? 0 : undefined}
                max={type === "number" ? 70 : undefined}
                required
              />
          );
        })}
        <Input
          id="instructor-phone"
          name="phone"
          type="tel"
          label={t("phone")}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          required
          dir="ltr"
        />
        <p className="text-sm text-ink-muted sm:col-span-2">{authT("phoneHint")}</p>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold">{t("languages")}</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {TEACHING_LANGUAGES.map((language) => (
            <label
              key={language}
              className="flex min-h-11 items-center gap-2 rounded-sm border border-border px-3"
            >
              <input
                type="checkbox"
                checked={languages.includes(language)}
                onChange={() => toggle(language, languages, setLanguages)}
              />
              {languageNames(language)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold">{t("transmissions")}</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {transmissionValues.map((transmission) => (
            <label
              key={transmission}
              className="flex min-h-11 items-center gap-2 rounded-sm border border-border px-3"
            >
              <input
                type="checkbox"
                checked={transmissions.includes(transmission)}
                onChange={() =>
                  toggle(transmission, transmissions, setTransmissions)
                }
              />
              {t(`transmission.${transmission}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold">{t("locations")}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {locations.map((location) => (
            <label
              key={location.id}
              className="flex min-h-11 items-center gap-2 rounded-sm border border-border px-3"
            >
              <input
                type="checkbox"
                checked={locationIds.includes(location.id)}
                onChange={() => toggle(location.id, locationIds, setLocationIds)}
              />
              {location.name}
            </label>
          ))}
        </div>
        {!locations.length ? (
          <p className="mt-3 text-ink-muted">{t("noLocations")}</p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold">{t("hours")}</legend>
        <p className="mt-1 text-sm text-ink-muted">{t("hoursDescription")}</p>
        <div className="mt-3 grid gap-3">
          {hours.map((entry, day) => (
            <div
              key={day}
              className="grid items-end gap-3 rounded-sm border border-border p-3 sm:grid-cols-[10rem_1fr_1fr]"
            >
              <label className="flex min-h-11 items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={entry.enabled}
                  onChange={(event) =>
                    setHours((current) =>
                      current.map((item, index) =>
                        index === day
                          ? { ...item, enabled: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                {t(`day.${day}`)}
              </label>
              {(["startTime", "endTime"] as const).map((field) => (
                <div className="grid gap-2" key={field}>
                  <label
                    htmlFor={`hours-${day}-${field}`}
                    className="text-sm font-bold"
                  >
                    {t(field === "startTime" ? "from" : "to")}
                  </label>
                  <input
                    id={`hours-${day}-${field}`}
                    type="time"
                    value={entry[field]}
                    disabled={!entry.enabled}
                    onChange={(event) =>
                      setHours((current) =>
                        current.map((item, index) =>
                          index === day
                            ? { ...item, [field]: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="min-h-11 rounded-sm border border-border bg-card px-3 disabled:bg-page"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <label htmlFor="instructor-image" className="text-sm font-bold">
          {t("photo")}
        </label>
        <input
          id="instructor-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          className="min-h-11 rounded-sm border border-border bg-card px-3 py-2"
        />
        <p className="text-sm text-ink-muted">{t("photoHelp")}</p>
      </div>

      <Button
        type="submit"
        disabled={
          busy ||
          !languages.length ||
          !transmissions.length ||
          !locationIds.length ||
          !hours.some((entry) => entry.enabled)
        }
      >
        {busy ? t("saving") : t("submit")}
      </Button>
      {created ? (
        <p role="status" className="text-success">
          {t("created")}
        </p>
      ) : null}
      {error ? (
        <Notice tone="danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </Notice>
      ) : null}
    </form>
  );
}
