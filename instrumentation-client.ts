import { sentryPrivacyOptions } from "@/lib/monitoring/sentry";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

const sentry = dsn
  ? import("@sentry/nextjs").then((sdk) => {
      sdk.init({
        dsn,
        ...sentryPrivacyOptions,
      });
      return sdk;
    })
  : null;

export function onRouterTransitionStart(
  ...args: Parameters<
    typeof import("@sentry/nextjs").captureRouterTransitionStart
  >
) {
  void sentry?.then((sdk) => sdk.captureRouterTransitionStart(...args));
}
