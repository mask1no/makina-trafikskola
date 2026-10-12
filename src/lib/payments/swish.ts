export function swishActive(
  environment: Record<string, string | undefined> = process.env,
) {
  return environment.SWISH_ACTIVE === "1";
}
