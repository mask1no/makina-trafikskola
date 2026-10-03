import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const locales = ["sv", "en", "ti", "ar", "so"] as const;

function flatten(
  value: unknown,
  prefix = "",
  output: Record<string, string> = {},
) {
  if (typeof value === "string") {
    output[prefix] = value;
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const [key, child] of Object.entries(value)) {
    flatten(child, prefix ? `${prefix}.${key}` : key, output);
  }
  return output;
}

function placeholders(values: readonly string[]) {
  const found = new Set<string>();
  for (const value of values) {
    for (const match of value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\s*(?:,|\})/g)) {
      found.add(`{${match[1]}}`);
    }
    for (const match of value.matchAll(/<\/?([A-Za-z][A-Za-z0-9_-]*)\b[^>]*>/g)) {
      found.add(`<${match[1]}>`);
    }
  }
  return [...found].sort().join(" ");
}

function csv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

async function main() {
  const catalogues = Object.fromEntries(
    await Promise.all(
      locales.map(async (locale) => {
        const raw = await readFile(resolve("messages", `${locale}.json`), "utf8");
        return [locale, flatten(JSON.parse(raw) as unknown)] as const;
      }),
    ),
  ) as Record<(typeof locales)[number], Record<string, string>>;
  const keys = Object.keys(catalogues.sv).sort();
  const rows = [
    ["key", ...locales, "placeholders"].map(csv).join(","),
    ...keys.map((key) => {
      const values = locales.map((locale) => catalogues[locale][key] ?? "");
      return [key, ...values, placeholders(values)].map(csv).join(",");
    }),
  ];
  const output = resolve("translations-review.csv");
  await writeFile(output, `\uFEFF${rows.join("\r\n")}\r\n`, "utf8");
  console.log(`Exported ${keys.length} translation rows to translations-review.csv.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Translation export failed");
  process.exitCode = 1;
});
