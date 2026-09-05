import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const locales = ["sv", "en", "ti", "ar", "so"] as const;

function keys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  );
}

async function main() {
  const entries = await Promise.all(
    locales.map(async (locale) => {
      const raw = await readFile(resolve("messages", `${locale}.json`), "utf8");
      return [locale, JSON.parse(raw) as unknown] as const;
    }),
  );
  const baseline = new Set(keys(entries[0][1]));
  const failures: string[] = [];

  for (const [locale, messages] of entries) {
    const localeKeys = new Set(keys(messages));
    const missing = [...baseline].filter((key) => !localeKeys.has(key));
    const extra = [...localeKeys].filter((key) => !baseline.has(key));
    if (missing.length) failures.push(`${locale} missing: ${missing.join(", ")}`);
    if (extra.length) failures.push(`${locale} extra: ${extra.join(", ")}`);
  }
  if (failures.length) throw new Error(failures.join("\n"));
  console.log(`Translation parity passed for ${locales.length} locales.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Translation check failed");
  process.exit(1);
});
