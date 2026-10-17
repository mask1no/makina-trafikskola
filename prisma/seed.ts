/**
 * Seed — Makina Trafikskola
 *
 * Catalogue prices are based on the client-authorized 2026 Stockholm/Upplands
 * Väsby market position.
 *
 * Money is öre (BUILD_SPEC I1): 1845000 = 18 450 kr.
 * Private driving-licence education is subject to 25% VAT in Sweden according
 * to Skatteverket. Displayed catalogue prices include VAT.
 *
 *   npx prisma db seed
 */
import {
  CourseKind,
  PrismaClient,
  ProductKind,
  Transmission,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { publicStaff } from "../src/lib/company/staff";
import { seedTheory } from "./seed-theory";
import farstaBoundary from "../src/lib/areas/boundaries/farsta.json";
import upplandsVasbyBoundary from "../src/lib/areas/boundaries/upplands-vasby.json";

const db = new PrismaClient();

const LOCALES = ["sv", "en", "ti", "ar"] as const;
const RETIRED_INSTRUCTOR_SLUGS = [
  "sara-johansson",
  "amina-hassan",
  "dawit-tesfay",
  "nora-bergstrom",
];
const RETIRED_INSTRUCTOR_EMAILS = [
  "larare@makina.local",
  "amina.hassan@makina.local",
  "dawit.tesfay@makina.local",
  "nora.bergstrom@makina.local",
];
const TIME_ZONE = "Europe/Stockholm";
const PRODUCTION_PRODUCT_SLUGS = new Set([
  "forsta-korlektionen",
  "en-korlektion",
  "korpaket-b3",
  "korpaket-b5",
  "korpaket-b10",
  "korpaket-b20",
  "intensivpaket-silver",
  "intensivpaket-guld",
  "intensivpaket-platinum",
  "korkortsgaranti",
  "riskettan",
  "risktvaan",
  "handledarutbildning",
  "korkortsteori",
]);

type Locale = (typeof LOCALES)[number];
type Translation = { name: string; shortDesc: string; features: string[] };

function stockholmAt(now: Date, daysAhead: number, time: string) {
  const localDate = formatInTimeZone(
    addDays(now, daysAhead),
    TIME_ZONE,
    "yyyy-MM-dd",
  );
  return fromZonedTime(`${localDate}T${time}:00`, TIME_ZONE);
}

// ─── CLIENT DATA — replace before launch ───────────────────────────
function box(lng: number, lat: number, delta = 0.08) {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[
        [lng - delta, lat - delta],
        [lng + delta, lat - delta],
        [lng + delta, lat + delta],
        [lng - delta, lat + delta],
        [lng - delta, lat - delta],
      ]],
    },
  };
}

export const CLIENT_DATA = {
  locations: [
    {
      slug: "farsta",
      name: "Farsta",
      address: "Farsta",
      city: "Farsta",
      postalCode: "123 47",
      lat: 59.243,
      lng: 18.093,
      status: "ACTIVE" as const,
      officeAddress: null as string | null,
      boundary: farstaBoundary,
    },
    {
      slug: "upplands-vasby",
      name: "Upplands Väsby",
      address: "Centralvägen 5",
      city: "Upplands Väsby",
      postalCode: "194 77",
      lat: 59.5194,
      lng: 17.9088,
      status: "ACTIVE" as const,
      officeAddress: "Centralvägen 5, 194 77 Upplands Väsby",
      boundary: upplandsVasbyBoundary,
    },
    {
      slug: "uppsala",
      name: "Uppsala",
      address: "Uppsala",
      city: "Uppsala",
      postalCode: "753 10",
      lat: 59.858,
      lng: 17.638,
      status: "COMING_SOON" as const,
      officeAddress: null as string | null,
      boundary: box(17.638, 59.858),
    },
  ],
} as const;

// Names, roles and teaching languages are confirmed. Mock hours and gearboxes
// are applied only in development, inside main().
const confirmedInstructors = publicStaff.map((member) => ({
  email: `${member.slug}@makina.local`,
  firstName: member.firstName,
  lastName: member.lastName,
  slug: member.slug,
  role: member.role,
  languages: [...member.languages],
  transmissions: [] as Transmission[],
  yearsExperience: 0,
  locationSlug: member.slug === "kidane-askelawi" ? "farsta" : "upplands-vasby",
  days: [] as number[],
  startTime: "08:00",
  endTime: "17:00",
}));

const ROLE_TITLE: Record<
  (typeof publicStaff)[number]["role"],
  Record<Locale, string>
> = {
  trafikskolechef: {
    sv: "trafikskolechef",
    en: "principal",
    ti: "ሓላፊ ትራፊክ ትምህርቲ",
    ar: "مدير المدرسة",
  },
  utbildningsledare: {
    sv: "utbildningsledare",
    en: "head of training",
    ti: "ሓላፊ ትምህርቲ",
    ar: "مسؤول التدريب",
  },
  trafiklarare: {
    sv: "trafiklärare",
    en: "driving instructor",
    ti: "መምህር ትራፊክ",
    ar: "معلّم قيادة",
  },
};

const LANGUAGE_NAME: Record<Locale, Record<string, string>> = {
  sv: { sv: "svenska", en: "engelska", ti: "tigrinska", ar: "arabiska", ku: "kurdiska" },
  en: { sv: "Swedish", en: "English", ti: "Tigrinya", ar: "Arabic", ku: "Kurdish" },
  ti: { sv: "ስዊድን", en: "እንግሊዝ", ti: "ትግርኛ", ar: "ዓረብ", ku: "ኩርዲሽ" },
  ar: { sv: "السويدية", en: "الإنجليزية", ti: "التغرينية", ar: "العربية", ku: "الكردية" },
};

function languageList(languages: readonly string[], locale: Locale) {
  const names = languages.map((language) => LANGUAGE_NAME[locale][language] ?? language);
  if (names.length <= 1) return names[0] ?? "";
  const conjunction = { sv: "och", en: "and", ti: "እና", ar: "و" }[locale];
  return `${names.slice(0, -1).join(", ")} ${conjunction} ${names.at(-1)}`;
}

function instructorBio(
  instructor: (typeof confirmedInstructors)[number],
  locale: Locale,
) {
  const name = instructor.firstName;
  const role = ROLE_TITLE[instructor.role][locale];
  const languages = languageList(instructor.languages, locale);
  if (locale === "en") {
    return `${name} is ${role} at Makina Trafikskola in Upplands Väsby and teaches in ${languages}.`;
  }
  if (locale === "ti") {
    return `${name} ኣብ ማኪና ትራፊክስኮላ ኣብ ኡፕላንድስ ቬስቢ ${role} እዩ። ብ${languages} የስልጥን።`;
  }
  if (locale === "ar") {
    return `${name} ${role} في ماكينا ترافيك سكولا في أوبلاندس فيسبي، ويدّرس بـ${languages}.`;
  }
  return `${name} är ${role} på Makina Trafikskola i Upplands Väsby och undervisar på ${languages}.`;
}
// ──────────────────────────────────────────────────────────────────

type Seed = {
  slug: string;
  kind: ProductKind;
  active: boolean;
  priceOre: number;
  compareAtOre?: number;
  lessonCredits?: number;
  lessonMinutes?: number;
  includesTheory?: boolean;
  includesRisk1?: boolean;
  includesRisk2?: boolean;
  badge?: string;
  accentHex?: string;
  isIntroOffer?: boolean;
  translations: Record<Locale, Translation>;
};

const PRODUCTS: Seed[] = [
  {
    slug: "forsta-korlektionen",
    kind: ProductKind.SINGLE_LESSON,
    active: true,
    priceOre: 49900,
    compareAtOre: 84500,
    lessonCredits: 1,
    isIntroOffer: true,
    translations: {
      sv: { name: "Första körlektionen", shortDesc: "Din första lektion hos oss för 499 kr. 50 minuter bakom ratten med en lärare som anpassar tempot efter dig.", features: ["50 minuters körning", "Manuell eller automat", "För dig som inte bokat en körlektion"] },
      en: { name: "First driving lesson", shortDesc: "Your first lesson with us for 499 kr. 50 minutes behind the wheel with an instructor who matches your pace.", features: ["50 minutes of driving", "Manual or automatic", "If you have not booked a driving lesson"] },
      ti: { name: "ቀዳማይ ትምህርቲ ምዝዋር", shortDesc: "ናይ መጀመርታ ትምህርትካ ምስና ን 499 kr። 50 ደቂቅ ድሕሪ መሪሕ መንእሰይ።", features: ["50 ደቂቅ ምዝዋር", "ማንዋል ወይ ኣውቶማቲክ", "ንዘይተመዝገቡ ትምህርቲ ምዝዋር"] },
      ar: { name: "درس القيادة الأول", shortDesc: "درسك الأول معنا مقابل 499 كرونة. 50 دقيقة خلف المقود مع معلّم يضبط السرعة حسبك.", features: ["50 دقيقة قيادة", "يدوي أو أوتوماتيكي", "لمن لم يحجز درس قيادة"] },
    },
  },
  {
    slug: "en-korlektion",
    kind: ProductKind.SINGLE_LESSON,
    active: true,
    priceOre: 84500,
    lessonCredits: 1,
    translations: {
      sv: { name: "En körlektion", shortDesc: "En lektion på 50 minuter. Läraren anpassar tempot efter dig — prova på, träna inför uppkörningen eller komplettera din privata övningskörning.", features: ["50 minuters körning", "Manuell eller automat", "Personlig återkoppling"] },
      en: { name: "Single driving lesson", shortDesc: "A 50-minute lesson. Your instructor matches the pace to you — try a lesson, practise before the driving test, or add lessons beside private practice.", features: ["50 minutes of driving", "Manual or automatic", "Personal feedback"] },
      ti: { name: "ሓደ ትምህርቲ ምዝዋር", shortDesc: "ሓደ ትምህርቲ ን50 ደቒቕ። መምህር ፍጥነትካ ይሰማማዕ — ፈትን፣ ቅድሚ ፈተነ ለምምድ፣ ወይ ብሕታዊ ልምምድካ ምሉእ።", features: ["50 ደቒቕ ምዝዋር", "ማንዋል ወይ ኣውቶማቲክ", "ውልቃዊ ግብረ መልሲ"] },
      ar: { name: "درس قيادة منفرد", shortDesc: "درس مدته 50 دقيقة. يضبط المعلّم السرعة حسبك — جرّب، تدرّب قبل الاختبار، أو أكمل تدريبك الخاص.", features: ["50 دقيقة قيادة", "يدوي أو أوتوماتيكي", "ملاحظات شخصية"] },
    },
  },
  {
    slug: "korpaket-b3",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 229900,
    compareAtOre: 239700,
    lessonCredits: 3,
    accentHex: "#8A8A93",
    translations: {
      sv: { name: "3 körlektioner", shortDesc: "Tre körlektioner à 50 minuter när du vill fylla på snabbt utan att binda dig till ett större paket.", features: ["3 körlektioner à 50 minuter", "Individuell planering med trafiklärare", "Giltigt i 12 månader", "Spara 98 kr"] },
      en: { name: "3 driving lessons", shortDesc: "Three 50-minute lessons when you want to top up quickly without a larger package.", features: ["3 driving lessons of 50 minutes", "Personal planning with an instructor", "Valid for 12 months", "Save 98 kr"] },
      ti: { name: "3 ትምህርቲ ምዝዋር", shortDesc: "ሰለስተ ትምህርቲ ን50 ደቒቕ ንቕልጡፍ ምምላእ ብዘይ ዓቢ ፓኬጅ።", features: ["3 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ውልቃዊ መደብ ምስ መምህር", "ን12 ወርሒ ይሰርሕ", "98 kr ትቑጥብ"] },
      ar: { name: "3 دروس قيادة", shortDesc: "ثلاثة دروس مدة كل منها 50 دقيقة عندما تريد التعزيز بسرعة دون باقة أكبر.", features: ["3 دروس، مدة كل منها 50 دقيقة", "تخطيط فردي مع معلّم", "صالحة لمدة 12 شهرًا", "وفّر 98 كرونة"] },
    },
  },
  {
    slug: "korpaket-b5",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 369900,
    compareAtOre: 399500,
    lessonCredits: 5,
    accentHex: "#8A8A93",
    translations: {
      sv: { name: "Fem körlektioner", shortDesc: "Fem körlektioner med individuell planering, träning i grundläggande körteknik och förberedelse inför uppkörningen. Giltigt i 12 månader.", features: ["5 körlektioner à 50 minuter", "Individuell planering med trafiklärare", "Träning i grundläggande körteknik", "Förberedelse inför uppkörningen", "Giltigt i 12 månader"] },
      en: { name: "Five driving lessons", shortDesc: "Five driving lessons with personal planning, basic technique practice and test preparation. Valid for 12 months.", features: ["5 driving lessons of 50 minutes", "Personal planning with an instructor", "Basic driving technique practice", "Preparation for the driving test", "Valid for 12 months"] },
      ti: { name: "ሓሙሽተ ትምህርቲ ምዝዋር", shortDesc: "ሓሙሽተ ትምህርቲ ምዝዋር ምስ ውልቃዊ መደብ፣ መሰረታዊ ቴክኒክን ናይ ፈተነ ምድላውን። ን12 ወርሒ ይሰርሕ።", features: ["5 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ውልቃዊ መደብ ምስ መምህር", "መሰረታዊ ቴክኒክ ምዝዋር", "ናይ ፈተነ ምድላው", "ን12 ወርሒ ይሰርሕ"] },
      ar: { name: "خمسة دروس قيادة", shortDesc: "خمسة دروس مع تخطيط فردي وتمارين تقنية أساسية والتحضير للاختبار. صالحة 12 شهراً.", features: ["5 دروس، مدة كل منها 50 دقيقة", "تخطيط فردي مع معلّم", "تدريب على التقنية الأساسية", "التحضير لاختبار القيادة", "صالحة لمدة 12 شهرًا"] },
    },
  },
  {
    slug: "korpaket-b10",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 729900,
    compareAtOre: 799000,
    lessonCredits: 10,
    accentHex: "#8A8A93",
    translations: {
      sv: { name: "Tio körlektioner", shortDesc: "Tio körlektioner med individuell planering, träning i grundläggande körteknik och förberedelse inför uppkörningen. Giltigt i 12 månader.", features: ["10 körlektioner à 50 minuter", "Individuell planering med trafiklärare", "Träning i grundläggande körteknik", "Förberedelse inför uppkörningen", "Giltigt i 12 månader"] },
      en: { name: "Ten driving lessons", shortDesc: "Ten driving lessons with personal planning, basic technique practice and test preparation. Valid for 12 months.", features: ["10 driving lessons of 50 minutes", "Personal planning with an instructor", "Basic driving technique practice", "Preparation for the driving test", "Valid for 12 months"] },
      ti: { name: "ዓሰርተ ትምህርቲ ምዝዋር", shortDesc: "ዓሰርተ ትምህርቲ ምዝዋር ምስ ውልቃዊ መደብ፣ መሰረታዊ ቴክኒክን ናይ ፈተነ ምድላውን። ን12 ወርሒ ይሰርሕ።", features: ["10 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ውልቃዊ መደብ ምስ መምህር", "መሰረታዊ ቴክኒክ ምዝዋር", "ናይ ፈተነ ምድላው", "ን12 ወርሒ ይሰርሕ"] },
      ar: { name: "عشرة دروس قيادة", shortDesc: "عشرة دروس مع تخطيط فردي وتمارين تقنية أساسية والتحضير للاختبار. صالحة 12 شهراً.", features: ["10 دروس، مدة كل منها 50 دقيقة", "تخطيط فردي مع معلّم", "تدريب على التقنية الأساسية", "التحضير لاختبار القيادة", "صالحة لمدة 12 شهرًا"] },
    },
  },
  {
    slug: "korpaket-b20",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 1399900,
    compareAtOre: 1598000,
    lessonCredits: 20,
    accentHex: "#8A8A93",
    translations: {
      sv: { name: "20 körlektioner", shortDesc: "Tjugo körlektioner à 50 minuter när du vill bygga upp körningen steg för steg till ett fast paketpris.", features: ["20 körlektioner à 50 minuter", "Individuell planering med trafiklärare", "Giltigt i 12 månader", "Spara 1 981 kr"] },
      en: { name: "20 driving lessons", shortDesc: "Twenty 50-minute lessons when you want to build driving skill step by step at a fixed package price.", features: ["20 driving lessons of 50 minutes", "Personal planning with an instructor", "Valid for 12 months", "Save 1,981 kr"] },
      ti: { name: "20 ትምህርቲ ምዝዋር", shortDesc: "ዕስራ ትምህርቲ ን50 ደቒቕ ንምዝዋርካ ብቐዋሚ ዋጋ ንምሕናጽ።", features: ["20 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ውልቃዊ መደብ ምስ መምህር", "ን12 ወርሒ ይሰርሕ", "1 981 kr ትቑጥብ"] },
      ar: { name: "20 درس قيادة", shortDesc: "عشرون درساً مدة كل منها 50 دقيقة لبناء القيادة خطوة بخطوة بسعر باقة ثابت.", features: ["20 درسًا، مدة كل منها 50 دقيقة", "تخطيط فردي مع معلّم", "صالحة لمدة 12 شهرًا", "وفّر 1 981 كرونة"] },
    },
  },
  {
    slug: "intensivpaket-silver",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 1049500,
    compareAtOre: 1068700,
    lessonCredits: 10,
    includesTheory: true,
    includesRisk1: true,
    includesRisk2: true,
    accentHex: "#2563EB",
    translations: {
      sv: { name: "Intensivpaket Silver", shortDesc: "Tio körlektioner, Riskettan, Risktvåan och digital teori — samlat till ett fast pris. Giltigt i 12 månader.", features: ["10 körlektioner à 50 minuter", "Riskettan – Riskutbildning del 1", "Risktvåan – Halkbana", "Digital teori", "Individuell planering med trafiklärare", "Giltigt i 12 månader"] },
      en: { name: "Silver intensive package", shortDesc: "Ten driving lessons, Risk 1, Risk 2 and digital theory — in one fixed price. Valid for 12 months.", features: ["10 driving lessons of 50 minutes", "Risk 1", "Risk 2 skid pad", "Digital theory", "Personal planning with an instructor", "Valid for 12 months"] },
      ti: { name: "ሲልቨር ጽዑቕ ፓኬጅ", shortDesc: "ዓሰርተ ትምህርቲ፣ ሪስክ 1፣ ሪስክ 2ን ዲጂታላዊ ቲዮሪን ብቐዋሚ ዋጋ። ን12 ወርሒ ይሰርሕ።", features: ["10 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1", "ሪስክ 2", "ዲጂታላዊ ቲዮሪ", "ውልቃዊ መደብ", "ን12 ወርሒ ይሰርሕ"] },
      ar: { name: "الباقة المكثفة الفضية", shortDesc: "عشرة دروس ودورتا المخاطر والنظري الرقمي بسعر ثابت. صالحة 12 شهراً.", features: ["10 دروس، مدة كل منها 50 دقيقة", "المخاطر 1", "المخاطر 2", "نظري رقمي", "تخطيط فردي", "صالحة لمدة 12 شهرًا"] },
    },
  },
  {
    slug: "intensivpaket-guld",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 1849500,
    compareAtOre: 1867700,
    lessonCredits: 20,
    includesTheory: true,
    includesRisk1: true,
    includesRisk2: true,
    badge: "POPULARAST",
    accentHex: "#F5B429",
    translations: {
      sv: { name: "Intensivpaket Guld", shortDesc: "Tjugo körlektioner, Riskettan, Risktvåan och digital teori — vårt vanligaste intensivval. Giltigt i 12 månader.", features: ["20 körlektioner à 50 minuter", "Riskettan – Riskutbildning del 1", "Risktvåan – Halkbana", "Digital teori", "Individuell planering med trafiklärare", "Giltigt i 12 månader"] },
      en: { name: "Gold intensive package", shortDesc: "Twenty driving lessons, Risk 1, Risk 2 and digital theory — our most common intensive choice. Valid for 12 months.", features: ["20 driving lessons of 50 minutes", "Risk 1", "Risk 2 skid pad", "Digital theory", "Personal planning with an instructor", "Valid for 12 months"] },
      ti: { name: "ጎልድ ጽዑቕ ፓኬጅ", shortDesc: "ዕስራ ትምህርቲ፣ ሪስክ 1፣ ሪስክ 2ን ዲጂታላዊ ቲዮሪን። ን12 ወርሒ ይሰርሕ።", features: ["20 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1", "ሪስክ 2", "ዲጂታላዊ ቲዮሪ", "ውልቃዊ መደብ", "ን12 ወርሒ ይሰርሕ"] },
      ar: { name: "الباقة المكثفة الذهبية", shortDesc: "عشرون درساً ودورتا المخاطر والنظري الرقمي. صالحة 12 شهراً.", features: ["20 درسًا، مدة كل منها 50 دقيقة", "المخاطر 1", "المخاطر 2", "نظري رقمي", "تخطيط فردي", "صالحة لمدة 12 شهرًا"] },
    },
  },
  {
    slug: "intensivpaket-platinum",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 2549500,
    compareAtOre: 2666700,
    lessonCredits: 30,
    includesTheory: true,
    includesRisk1: true,
    includesRisk2: true,
    accentHex: "#7C3AED",
    translations: {
      sv: { name: "Intensivpaket Platinum", shortDesc: "Trettio körlektioner, Riskettan, Risktvåan och digital teori för dig som vill ha mer körtid. Giltigt i 12 månader.", features: ["30 körlektioner à 50 minuter", "Riskettan – Riskutbildning del 1", "Risktvåan – Halkbana", "Digital teori", "Individuell planering med trafiklärare", "Giltigt i 12 månader"] },
      en: { name: "Platinum intensive package", shortDesc: "Thirty driving lessons, Risk 1, Risk 2 and digital theory if you want more wheel time. Valid for 12 months.", features: ["30 driving lessons of 50 minutes", "Risk 1", "Risk 2 skid pad", "Digital theory", "Personal planning with an instructor", "Valid for 12 months"] },
      ti: { name: "ፕላቲነም ጽዑቕ ፓኬጅ", shortDesc: "ሰላሳ ትምህርቲ፣ ሪስክ 1፣ ሪስክ 2ን ዲጂታላዊ ቲዮሪን። ን12 ወርሒ ይሰርሕ።", features: ["30 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1", "ሪስክ 2", "ዲጂታላዊ ቲዮሪ", "ውልቃዊ መደብ", "ን12 ወርሒ ይሰርሕ"] },
      ar: { name: "الباقة المكثفة البلاتينية", shortDesc: "ثلاثون درساً ودورتا المخاطر والنظري الرقمي. صالحة 12 شهراً.", features: ["30 درسًا، مدة كل منها 50 دقيقة", "المخاطر 1", "المخاطر 2", "نظري رقمي", "تخطيط فردي", "صالحة لمدة 12 شهرًا"] },
    },
  },
  {
    slug: "korkortsgaranti",
    kind: ProductKind.GUARANTEE,
    active: true,
    priceOre: 3900000,
    compareAtOre: 3299900,
    lessonCredits: 35,
    includesTheory: true,
    includesRisk1: true,
    includesRisk2: true,
    translations: {
      sv: { name: "Körkortsgaranti", shortDesc: "Ett komplett paket med 35 körlektioner, personlig plan, Riskettan, Risktvåan och digital teori. Giltigt i 12 månader.", features: ["35 körlektioner à 50 minuter", "Personlig utbildningsplan", "Riskettan och Risktvåan", "Komplett digitalt teoripaket", "Giltigt i 12 månader"] },
      en: { name: "Driving licence guarantee", shortDesc: "A complete package with 35 driving lessons, a personal plan, Risk 1, Risk 2 and digital theory. Valid for 12 months.", features: ["35 driving lessons of 50 minutes", "Personal training plan", "Risk 1 and Risk 2", "Full digital theory package", "Valid for 12 months"] },
      ti: { name: "ውሕስነት ፍቓድ ምዝዋር", shortDesc: "35 ትምህርትታት ምዝዋር፣ ውልቃዊ መደብ፣ ሪስክ 1ን 2ን ዲጂታላዊ ቲዮሪን ዘጠቓለለ ምሉእ ፓኬጅ። ን12 ወርሒ ይሰርሕ።", features: ["35 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ውልቃዊ መደብ", "ሪስክ 1ን 2ን", "ዲጂታላዊ ቲዮሪ", "ን12 ወርሒ ይሰርሕ"] },
      ar: { name: "ضمان رخصة القيادة", shortDesc: "باقة كاملة تشمل 35 درس قيادة وخطة شخصية ودورتي المخاطر والنظري الرقمي. صالحة لمدة 12 شهرًا.", features: ["35 درسًا، مدة كل منها 50 دقيقة", "خطة تدريب شخصية", "المخاطر 1 و2", "باقة نظري رقمية كاملة", "صالحة لمدة 12 شهرًا"] },
    },
  },
  {
    slug: "riskettan",
    kind: ProductKind.COURSE_SEAT,
    active: true,
    priceOre: 39900,
    includesRisk1: true,
    translations: {
      sv: { name: "Riskettan", shortDesc: "Obligatorisk riskutbildning del 1 för B-körkort.", features: ["Riskbeteenden, alkohol och trötthet", "Kurstid publiceras när tillfällen är klara"] },
      en: { name: "Risk 1", shortDesc: "Mandatory part 1 risk training for a category B licence.", features: ["Risk behaviour, alcohol and fatigue", "Course times appear when occasions are ready"] },
      ti: { name: "ሪስክ 1", shortDesc: "ንፍቓድ B ግዴታዊ ቀዳማይ ክፋል ስልጠና ሓደጋ።", features: ["ባህሪ ሓደጋ፣ ኣልኮላን ድኻምን", "ግዜ ኮርስ ምስ ተዳለወ ይዝርጋሕ"] },
      ar: { name: "المخاطر 1", shortDesc: "الجزء الأول الإلزامي من تدريب المخاطر لرخصة الفئة B.", features: ["سلوك المخاطر والكحول والإرهاق", "تظهر المواعيد عند اعتماد الدورات"] },
    },
  },
  {
    slug: "risktvaan",
    kind: ProductKind.COURSE_SEAT,
    active: true,
    priceOre: 239500,
    includesRisk2: true,
    translations: {
      sv: { name: "Risktvåan", shortDesc: "Obligatorisk praktisk riskutbildning på halkbana för B-körkort. Kursen är 09:00–13:00 på Centralvägen 5, 194 77 Upplands Väsby.", features: ["Praktiska övningar på halkbana", "09:00–13:00", "Centralvägen 5, 194 77 Upplands Väsby"] },
      en: { name: "Risk 2", shortDesc: "Mandatory practical risk training on a skid pad for a category B licence. The course runs 09:00–13:00 at Centralvägen 5, 194 77 Upplands Väsby.", features: ["Practical skid-pad exercises", "09:00–13:00", "Centralvägen 5, 194 77 Upplands Väsby"] },
      ti: { name: "ሪስክ 2", shortDesc: "ንፍቓድ B ግዴታዊ ግብራዊ ስልጠና ሓደጋ ኣብ መንሸራተቲ ሜዳ። ኮርስ 09:00–13:00 ኣብ Centralvägen 5, 194 77 Upplands Väsby።", features: ["ግብራዊ ልምምድ ኣብ መንሸራተቲ ሜዳ", "09:00–13:00", "Centralvägen 5, 194 77 Upplands Väsby"] },
      ar: { name: "المخاطر 2", shortDesc: "التدريب العملي الإلزامي على المخاطر في حلبة الانزلاق لرخصة B. الدورة من 09:00 إلى 13:00 في Centralvägen 5, 194 77 Upplands Väsby.", features: ["تمارين عملية على حلبة الانزلاق", "09:00–13:00", "Centralvägen 5, 194 77 Upplands Väsby"] },
    },
  },
  {
    slug: "handledarutbildning",
    kind: ProductKind.COURSE_SEAT,
    active: true,
    priceOre: 49900,
    translations: {
      sv: { name: "Handledarutbildning", shortDesc: "Introduktionsutbildning för elev och handledare vid privat övningskörning.", features: ["För elev och handledare", "Kurstid publiceras när tillfällen är klara"] },
      en: { name: "Supervisor course", shortDesc: "Introduction course for learners and supervisors practising privately.", features: ["For learner and supervisor", "Course times appear when occasions are ready"] },
      ti: { name: "ስልጠና ተቖጻጻሪ", shortDesc: "ንብሕታዊ ልምምድ ምዝዋር ንተማሃራይን ተቖጻጻሪን መእተዊ ስልጠና።", features: ["ንተማሃራይን ተቖጻጻሪን", "ግዜ ኮርስ ምስ ተዳለወ ይዝርጋሕ"] },
      ar: { name: "دورة المشرف", shortDesc: "دورة تمهيدية للمتعلم والمشرف عند التدريب الخاص على القيادة.", features: ["للمتعلم والمشرف", "تظهر المواعيد عند اعتماد الدورات"] },
    },
  },
  {
    slug: "korkortsteori",
    kind: ProductKind.THEORY_ACCESS,
    active: true,
    priceOre: 39900,
    includesTheory: true,
    translations: {
      sv: { name: "Digital körkortsteori", shortDesc: "Öva kategori för kategori och gör övningsprov med samma upplägg som kunskapsprovet. Köp en gång — tillgången har ingen tidsgräns.", features: ["Obegränsad tillgång, ingen tidsgräns", "Studieläge och övningsprov", "Övningsprov i samma form som kunskapsprovet"] },
      en: { name: "Digital driving theory", shortDesc: "Practise category by category and take mock exams in the same format as the knowledge test. Buy once — access has no time limit.", features: ["Unlimited access, no time limit", "Study mode and mock exams", "Mock tests in the same form as the knowledge test"] },
      ti: { name: "ዲጂታላዊ ቲዮሪ ምዝዋር", shortDesc: "ብዓይነት ብዓይነት ለምምድ እሞ ከም ናይ ፍልጠት ፈተነ ዝኾነ ልምምዲ ፈተነ ግበር። ሓንሳብ ደርጊ — ፍቓድ ግዜ ገደብ የብሉን።", features: ["ዘይተወሰነ ፍቓድ፣ ግዜ ገደብ የለን", "ናይ መጽናዕትን ፈተነን ኣገባብ", "ከም ናይ ፍልጠት ፈተና ዝመስል ልምምድ ፈተና"] },
      ar: { name: "نظري القيادة الرقمي", shortDesc: "تدرّب فئة تلو فئة وأجرِ اختبارات تجريبية بنفس أسلوب اختبار المعرفة. اشترِ مرة واحدة — الوصول بلا مهلة زمنية.", features: ["وصول غير محدود، بلا مهلة زمنية", "وضع دراسة واختبارات تجريبية", "اختبار تجريبي بنفس شكل اختبار المعرفة"] },
    },
  },
];

const MOMENTS: {
  id: string;
  step: number;
  code: string;
  order: number;
  titles: Record<Locale, { title: string; description: string }>;
}[] = [
  {
    id: "1.1",
    step: 1,
    code: "korstallning",
    order: 10,
    titles: {
      sv: { title: "Körställning", description: "Säte, ratt, speglar och säkerhetsbälte." },
      en: { title: "Driving position", description: "Seat, steering wheel, mirrors and seatbelt." },
      ti: { title: "ናይ ምዝዋር ኣቀማምጣ", description: "መንበር፣ መሪሕ መንእሰይ፣ መስትያትን ቀጽሪ ድሕንነትን።" },
      ar: { title: "وضعية القيادة", description: "المقعد والمقود والمرايا وحزام الأمان." },
    },
  },
  {
    id: "1.2",
    step: 1,
    code: "manovrering",
    order: 20,
    titles: {
      sv: { title: "Manövrering", description: "Start, stannande, styrning och växling i lugn miljö." },
      en: { title: "Manoeuvring", description: "Starting, stopping, steering and gear changes in a calm setting." },
      ti: { title: "ምምሕዳር ናይ መኪና", description: "ምጅማር፣ ምእጋት፣ ምምራሕን ምቕያር ማርሻን ኣብ ህዱእ ከባቢ።" },
      ar: { title: "المناورة", description: "الانطلاق والتوقف والتوجيه وتغيير السرعات في مكان هادئ." },
    },
  },
  {
    id: "1.3",
    step: 1,
    code: "inledande-stad",
    order: 30,
    titles: {
      sv: { title: "Inledande stadskörning", description: "Enkla sträckor i tätort med låg trafik." },
      en: { title: "Introductory town driving", description: "Simple stretches in built-up areas with light traffic." },
      ti: { title: "መእተዊ ናይ ከተማ ምዝዋር", description: "ኣብ ውሑድ ትራፊክ ዘለዎ ከተማ ቀሊል መንገድታት።" },
      ar: { title: "قيادة حضرية أولى", description: "مقاطع بسيطة داخل المدينة مع حركة خفيفة." },
    },
  },
  {
    id: "1.4",
    step: 1,
    code: "bromsning",
    order: 40,
    titles: {
      sv: { title: "Inbromsning och avstånd", description: "Mjuk inbromsning och avstånd till framförvarande." },
      en: { title: "Braking and distance", description: "Smooth braking and space to the vehicle in front." },
      ti: { title: "ምዕጻውን ርሕቀትን", description: "ልኡል ምዕጻውን ካብቲ ኣብ ቅድሚኻ ዘሎ ዘላ ርሕቀትን።" },
      ar: { title: "الفرملة والمسافة", description: "فرملة هادئة ومسافة إلى المركبة الأمامية." },
    },
  },
  {
    id: "2.1",
    step: 2,
    code: "vajningsplikt",
    order: 50,
    titles: {
      sv: { title: "Väjningsregler", description: "Högerregeln, huvudled och väjningsplikt." },
      en: { title: "Yielding rules", description: "The right-hand rule, priority roads and duty to give way." },
      ti: { title: "ሕግታት ምሃብ መንገዲ", description: "ሕጊ የማን፣ ቀንዲ መንገዲን ግዴታ ምሃብ መንገዲን።" },
      ar: { title: "قواعد التراجع", description: "قاعدة اليمين والطريق الرئيسي وواجب إفساح المجال." },
    },
  },
  {
    id: "2.2",
    step: 2,
    code: "cirkulationsplats",
    order: 60,
    titles: {
      sv: { title: "Cirkulationsplats", description: "Infart, placering och utfart i rondell." },
      en: { title: "Roundabout", description: "Entry, position and exit in a roundabout." },
      ti: { title: "ዙርያ መንገዲ", description: "ኣታወንታ፣ ኣቀማምጣን ውጻእን ኣብ ራውንድኣባውት።" },
      ar: { title: "الدوّار", description: "الدخول والتموضع والخروج من الدوّار." },
    },
  },
  {
    id: "2.3",
    step: 2,
    code: "landsvag",
    order: 70,
    titles: {
      sv: { title: "Landsväg", description: "Högre fart, omkörning och möte." },
      en: { title: "Rural road", description: "Higher speed, overtaking and oncoming traffic." },
      ti: { title: "ገጠራዊ ጽርግያ", description: "ዝለዓለ ፍጥነት፣ ምሕላፍን መጋጠምን።" },
      ar: { title: "طريق ريفي", description: "سرعة أعلى وتجاوز ومقابلة حركة قادمة." },
    },
  },
  {
    id: "2.4",
    step: 2,
    code: "parkering",
    order: 80,
    titles: {
      sv: { title: "Vändning och parkering", description: "Backning, vändning och parkering i stad." },
      en: { title: "Turning and parking", description: "Reversing, turning and parking in town." },
      ti: { title: "ምምላስን ምዕጻውን", description: "ድሕሪት ምዝዋር፣ ምምላስን ኣብ ከተማ ምዕጻውን።" },
      ar: { title: "الالتفاف والركن", description: "الرجوع والالتفاف والركن في المدينة." },
    },
  },
  {
    id: "3.1",
    step: 3,
    code: "morker",
    order: 90,
    titles: {
      sv: { title: "Mörkerkörning", description: "Halvljus, helljus och avbländning." },
      en: { title: "Night driving", description: "Dipped beam, main beam and dipping for others." },
      ti: { title: "ናይ ጸልማት ምዝዋር", description: "ቕጽበታዊ ብርሃን፣ ሙሉእ ብርሃንን ንኻልኦት ምጉዳል ብርሃንን።" },
      ar: { title: "القيادة ليلاً", description: "الضوء الخافت والضوء العالي وخفض الضوء للآخرين." },
    },
  },
  {
    id: "3.2",
    step: 3,
    code: "halt-vaglag",
    order: 100,
    titles: {
      sv: { title: "Halt väglag", description: "Grepp, avstånd och mjukare manövrer när det är halt." },
      en: { title: "Slippery conditions", description: "Grip, distance and smoother inputs when the road is slippery." },
      ti: { title: "ዝንሸርተት መንገዲ", description: "ምትሕዝዝ ጎማ፣ ርሕቀትን መንገዲ ምስ ዝንሸርተት ልኡል ምምሕዳርን።" },
      ar: { title: "طريق زلق", description: "التماسك والمسافة وحركات ألطف عندما يكون الطريق زلقاً." },
    },
  },
  {
    id: "3.3",
    step: 3,
    code: "motorvag",
    order: 110,
    titles: {
      sv: { title: "Motorväg", description: "Påfart, filbyte och avfart i högre fart." },
      en: { title: "Motorway", description: "Joining, lane changes and leaving at higher speed." },
      ti: { title: "ሞተርዌይ", description: "ምእታው፣ ምቕያር መስመርን ምውጻእን ብዝለዓለ ፍጥነት።" },
      ar: { title: "الطريق السريع", description: "الدخول وتغيير المسار والخروج بسرعة أعلى." },
    },
  },
  {
    id: "3.4",
    step: 3,
    code: "tat-trafik",
    order: 120,
    titles: {
      sv: { title: "Tät trafik", description: "Samspel, placering och lugn i köer." },
      en: { title: "Dense traffic", description: "Cooperation, positioning and staying calm in queues." },
      ti: { title: "ዝተጸናናዐ ትራፊክ", description: "ምትሕብባር፣ ኣቀማምጣን ኣብ ወረፋ ህድኣትን።" },
      ar: { title: "حركة كثيفة", description: "التعاون والتموضع والهدوء في الازدحام." },
    },
  },
  {
    id: "4.1",
    step: 4,
    code: "sparsam-korning",
    order: 130,
    titles: {
      sv: { title: "Sparsam körning", description: "Planering, motorbroms och jämnt tempo." },
      en: { title: "Economical driving", description: "Planning, engine braking and an even pace." },
      ti: { title: "ቁጠባዊ ምዝዋር", description: "ውጥን፣ ምዕጻው ሞተርን ማዕሪ ፍጥነትን።" },
      ar: { title: "قيادة موفّرة", description: "التخطيط والفرملة بالمحرك ووتيرة ثابتة." },
    },
  },
  {
    id: "4.2",
    step: 4,
    code: "sjalvstandig",
    order: 140,
    titles: {
      sv: { title: "Självständig körning", description: "Du navigerar och tar beslut med lite stöd." },
      en: { title: "Independent driving", description: "You navigate and decide with little support." },
      ti: { title: "ውልቀ-ናጻ ምዝዋር", description: "ብውሑድ ደገፍ መንገዲ ትመርሕን ውሳነ ትወስድን።" },
      ar: { title: "قيادة مستقلة", description: "تتنقّل وتقرّر مع قليل من الدعم." },
    },
  },
  {
    id: "4.3",
    step: 4,
    code: "uppkorning",
    order: 150,
    titles: {
      sv: { title: "Uppkörningsförberedelse", description: "Helhetsbedömning inför Trafikverkets körprov." },
      en: { title: "Driving-test preparation", description: "An overall assessment before the Trafikverket driving test." },
      ti: { title: "ናይ ፈተነ ምዝዋር ምድላው", description: "ቅድሚ ፈተነ ምዝዋር ናይ ትራፊክቨርከት ምሉእ ግምገማ።" },
      ar: { title: "الاستعداد لاختبار القيادة", description: "تقييم شامل قبل اختبار القيادة لدى Trafikverket." },
    },
  },
];

function keptPhoto(current: string | null) {
  if (!current || current.startsWith("/instructors/")) return null;
  return current;
}

async function main() {
  const now = new Date();
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT_ID) ||
    process.env.RAILWAY_ENVIRONMENT === "production" ||
    process.env.RAILWAY_ENVIRONMENT_NAME === "production" ||
    process.env.VERCEL_ENV === "production";
  const locationsToSeed = CLIENT_DATA.locations;
  const instructorsToSeed = confirmedInstructors;
  const productsToSeed = isProduction
    ? PRODUCTS.filter((product) => PRODUCTION_PRODUCT_SLUGS.has(product.slug))
    : PRODUCTS;

  if (process.env.NODE_ENV === "test") {
    await db.rateLimit.deleteMany();
  }

  await db.product.updateMany({
    where: { OR: [{ slug: "testlektion" }, { kind: ProductKind.TEST_LESSON }] },
    data: { active: false },
  });

  const locationsBySlug = new Map<string, string>();
  for (const location of locationsToSeed) {
    const row = await db.location.upsert({
      where: { slug: location.slug },
      update: {
        name: location.name,
        address: location.address,
        city: location.city,
        postalCode: location.postalCode,
        lat: location.lat,
        lng: location.lng,
        active: location.status === "ACTIVE",
        status: location.status,
        officeAddress: location.officeAddress,
        boundary: location.boundary,
      },
      create: {
        slug: location.slug,
        name: location.name,
        address: location.address,
        city: location.city,
        postalCode: location.postalCode,
        lat: location.lat,
        lng: location.lng,
        active: location.status === "ACTIVE",
        status: location.status,
        officeAddress: location.officeAddress,
        boundary: location.boundary,
      },
    });
    locationsBySlug.set(location.slug, row.id);
  }
  await db.location.updateMany({
    where: { slug: { in: ["sollentuna", "kista", "marsta"] } },
    data: { active: false },
  });

  const seededProductIds = new Map<string, string>();
  for (const [i, p] of productsToSeed.entries()) {
    const catalogueData = {
      kind: p.kind,
      active: p.active,
      sortOrder: i * 10,
      priceOre: p.priceOre,
      compareAtOre: p.compareAtOre ?? null,
      vatRatePct: 25,
      currency: "SEK",
      lessonCredits: p.lessonCredits ?? 0,
      lessonMinutes: p.lessonMinutes ?? 50,
      includesTheory: p.includesTheory ?? false,
      includesRisk1: p.includesRisk1 ?? false,
      includesRisk2: p.includesRisk2 ?? false,
      creditValidDays: 365,
      badge: p.badge ?? null,
      accentHex: p.accentHex ?? null,
      isIntroOffer: p.isIntroOffer ?? false,
    };
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: catalogueData,
      create: { slug: p.slug, ...catalogueData },
    });
    seededProductIds.set(p.slug, product.id);

    for (const locale of LOCALES) {
      const translation = p.translations[locale];
      await db.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: {
          name: translation.name,
          shortDesc: translation.shortDesc,
          features: translation.features,
        },
        create: {
          productId: product.id,
          locale,
          name: translation.name,
          shortDesc: translation.shortDesc,
          features: translation.features,
        },
      });
    }
  }

  const mockSchedule = isProduction
    ? null
    : {
        transmissions: [Transmission.MANUAL, Transmission.AUTOMATIC],
        days: [1, 2, 3, 4, 5],
      };

  for (const instructor of instructorsToSeed) {
    const transmissions = mockSchedule?.transmissions ?? instructor.transmissions;
    const days = mockSchedule?.days ?? instructor.days;
    const locationId = locationsBySlug.get(instructor.locationSlug);
    if (!locationId) throw new Error(`Missing location ${instructor.locationSlug}`);

    const user = await db.user.upsert({
      where: { email: instructor.email },
      update: {
        role: Role.TEACHER,
        deletedAt: null,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
      },
      create: {
        email: instructor.email,
        role: Role.TEACHER,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        teacherProfile: {
          create: {
            slug: instructor.slug,
            photoUrl: null,
            languages: [...instructor.languages],
            transmissions: [...transmissions],
            yearsExperience: instructor.yearsExperience,
            active: true,
          },
        },
      },
      include: { teacherProfile: true },
    });

    let profile = user.teacherProfile;
    if (!profile) {
      profile = await db.teacherProfile.create({
        data: {
          userId: user.id,
          slug: instructor.slug,
          photoUrl: null,
          languages: [...instructor.languages],
          transmissions: [...transmissions],
          yearsExperience: instructor.yearsExperience,
          active: true,
        },
      });
    } else {
      profile = await db.teacherProfile.update({
        where: { id: profile.id },
        data: {
          active: true,
          slug: instructor.slug,
          photoUrl: keptPhoto(profile.photoUrl),
          languages: [...instructor.languages],
          transmissions: profile.transmissions.length
            ? profile.transmissions
            : transmissions,
          yearsExperience:
            instructor.yearsExperience > 0
              ? instructor.yearsExperience
              : profile.yearsExperience,
        },
      });
    }
    await db.teacherLocation.deleteMany({ where: { teacherId: profile.id } });
    await db.teacherLocation.create({
      data: { teacherId: profile.id, locationId },
    });

    const existingHours = await db.teacherAvailability.count({
      where: { teacherId: profile.id },
    });
    if (days.length && existingHours === 0) {
      for (const dayOfWeek of days) {
        await db.teacherAvailability.create({
          data: {
            teacherId: profile.id,
            dayOfWeek,
            startTime: instructor.startTime,
            endTime: instructor.endTime,
            locationId,
          },
        });
      }
    }

    for (const locale of LOCALES) {
      const bio = instructorBio(instructor, locale);
      await db.teacherTranslation.upsert({
        where: { teacherId_locale: { teacherId: profile.id, locale } },
        update: {},
        create: { teacherId: profile.id, locale, bio },
      });
    }
  }

  await db.teacherProfile.updateMany({
    where: { slug: { in: RETIRED_INSTRUCTOR_SLUGS } },
    data: { active: false },
  });
  await db.vehicle.updateMany({
    where: { teacher: { slug: { in: RETIRED_INSTRUCTOR_SLUGS } } },
    data: { active: false },
  });
  await db.user.updateMany({
    where: { email: { in: RETIRED_INSTRUCTOR_EMAILS } },
    data: { deletedAt: new Date() },
  });

  for (const course of [
    { id: "seed-course-riskettan", kind: CourseKind.RISK1, slug: "riskettan" },
    { id: "seed-course-risktvaan", kind: CourseKind.RISK2, slug: "risktvaan" },
    {
      id: "seed-course-handledarutbildning",
      kind: CourseKind.HANDLEDARUTBILDNING,
      slug: "handledarutbildning",
    },
  ]) {
    const productId = seededProductIds.get(course.slug);
    if (!productId) continue;
    const risk1Defaults =
      course.kind === CourseKind.RISK1
        ? {
            recurrenceEnabled: true,
            recurrenceDays: [15, 28],
            defaultStartTime: "18:00",
            durationMinutes: 210,
            defaultCapacity: 16,
            defaultVenueName: "Makina Trafikskola, Upplands Väsby",
            defaultVenueAddress: "Centralvägen 5, 194 77 Upplands Väsby",
          }
        : course.kind === CourseKind.RISK2
          ? {
              defaultStartTime: "09:00",
              durationMinutes: 240,
              defaultVenueName: "Makina Trafikskola, Upplands Väsby",
              defaultVenueAddress: "Centralvägen 5, 194 77 Upplands Väsby",
            }
          : {};
    await db.course.upsert({
      where: { id: course.id },
      update: { kind: course.kind, productId, ...risk1Defaults },
      create: { id: course.id, kind: course.kind, productId, ...risk1Defaults },
    });
  }

  const occasions = isProduction ? [] : [
    {
      id: "seed-occasion-riskettan-1",
      courseId: "seed-course-riskettan",
      daysAhead: 10,
      start: "09:00",
      end: "13:00",
      capacity: 16,
      venueName: "Messingen, Upplands Väsby",
      venueAddress: "Utbildningsvägen 2, 194 30 Upplands Väsby",
      teacherId: null,
    },
    {
      id: "seed-occasion-riskettan-2",
      courseId: "seed-course-riskettan",
      daysAhead: 24,
      start: "17:00",
      end: "21:00",
      capacity: 18,
      venueName: "Messingen, Upplands Väsby",
      venueAddress: "Utbildningsvägen 2, 194 30 Upplands Väsby",
      teacherId: null,
    },
    {
      id: "seed-occasion-risktvaan-1",
      courseId: "seed-course-risktvaan",
      daysAhead: 31,
      start: "09:00",
      end: "13:00",
      capacity: 12,
      venueName: "Makina Trafikskola, Upplands Väsby",
      venueAddress: "Centralvägen 5, 194 77 Upplands Väsby",
      teacherId: null,
    },
    {
      id: "seed-occasion-handledar-1",
      courseId: "seed-course-handledarutbildning",
      daysAhead: 42,
      start: "09:00",
      end: "16:00",
      capacity: 24,
      venueName: "Folkets Hus Sollentuna",
      venueAddress: "Kärrdalsskolan, 191 40 Sollentuna",
      teacherId: null,
    },
  ];

  for (const occasion of occasions) {
    await db.courseOccasion.upsert({
      where: { id: occasion.id },
      update: {
        startsAt: stockholmAt(now, occasion.daysAhead, occasion.start),
        endsAt: stockholmAt(now, occasion.daysAhead, occasion.end),
        capacity: occasion.capacity,
        venueName: occasion.venueName,
        venueAddress: occasion.venueAddress,
        language: "sv",
        teacherId: occasion.teacherId,
        cancelled: false,
      },
      create: {
        id: occasion.id,
        courseId: occasion.courseId,
        startsAt: stockholmAt(now, occasion.daysAhead, occasion.start),
        endsAt: stockholmAt(now, occasion.daysAhead, occasion.end),
        capacity: occasion.capacity,
        venueName: occasion.venueName,
        venueAddress: occasion.venueAddress,
        language: "sv",
        teacherId: occasion.teacherId,
      },
    });
  }

  for (const moment of MOMENTS) {
    await db.moment.upsert({
      where: { id: moment.id },
      update: { step: moment.step, code: moment.code, order: moment.order },
      create: {
        id: moment.id,
        step: moment.step,
        code: moment.code,
        order: moment.order,
      },
    });
    for (const locale of LOCALES) {
      const content = moment.titles[locale];
      await db.momentTranslation.upsert({
        where: { momentId_locale: { momentId: moment.id, locale } },
        update: { title: content.title, description: content.description },
        create: {
          momentId: moment.id,
          locale,
          title: content.title,
          description: content.description,
        },
      });
    }
  }

  await seedTheory(db);

  // Dev only. Railway and Vercel are checked as well because deployment seed
  // jobs do not always set NODE_ENV explicitly.
  if (!isProduction) {
    const hash = await bcrypt.hash("Passw0rd!", 10);

    await db.user.upsert({
      where: { email: "admin@makina.local" },
      update: {
        passwordHash: hash,
        role: Role.ADMIN,
        deletedAt: null,
        firstName: "Admin",
        lastName: "Makina",
      },
      create: {
        email: "admin@makina.local",
        passwordHash: hash,
        role: Role.ADMIN,
        firstName: "Admin",
        lastName: "Makina",
      },
    });

    for (const instructor of confirmedInstructors) {
      await db.user.update({
        where: { email: instructor.email },
        data: { passwordHash: hash, deletedAt: null, role: Role.TEACHER },
      });
    }

    const studentUser = await db.user.upsert({
      where: { email: "elev@makina.local" },
      update: {
        passwordHash: hash,
        role: Role.STUDENT,
        deletedAt: null,
        firstName: "Test",
        lastName: "Elev",
        localePref: "ti",
      },
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
    await db.studentProfile.upsert({
      where: { userId: studentUser.id },
      update: { preferredLanguages: ["ti", "sv"] },
      create: {
        userId: studentUser.id,
        preferredLanguages: ["ti", "sv"],
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
