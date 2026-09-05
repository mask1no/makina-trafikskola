export type LocalizedRow = { locale: string };

function contentValues(item: LocalizedRow) {
  return Object.entries(item as Record<string, unknown>)
    .filter(
      ([key]) =>
        key !== "locale" &&
        key !== "id" &&
        !key.toLowerCase().endsWith("id"),
    )
    .map(([, value]) => value);
}

export function resolveContent<T extends LocalizedRow>(
  translations: readonly T[],
  locale: string,
) {
  const nonEmpty = translations.filter((item) =>
    contentValues(item).some((value) =>
      typeof value === "string"
        ? value.trim().length > 0
        : Array.isArray(value) && value.length > 0,
    ),
  );
  const requested = nonEmpty.find((item) => item.locale === locale);
  const swedish = nonEmpty.find((item) => item.locale === "sv");
  const requestedDuplicatesSwedish =
    locale !== "sv" &&
    requested &&
    swedish &&
    JSON.stringify(contentValues(requested)) ===
      JSON.stringify(contentValues(swedish));
  const translation =
    (!requestedDuplicatesSwedish ? requested : undefined) ??
    swedish ??
    nonEmpty[0] ??
    null;

  return {
    translation,
    swedishOnly: locale !== "sv" && translation?.locale === "sv",
  };
}
