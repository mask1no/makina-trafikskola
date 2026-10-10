export function configuredNumber(name: string, fallback: number) {
  const value = Number(process.env[name] ?? String(fallback));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
