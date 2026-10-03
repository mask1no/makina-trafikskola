export const TEACHING_LANGUAGES = ["sv", "en", "ti", "ku", "ar", "so"] as const;

export type TeachingLanguage = (typeof TEACHING_LANGUAGES)[number];

export function isTeachingLanguage(value: string): value is TeachingLanguage {
  return (TEACHING_LANGUAGES as readonly string[]).includes(value);
}
