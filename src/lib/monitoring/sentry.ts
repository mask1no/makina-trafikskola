import type { ErrorEvent } from "@sentry/nextjs";

const SENSITIVE_KEY =
  /(?:address|authorization|cookie|email|first.?name|last.?name|lesson.?note|next.?focus|password|phone|pickup|postal|student.?note|summary|token)/i;
const PII_VALUE =
  /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+\d[\d\s()-]{7,}\d)/i;

function scrubValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, seen));
  }
  if (typeof value === "string" && PII_VALUE.test(value)) return "[Filtered]";
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[Filtered]" : scrubValue(entry, seen),
    ]),
  );
}

function withoutQuery(value: string | undefined) {
  if (!value) return value;
  try {
    const url = new URL(value, "http://sentry.invalid");
    url.search = "";
    return value.startsWith("/") ? url.pathname : url.toString();
  } catch {
    return value.split("?")[0];
  }
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  event.user = undefined;
  event.message = undefined;
  event.logentry = undefined;

  if (event.request) {
    event.request.url = withoutQuery(event.request.url);
    event.request.query_string = undefined;
    event.request.cookies = undefined;
    event.request.headers = undefined;
    event.request.data = undefined;
  }

  if (event.transaction) event.transaction = withoutQuery(event.transaction);
  if (event.extra) event.extra = scrubValue(event.extra) as ErrorEvent["extra"];
  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as ErrorEvent["contexts"];
  }
  if (event.tags) event.tags = scrubValue(event.tags) as ErrorEvent["tags"];
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((exception) => ({
      ...exception,
      value: exception.type ?? "Error",
    }));
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      message: undefined,
      data: breadcrumb.data
        ? (scrubValue(breadcrumb.data) as typeof breadcrumb.data)
        : undefined,
    }));
  }
  if (event.spans) {
    event.spans = event.spans.map((span) => ({
      ...span,
      description: withoutQuery(span.description),
      data: scrubValue(span.data ?? {}) as NonNullable<typeof span.data>,
    }));
  }

  return event;
}

export const sentryPrivacyOptions = {
  sendDefaultPii: false,
  beforeSend: scrubSentryEvent,
};
