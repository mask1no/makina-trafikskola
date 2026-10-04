import * as Sentry from "@sentry/nextjs";

let reported = false;

export function reportMapFailure() {
  if (reported) return;
  reported = true;
  Sentry.captureMessage("Google Maps failed to load");
}
