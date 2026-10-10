import { type TeachingLanguage } from "@/lib/teachers/languages";

export type StaffRole =
  | "trafikskolechef"
  | "utbildningsledare"
  | "trafiklarare";

export type PublicStaffMember = {
  firstName: string;
  lastName: string;
  name: string;
  slug: string;
  teacherSlug: string | null;
  role: StaffRole;
  languages: readonly TeachingLanguage[];
};

export const publicStaff: readonly PublicStaffMember[] = [
  {
    firstName: "Aron",
    lastName: "Kessete",
    name: "Aron Kessete",
    slug: "aron-kessete",
    teacherSlug: "aron-kessete",
    role: "trafikskolechef",
    languages: ["sv", "en", "ti"],
  },
  {
    // TODO: Confirm whether the client's spelling "Micheal" should replace "Mikael".
    firstName: "Goitom",
    lastName: "Mikael",
    name: "Goitom Mikael",
    slug: "goitom-mikael",
    teacherSlug: "goitom-mikael",
    role: "utbildningsledare",
    languages: ["sv", "en", "ti"],
  },
  {
    firstName: "Kidane",
    lastName: "Askelawi",
    name: "Kidane Askelawi",
    slug: "kidane-askelawi",
    teacherSlug: "kidane-askelawi",
    role: "trafiklarare",
    languages: ["sv", "ti"],
  },
  {
    firstName: "Azizullah",
    lastName: "Hasanzada",
    name: "Azizullah Hasanzada",
    slug: "azizullah-hasanzada",
    teacherSlug: "azizullah-hasanzada",
    role: "trafiklarare",
    languages: ["sv", "en", "ku"],
  },
  {
    firstName: "Habtom",
    lastName: "Negassi Araya",
    name: "Habtom Negassi Araya",
    slug: "habtom-negassi-araya",
    teacherSlug: "habtom-negassi-araya",
    role: "trafiklarare",
    languages: ["sv", "en", "ti"],
  },
  {
    firstName: "Daniel",
    lastName: "Araya",
    name: "Daniel Araya",
    slug: "daniel-araya",
    teacherSlug: "daniel-araya",
    role: "trafiklarare",
    languages: ["sv", "ti"],
  },
];

export const COMING_SOON_TEACHING_LANGUAGES = ["so"] as const satisfies readonly TeachingLanguage[];

const PUBLIC_TEACHING_LANGUAGES = ["sv", "en", "ti", "ku"] as const;

export function publicTeachingLanguages(codes: readonly string[]): TeachingLanguage[] {
  const present = new Set(codes);
  return PUBLIC_TEACHING_LANGUAGES.filter((code) => present.has(code));
}

export function staffMemberLanguages(
  fallback: readonly TeachingLanguage[],
  fromDatabase: readonly string[] | undefined,
): TeachingLanguage[] {
  const fromProfile = fromDatabase?.length ? publicTeachingLanguages(fromDatabase) : [];
  return fromProfile.length ? fromProfile : publicTeachingLanguages(fallback);
}

export function offeredTeachingLanguages(): TeachingLanguage[] {
  return publicTeachingLanguages(publicStaff.flatMap((member) => member.languages));
}

export function offeredTeachingLanguagesFrom(codes: readonly string[]): TeachingLanguage[] {
  const fromProfiles = publicTeachingLanguages(codes);
  return fromProfiles.length ? fromProfiles : offeredTeachingLanguages();
}

export function sentenceCase(value: string, locale: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLocaleUpperCase(locale) + trimmed.slice(1);
}

export function formatLanguageList(
  codes: readonly TeachingLanguage[],
  locale: string,
  languageName: (code: TeachingLanguage) => string,
) {
  return new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  }).format(codes.map(languageName));
}
