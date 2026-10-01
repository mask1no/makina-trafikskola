import { stockholmDateKey } from "@/lib/format/datetime";

export function localDateKey(value: string) {
  return stockholmDateKey(new Date(value));
}

export function addCalendarDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
