import { z } from "zod";

const requiredProductionEnvironment = z.object({
  DATABASE_URL: z.string().trim().min(1),
  AUTH_SECRET: z.string().trim().min(1),
  STRIPE_SECRET_KEY: z.string().trim().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().trim().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().trim().url(),
});

const optionalFeatureGroups = [
  {
    feature: "Google Maps and pickup autocomplete",
    variables: [
      "NEXT_PUBLIC_GOOGLE_MAPS_KEY",
      "GOOGLE_MAPS_SERVER_KEY",
    ],
  },
  {
    feature: "transactional email delivery",
    variables: ["RESEND_API_KEY", "RESEND_FROM"],
  },
  {
    feature: "SMS delivery",
    variables: ["ELKS_API_USERNAME", "ELKS_API_PASSWORD"],
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
