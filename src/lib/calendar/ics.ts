export function utcCalendarDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function escapeCalendarText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export function foldLine(line: string) {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const chunks: string[] = [];
  let start = 0;
  let width = 75;
  while (start < bytes.length) {
    let end = Math.min(bytes.length, start + width);
    while (end > start && end < bytes.length && (bytes[end]! & 0xc0) === 0x80) {
      end -= 1;
    }
    if (end === start) end = Math.min(bytes.length, start + width);
    chunks.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
    width = 74;
  }
  return chunks
    .map((chunk, index) => (index === 0 ? chunk : ` ${chunk}`))
    .join("\r\n");
}

export function buildCalendar(input: {
  prodId: string;
  name?: string;
  timezone?: string;
  refreshInterval?: string;
  now: Date;
  events: Array<{
    uid: string;
    startsAt: Date;
    endsAt: Date;
    summary: string;
    description?: string;
    location?: string;
    status?: string;
  }>;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${input.prodId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(input.name ? [`X-WR-CALNAME:${escapeCalendarText(input.name)}`] : []),
    ...(input.timezone ? [`X-WR-TIMEZONE:${input.timezone}`] : []),
    ...(input.refreshInterval
      ? [`REFRESH-INTERVAL:${input.refreshInterval}`]
      : []),
    ...input.events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${utcCalendarDate(input.now)}`,
      `DTSTART:${utcCalendarDate(event.startsAt)}`,
      `DTEND:${utcCalendarDate(event.endsAt)}`,
      `SUMMARY:${escapeCalendarText(event.summary)}`,
      ...(event.description
        ? [`DESCRIPTION:${escapeCalendarText(event.description)}`]
        : []),
      ...(event.location
        ? [`LOCATION:${escapeCalendarText(event.location)}`]
        : []),
      ...(event.status ? [`STATUS:${event.status}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return `${lines.map((line) => foldLine(line)).join("\r\n")}\r\n`;
}
