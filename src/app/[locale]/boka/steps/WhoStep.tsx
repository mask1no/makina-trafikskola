"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { TEACHING_LANGUAGES } from "@/lib/teachers/languages";
import { EmptyState } from "@/components/EmptyState";
import { TeacherMap } from "@/components/TeacherMap";
import type { TeacherMarker } from "@/components/GoogleMapClient";

import type { Location, Teacher } from "./state";

export function WhoStep({
  locations,
  language,
  languages,
  view,
  teachers,
  teacherId,
  markers,
  mapApiKey,
  onLanguage,
  onView,
  onTeacher,
}: {
  locations: Location[];
  language: string;
  languages: string[];
  view: "list" | "map";
  teachers: Teacher[];
  teacherId: string;
  markers: TeacherMarker[];
  mapApiKey?: string;
  onLanguage: (language: string) => void;
  onView: (view: "list" | "map") => void;
  onTeacher: (teacherId: string) => void;
}) {
  const t = useTranslations("booking");
  const languageNames = useTranslations("language");
  const teachingLanguages = TEACHING_LANGUAGES.filter((item) =>
    languages.includes(item),
  );
  return (
    <section>
      <h2 className="text-3xl font-black">{t("step.who.title")}</h2>
      <fieldset className="mt-5">
        <legend className="font-bold">{t("step.who.languageFirst")}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {teachingLanguages.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => onLanguage(item)}
              aria-pressed={language === item}
              className={`min-h-11 max-w-full break-words hyphens-auto rounded-full border px-4 text-sm font-semibold ${
                language === item
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border bg-card"
              }`}
            >
              {languageNames.has(item) ? languageNames(item) : item.toUpperCase()}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 flex gap-2">
        <Button variant={view === "list" ? "primary" : "tertiary"} onClick={() => onView("list")}>
          {t("step.who.list")}
        </Button>
        <Button variant={view === "map" ? "primary" : "tertiary"} onClick={() => onView("map")}>
          {t("step.who.map")}
        </Button>
      </div>
      {view === "map" && locations[0] ? (
        <div className="mt-5">
          <TeacherMap
            apiKey={mapApiKey}
            center={{ lat: locations[0].lat, lng: locations[0].lng }}
            label={t("step.who.mapLabel")}
            missingKeyTitle={t("step.who.mapUnavailable")}
            missingKeyDescription={t("step.who.mapUnavailableDescription")}
            markers={markers}
            selectedTeacherId={teacherId}
            onSelectTeacher={onTeacher}
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {teachers.map((teacher) => (
            <button
              type="button"
              key={teacher.id}
              onClick={() => onTeacher(teacher.id)}
              aria-pressed={teacherId === teacher.id}
              className={`min-h-20 rounded-md border bg-card p-5 text-start shadow-soft transition hover:border-border-strong ${
                teacherId === teacher.id ? "border-ink ring-2 ring-accent" : "border-border"
              }`}
            >
              <span className="font-bold">{teacher.name}</span>
              <span className="mt-1 block text-sm text-ink-muted">
                {teacher.languages
                  .map((item) => (languageNames.has(item) ? languageNames(item) : item))
                  .join(" · ")}
              </span>
            </button>
          ))}
          {!teachers.length ? (
            <EmptyState title={t("step.who.emptyTitle")} description={t("step.who.empty")} />
          ) : null}
        </div>
      )}
    </section>
  );
}
