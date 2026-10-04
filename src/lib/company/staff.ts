import {
  TEACHING_LANGUAGES,
  type TeachingLanguage,
} from "@/lib/teachers/languages";

export type StaffRole =
  | "trafikskolechef"
  | "utbildningsledare"
  | "trafiklarare";

export type PublicStaffMember = {
  firstName: string;
  lastName: string;
  name: string;
  slug: string;
  role: StaffRole;
  languages: readonly TeachingLanguage[];
};

export const publicStaff: readonly PublicStaffMember[] = [
  {
    firstName: "Aron",
    lastName: "Kessete",
    name: "Aron Kessete",
    slug: "aron-kessete",
    role: "trafikskolechef",
    languages: ["sv", "en", "ti"],
  },
  {
    // TODO: Confirm whether the client's spelling "Micheal" should replace "Mikael".
    firstName: "Goitom",
    lastName: "Mikael",
    name: "Goitom Mikael",
    slug: "goitom-mikael",
    role: "utbildningsledare",
    languages: ["sv", "en", "ti"],
  },
  {
    firstName: "Kidane",
    lastName: "Askelawi",
    name: "Kidane Askelawi",
    slug: "kidane-askelawi",
    role: "trafiklarare",
    languages: ["sv", "ti"],
  },
  {
    firstName: "Azizullah",
    lastName: "Hasanzada",
    name: "Azizullah Hasanzada",
    slug: "azizullah-hasanzada",
    role: "trafiklarare",
    languages: ["sv", "en", "ku"],
  },
  {
    firstName: "Habtom",
    lastName: "Negassi Araya",
    name: "Habtom Negassi Araya",
    slug: "habtom-negassi-araya",
    role: "trafiklarare",
    languages: ["sv", "en", "ti"],
  },
  {
    firstName: "Daniel",
    lastName: "Araya",
    name: "Daniel Araya",
    slug: "daniel-araya",
    role: "trafiklarare",
    languages: ["sv", "ti"],
  },
];

export const COMING_SOON_TEACHING_LANGUAGES = ["so"] as const satisfies readonly TeachingLanguage[];

export function offeredTeachingLanguages(): TeachingLanguage[] {
  const offered = new Set(publicStaff.flatMap((member) => member.languages));
  return TEACHING_LANGUAGES.filter((language) => offered.has(language));
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
