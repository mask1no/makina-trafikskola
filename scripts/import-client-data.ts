import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

const OFFERED_TEACHING_LANGUAGES = ["sv", "en", "ti", "ku"] as const;

const root = path.join(process.cwd(), "client-data");
const apply = process.argv.includes("--apply");

const teacherSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  phone: z.string().regex(/^\+467\d{8}$/),
  email: z.string().regex(/^[^\s@]+@makina\.se$/),
  languages: z.array(z.enum(OFFERED_TEACHING_LANGUAGES)).min(1),
  gearbox: z.enum(["MANUAL", "AUTOMATIC", "BOTH"]),
  areas: z.array(z.string()).min(1),
  hours: z.array(z.object({
    day: z.number().int().min(0).max(6),
    from: z.string().regex(/^\d{2}:\d{2}$/),
    to: z.string().regex(/^\d{2}:\d{2}$/),
    area: z.string().min(1),
  })),
  yearsExperience: z.number().int().min(0).optional(),
  googleCalendarEmail: z.string().email().optional(),
  payRateKr: z.number().int().min(0).optional(),
  photo: z.string().min(1),
});

function imageSize(buffer: Buffer) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker === 0xc0 || marker === 0xc2) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + length;
    }
  }
  return null;
}

async function main() {
  let teachersRaw: string;
  try {
    teachersRaw = await readFile(path.join(root, "teachers.json"), "utf8");
  } catch {
    console.log("client-data/ not found. Nothing to check.");
    return;
  }
  const problems: string[] = [];
  const parsed = z.array(teacherSchema).safeParse(JSON.parse(teachersRaw));
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      problems.push(`teachers.json ${issue.path.join(".")}: ${issue.message}`);
    }
  }
  const teachers = parsed.success ? parsed.data : [];
  for (const teacher of teachers) {
    const photoPath = path.join(root, "photos", teacher.photo);
    try {
      const bytes = await readFile(photoPath);
      const size = imageSize(bytes);
      if (!size || size.width < 600 || size.height < 600) {
        problems.push(`${teacher.slug}: photo must be at least 600×600`);
      }
    } catch {
      problems.push(`${teacher.slug}: photo file is missing`);
    }
    for (const hour of teacher.hours) {
      if (hour.from >= hour.to) {
        problems.push(`${teacher.slug}: hour ${hour.from}–${hour.to} is invalid`);
      }
    }
  }

  const areaDir = path.join(root, "areas");
  let areaFiles: string[] = [];
  try {
    areaFiles = (await readdir(areaDir)).filter((file) => file.endsWith(".geojson"));
  } catch {
    problems.push("areas/ is missing");
  }
  for (const file of areaFiles) {
    try {
      const geo = JSON.parse(await readFile(path.join(areaDir, file), "utf8")) as {
        type?: string;
        geometry?: { type?: string };
      };
      const type = geo.type === "Feature" ? geo.geometry?.type : geo.type;
      if (type !== "Polygon" && type !== "MultiPolygon") {
        problems.push(`${file}: GeoJSON must be a Polygon or MultiPolygon`);
      }
    } catch {
      problems.push(`${file}: invalid JSON`);
    }
  }

  if (problems.length) {
    console.log("client-data problems:");
    for (const problem of problems) console.log(`- ${problem}`);
    process.exitCode = 1;
    return;
  }
  if (!apply) {
    console.log(`client-data ok: ${teachers.length} teachers, ${areaFiles.length} areas.`);
    return;
  }
  console.log("client:apply writes teachers, photos and area boundaries. No secrets printed.");
  const { db } = await import("../src/lib/db");
  for (const teacher of teachers) {
    console.log(`upsert ${teacher.slug} (${teacher.email.replace(/(.{2}).+(@.*)/, "$1…$2")})`);
    await db.user.upsert({
      where: { email: teacher.email },
      update: { role: "TEACHER", phone: teacher.phone, deletedAt: null },
      create: {
        email: teacher.email,
        phone: teacher.phone,
        role: "TEACHER",
        firstName: teacher.name.split(" ")[0] ?? teacher.name,
        lastName: teacher.name.split(" ").slice(1).join(" ") || teacher.slug,
        teacherProfile: {
          create: {
            slug: teacher.slug,
            languages: teacher.languages,
            transmissions:
              teacher.gearbox === "BOTH"
                ? ["MANUAL", "AUTOMATIC"]
                : [teacher.gearbox],
            yearsExperience: teacher.yearsExperience ?? 0,
            googleCalendarEmail: teacher.googleCalendarEmail,
            payRateOre: teacher.payRateKr != null ? teacher.payRateKr * 100 : null,
            active: true,
          },
        },
      },
    });
  }
  for (const file of areaFiles) {
    const slug = file.replace(/\.geojson$/, "");
    const boundary = JSON.parse(await readFile(path.join(areaDir, file), "utf8"));
    const updated = await db.location.updateMany({
      where: { slug },
      data: { boundary },
    });
    console.log(`area ${slug}: ${updated.count === 1 ? "updated" : "not found"}`);
  }
  console.log("Photos stay local until R2 and sharp are available in this environment.");
  await db.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "client import failed");
  process.exitCode = 1;
});
