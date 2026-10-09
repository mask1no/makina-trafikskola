import { z } from "zod";

export const REQUIRED_PRODUCTION_ENVIRONMENT_VARIABLES = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "ELKS_API_USERNAME",
  "ELKS_API_PASSWORD",
  "CRON_SECRET",
] as const;

const requiredProductionEnvironment = z.object({
  DATABASE_URL: z.string().trim().min(1),
  AUTH_SECRET: z.string().trim().min(1),
  AUTH_URL: z.string().trim().url(),
  STRIPE_SECRET_KEY: z.string().trim().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().trim().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().trim().url(),
  ELKS_API_USERNAME: z.string().trim().min(1),
  ELKS_API_PASSWORD: z.string().trim().min(1),
  CRON_SECRET: z.string().trim().min(1),
});

const optionalFeatureGroups = [
  {
    feature: "Google Maps and pickup autocomplete",
    variables: ["GOOGLE_MAPS_BROWSER_KEY", "GOOGLE_MAPS_MAP_ID"],
  },
  {
    feature: "Google Calendar sync",
    variables: ["GOOGLE_CALENDAR_SYNC_ENABLED", "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64"],
  },
  {
    feature: "Google account sign-in",
    variables: ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
  },
  {
    feature: "image uploads",
    variables: [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
      "R2_PUBLIC_URL",
    ],
  },
  {
    feature: "database backup uploads",
    variables: ["R2_BACKUP_BUCKET"],
  },
  {
    feature: "error monitoring",
    variables: ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"],
  },
] as const;

type Environment = Record<string, string | undefined>;

export function validateEnvironment(
  environment: Environment = process.env,
  warn: (message: string) => void = console.warn,
) {
  if (environment.NODE_ENV !== "production") return;

  const parsed = requiredProductionEnvironment.safeParse(environment);
  if (!parsed.success) {
    const variables = Object.keys(
      parsed.error.flatten().fieldErrors,
    ).sort();
    throw new Error(
      `Missing or invalid required production environment variables: ${variables.join(", ")}`,
    );
  }

  for (const group of optionalFeatureGroups) {
    const missing = group.variables.filter(
      (variable) => !environment[variable]?.trim(),
    );
    if (missing.length > 0) {
      warn(
        `[environment] ${group.feature} is degraded; missing optional variables: ${missing.join(", ")}`,
      );
    }
  }
}
