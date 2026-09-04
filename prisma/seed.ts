/**
 * Seed — Makina Trafikskola
 *
 * PROVISIONAL catalogue, scraped from the live WordPress site. Every product is
 * created with `active: false` on purpose: nothing goes on sale until the client
 * confirms the canonical price list (BUILD_SPEC §11.1). The mockup and the live
 * site disagree on the BAS tier and on whether Risk 1 & 2 are bundled.
 *
 * Money is öre (BUILD_SPEC I1): 1845000 = 18 450 kr.
 *
 *   npx prisma db seed
 */
import { PrismaClient, ProductKind, Transmission, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const LOCALES = ["sv", "en", "ti", "ar", "so"] as const;

type Seed = {
  slug: string;
  kind: ProductKind;
  priceOre: number;
  compareAtOre?: number;
  lessonCredits?: number;
  lessonMinutes?: number;
  theoryDays?: number;
  includesRisk1?: boolean;
  includesRisk2?: boolean;
  badge?: string;
  accentHex?: string;
  sv: { name: string; shortDesc: string; features: string[] };
};

const PRODUCTS: Seed[] = [
  {
    slug: "en-korlektion",
    kind: ProductKind.SINGLE_LESSON,
    priceOre: 76100,
    compareAtOre: 89500,
    lessonCredits: 1,
    sv: {
      name: "En körlektion",
      shortDesc: "50 minuter, anpassad efter din nivå.",
      features: ["50 minuter", "Manuell eller automat", "Vi kan hämta dig"],
    },
  },
  {
    slug: "testlektion",
    kind: ProductKind.TEST_LESSON,
    priceOre: 49500,
    lessonCredits: 1,
    sv: {
      name: "Testlektion",
      shortDesc: "Bedömning av din körning och en tydlig plan framåt.",
      features: ["50 minuter", "Personlig utbildningsplan"],
    },
  },
  {
    slug: "korpaket-b5",
    kind: ProductKind.PACKAGE,
    priceOre: 363400,
    compareAtOre: 427400,
    lessonCredits: 5,
    accentHex: "#8A8A93",
    sv: {
      name: "Körpaket B5",
      shortDesc: "5 körlektioner för dig som vill komma igång.",
      features: ["5 körlektioner à 50 min", "Giltigt i 24 månader"],
    },
  },
  {
    slug: "korpaket-b10",
    kind: ProductKind.PACKAGE,
    priceOre: 728900,
    compareAtOre: 857600,
    lessonCredits: 10, // live site says "30 körlektion" — their data bug, see §11.1
    accentHex: "#8A8A93",
    sv: {
      name: "Körpaket B10",
      shortDesc: "10 körlektioner, en stark start mot körkortet.",
      features: ["10 körlektioner à 50 min", "Giltigt i 24 månader"],
    },
  },
  {
    slug: "intensivpaket-silver",
    kind: ProductKind.PACKAGE,
    priceOre: 1045000,
    compareAtOre: 1175000,
    lessonCredits: 10,
    theoryDays: 240,
    includesRisk1: true,
    includesRisk2: true,
    accentHex: "#2563EB",
    sv: {
      name: "Intensivpaket Silver",
      shortDesc: "Snabbare väg till körkortet, med teori.",
      features: ["10 körlektioner", "Risk 1 & Risk 2", "Digital teori 8 mån"],
    },
  },
  {
    slug: "intensivpaket-guld",
    kind: ProductKind.PACKAGE,
    priceOre: 1845000,
    compareAtOre: 1989000,
    lessonCredits: 20,
    theoryDays: 365,
    includesRisk1: true,
    includesRisk2: true,
    badge: "POPULARAST",
    accentHex: "#F5B429",
    sv: {
      name: "Intensivpaket Guld",
      shortDesc: "Komplett paket för dig som vill ta körkort effektivt.",
      features: ["20 körlektioner", "Risk 1 & Risk 2", "Digital teori 12 mån", "Prioriterad bokning"],
    },
  },
  {
    slug: "intensivpaket-platinum",
    kind: ProductKind.PACKAGE,
    priceOre: 2545000,
    compareAtOre: 2790000,
    lessonCredits: 30,
    theoryDays: 365,
    includesRisk1: true,
    includesRisk2: true,
    accentHex: "#7C3AED",
    sv: {
      name: "Intensivpaket Platinum",
      shortDesc: "Maximal förberedelse — vårt mest omfattande paket.",
      features: ["30 körlektioner", "Risk 1 & Risk 2", "Digital teori 12 mån", "VIP-support"],
    },
  },
  {
    slug: "korkortsgaranti",
    kind: ProductKind.GUARANTEE,
    priceOre: 2995000,
    compareAtOre: 3200000,
    lessonCredits: 35,
    theoryDays: 730,
    includesRisk1: true,
    includesRisk2: true,
    sv: {
      name: "Körkortsgaranti",
      shortDesc: "Kör tills du klarar uppkörningen. Fast pris.",
      features: ["30–35 körlektioner", "Personlig utbildningsplan", "Risk 1 & Risk 2"],
    },
  },
  {
    slug: "riskettan",
    kind: ProductKind.COURSE_SEAT,
    priceOre: 49500,
    compareAtOre: 54500,
    includesRisk1: true,
    sv: {
      name: "Riskettan",
      shortDesc: "Obligatorisk riskutbildning del 1.",
      features: ["Obligatorisk för B-körkort", "Flera språk"],
    },
  },
  {
    slug: "korkortsteori",
    kind: ProductKind.THEORY_ACCESS,
    priceOre: 9900,
    compareAtOre: 32000,
    theoryDays: 365,
    sv: {
      name: "Körkortsteori",
      shortDesc: "Över 1200 frågor med ljud och video.",
      features: ["1200+ frågor", "Ljud på ditt språk", "Övningsprov"],
    },
  },
];

async function main() {
  // ── locations ─────────────────────────────────────────────────────────
  // PLACEHOLDER: the live site shows one location. Get the real list (§11.4).
  const uv = await db.location.upsert({
    where: { slug: "upplands-vasby" },
    update: {},
    create: {
      slug: "upplands-vasby",
      name: "Upplands Väsby – Huvudkontor",
      address: "TODO – be kunden om exakt adress",
      city: "Upplands Väsby",
      postalCode: "194 00",
      lat: 59.5194,
      lng: 17.9294,
    },
  });

  // ── catalogue ─────────────────────────────────────────────────────────
  for (const [i, p] of PRODUCTS.entries()) {
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        kind: p.kind,
        active: false, // ← flip only after §11.1 is answered
        sortOrder: i * 10,
        priceOre: p.priceOre,
        compareAtOre: p.compareAtOre ?? null,
        lessonCredits: p.lessonCredits ?? 0,
        lessonMinutes: p.lessonMinutes ?? 50,
        theoryDays: p.theoryDays ?? null,
        includesRisk1: p.includesRisk1 ?? false,
        includesRisk2: p.includesRisk2 ?? false,
        badge: p.badge ?? null,
        accentHex: p.accentHex ?? null,
      },
    });

    // Swedish is authored; the other four are placeholders until translated.
    for (const locale of LOCALES) {
      await db.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: {},
        create: {
          productId: product.id,
          locale,
          name: p.sv.name,
          shortDesc: p.sv.shortDesc,
          features: p.sv.features,
        },
      });
    }
  }

  // ── accounts ──────────────────────────────────────────────────────────
  // Dev only. Never seed these into production.
  if (process.env.NODE_ENV !== "production") {
    const hash = await bcrypt.hash("Passw0rd!", 10);

    await db.user.upsert({
      where: { email: "admin@makina.local" },
      update: {},
      create: {
        email: "admin@makina.local",
        passwordHash: hash,
        role: Role.ADMIN,
        firstName: "Admin",
        lastName: "Makina",
      },
    });

    const teacherUser = await db.user.upsert({
      where: { email: "larare@makina.local" },
      update: {},
      create: {
        email: "larare@makina.local",
        passwordHash: hash,
        role: Role.TEACHER,
        firstName: "Sara",
        lastName: "Johansson",
        teacherProfile: {
          create: {
            slug: "sara-johansson",
            languages: ["sv", "en", "ti"],
            transmissions: [Transmission.MANUAL, Transmission.AUTOMATIC],
            yearsExperience: 5,
          },
        },
      },
      include: { teacherProfile: true },
    });

    if (teacherUser.teacherProfile) {
      await db.teacherLocation.upsert({
        where: {
          teacherId_locationId: {
            teacherId: teacherUser.teacherProfile.id,
            locationId: uv.id,
          },
        },
        update: {},
        create: { teacherId: teacherUser.teacherProfile.id, locationId: uv.id },
      });

      // Mon–Fri 09:00–17:00 local wall clock (R19)
      for (const dayOfWeek of [1, 2, 3, 4, 5]) {
        await db.teacherAvailability.create({
          data: {
            teacherId: teacherUser.teacherProfile.id,
            dayOfWeek,
            startTime: "09:00",
            endTime: "17:00",
            locationId: uv.id,
          },
        });
      }
    }

    await db.user.upsert({
      where: { email: "elev@makina.local" },
      update: {},
      create: {
        email: "elev@makina.local",
        passwordHash: hash,
        role: Role.STUDENT,
        firstName: "Test",
        lastName: "Elev",
        localePref: "ti",
        studentProfile: { create: { preferredLanguages: ["ti", "sv"] } },
      },
    });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
