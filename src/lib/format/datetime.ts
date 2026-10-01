const TIME_ZONE = "Europe/Stockholm";

const formatters = new Map<string, Intl.DateTimeFormat>();

function cacheKey(locale: string, options: Intl.DateTimeFormatOptions) {
  return `${locale}\0${JSON.stringify(options)}`;
}

export function stockholmFormatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
) {
  const resolved: Intl.DateTimeFormatOptions = {
    ...options,
    timeZone: TIME_ZONE,
    numberingSystem: "latn",
  };
  const key = cacheKey(locale, resolved);
  const existing = formatters.get(key);
  if (existing) return existing;
  const created = new Intl.DateTimeFormat(locale, resolved);
  formatters.set(key, created);
  return created;
}

export function formatStockholm(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
) {
  return stockholmFormatter(locale, options).format(date);
}

/** Compact lesson stamp: "tors 1 okt 09:00". */
export function formatLessonDateTime(date: Date, locale: string) {
  return formatStockholm(date, locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function formatLessonTime(date: Date, locale: string) {
  return formatStockholm(date, locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
) {
  return formatStockholm(date, locale, options);
}

export function formatWeekday(
  date: Date,
  locale: string,
  width: "long" | "short" | "narrow" = "long",
) {
  return formatStockholm(date, locale, { weekday: width });
}

/** Absolute local cancellation deadline, never a relative "24 hours". */
export function formatDeadline(date: Date, locale: string) {
  return formatStockholm(date, locale, {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const partsFormatter = stockholmFormatter("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function stockholmParts(date: Date) {
  const parts = Object.fromEntries(
    partsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: parts.year ?? 0,
    month: parts.month ?? 0,
    day: parts.day ?? 0,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

export function stockholmDateKey(date: Date) {
  const parts = stockholmParts(date);
  const month = parts.month.toString().padStart(2, "0");
  const day = parts.day.toString().padStart(2, "0");
  return `${parts.year.toString().padStart(4, "0")}-${month}-${day}`;
}
