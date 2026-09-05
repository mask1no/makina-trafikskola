/**
 * Seed — Makina Trafikskola
 *
 * Catalogue prices are based on the client-authorized 2026 Stockholm/Upplands
 * Väsby market position. Only products that can be delivered with the current
 * operational setup are active.
 *
 * Money is öre (BUILD_SPEC I1): 1845000 = 18 450 kr.
 * VAT is provisionally 25% for every product and still requires confirmation
 * from the client's accountant before launch (BUILD_SPEC §11.7).
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

const db = new PrismaClient();

const LOCALES = ["sv", "en", "ti", "ar", "so"] as const;

type Locale = (typeof LOCALES)[number];
type Translation = { name: string; shortDesc: string; features: string[] };

type Seed = {
  slug: string;
  kind: ProductKind;
  active: boolean;
  priceOre: number;
  compareAtOre?: number;
  lessonCredits?: number;
  lessonMinutes?: number;
  theoryDays?: number;
  includesRisk1?: boolean;
  includesRisk2?: boolean;
  badge?: string;
  accentHex?: string;
  translations: Record<Locale, Translation>;
};

const PRODUCTS: Seed[] = [
  {
    slug: "en-korlektion",
    kind: ProductKind.SINGLE_LESSON,
    active: true,
    priceOre: 79500,
    lessonCredits: 1,
    translations: {
      sv: { name: "En körlektion", shortDesc: "50 minuter med undervisning anpassad efter din nivå.", features: ["50 minuters körning", "Manuell eller automat", "Personlig återkoppling"] },
      en: { name: "Single driving lesson", shortDesc: "50 minutes of instruction adapted to your level.", features: ["50 minutes of driving", "Manual or automatic", "Personal feedback"] },
      ti: { name: "ሓደ ትምህርቲ ምዝዋር", shortDesc: "ንደረጃኻ ዝተመጣጠነ ናይ 50 ደቒቕ ትምህርቲ።", features: ["50 ደቒቕ ምዝዋር", "ማንዋል ወይ ኣውቶማቲክ", "ውልቃዊ ግብረ መልሲ"] },
      ar: { name: "درس قيادة منفرد", shortDesc: "خمسون دقيقة من التدريب الملائم لمستواك.", features: ["50 دقيقة قيادة", "يدوي أو أوتوماتيكي", "ملاحظات شخصية"] },
      so: { name: "Hal cashar wadis", shortDesc: "50 daqiiqo oo tababar ku habboon heerkaaga.", features: ["50 daqiiqo oo wadis ah", "Gacanta ama otomaatig", "Qiimayn kuu gaar ah"] },
    },
  },
  {
    slug: "testlektion",
    kind: ProductKind.TEST_LESSON,
    active: true,
    priceOre: 49500,
    lessonCredits: 1,
    translations: {
      sv: { name: "Testlektion", shortDesc: "Vi bedömer din körning och ger dig en tydlig plan framåt.", features: ["50 minuters nivåbedömning", "Personlig utbildningsplan"] },
      en: { name: "Assessment lesson", shortDesc: "We assess your driving and give you a clear plan for the next steps.", features: ["50-minute level assessment", "Personal training plan"] },
      ti: { name: "ናይ ግምገማ ትምህርቲ", shortDesc: "ኣዘዋውራኻ ንግምግምን ንቐጻሊ ንጹር መደብ ንህበካን።", features: ["ናይ 50 ደቒቕ ግምገማ ደረጃ", "ውልቃዊ መደብ ትምህርቲ"] },
      ar: { name: "درس تقييم", shortDesc: "نقيّم قيادتك ونضع لك خطة واضحة للخطوات التالية.", features: ["تقييم مستوى لمدة 50 دقيقة", "خطة تدريب شخصية"] },
      so: { name: "Cashar qiimayn ah", shortDesc: "Waxaan qiimaynaa wadistaada oo ku siinaynaa qorshe cad oo aad ku sii socoto.", features: ["Qiimayn heer oo 50 daqiiqo ah", "Qorshe tababar oo qofeed"] },
    },
  },
  {
    slug: "korpaket-b5",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 369500,
    compareAtOre: 397500,
    lessonCredits: 5,
    accentHex: "#8A8A93",
    translations: {
      sv: { name: "Körpaket B5", shortDesc: "Fem körlektioner för dig som vill komma igång.", features: ["5 körlektioner à 50 minuter", "Giltigt i 24 månader", "Spara 280 kr"] },
      en: { name: "B5 driving package", shortDesc: "Five driving lessons to help you get started.", features: ["5 driving lessons of 50 minutes", "Valid for 24 months", "Save 280 kr"] },
      ti: { name: "ፓኬጅ ምዝዋር B5", shortDesc: "ንምጅማር ዝሕግዙኻ ሓሙሽተ ትምህርትታት ምዝዋር።", features: ["5 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ን24 ወርሒ ይሰርሕ", "280 kr ትቑጥብ"] },
      ar: { name: "باقة القيادة B5", shortDesc: "خمسة دروس قيادة تساعدك على البدء.", features: ["5 دروس، مدة كل منها 50 دقيقة", "صالحة لمدة 24 شهرًا", "وفّر 280 كرونة"] },
      so: { name: "Xirmada wadista B5", shortDesc: "Shan cashar wadis oo kaa caawinaya inaad bilowdo.", features: ["5 cashar oo min 50 daqiiqo ah", "Waxay shaqaynaysaa 24 bilood", "Kaydi 280 kr"] },
    },
  },
  {
    slug: "korpaket-b10",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 719000,
    compareAtOre: 795000,
    lessonCredits: 10,
    accentHex: "#8A8A93",
    translations: {
      sv: { name: "Körpaket B10", shortDesc: "Tio körlektioner som ger dig en stadig grund.", features: ["10 körlektioner à 50 minuter", "Giltigt i 24 månader", "Spara 760 kr"] },
      en: { name: "B10 driving package", shortDesc: "Ten driving lessons that give you a solid foundation.", features: ["10 driving lessons of 50 minutes", "Valid for 24 months", "Save 760 kr"] },
      ti: { name: "ፓኬጅ ምዝዋር B10", shortDesc: "ጽኑዕ መሰረት ዝህቡኻ ዓሰርተ ትምህርትታት ምዝዋር።", features: ["10 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ን24 ወርሒ ይሰርሕ", "760 kr ትቑጥብ"] },
      ar: { name: "باقة القيادة B10", shortDesc: "عشرة دروس قيادة تمنحك أساسًا قويًا.", features: ["10 دروس، مدة كل منها 50 دقيقة", "صالحة لمدة 24 شهرًا", "وفّر 760 كرونة"] },
      so: { name: "Xirmada wadista B10", shortDesc: "Toban cashar wadis oo ku siinaya aasaas adag.", features: ["10 cashar oo min 50 daqiiqo ah", "Waxay shaqaynaysaa 24 bilood", "Kaydi 760 kr"] },
    },
  },
  {
    slug: "intensivpaket-silver",
    kind: ProductKind.PACKAGE,
    active: false,
    priceOre: 1049500,
    compareAtOre: 1103900,
    lessonCredits: 10,
    theoryDays: 365,
    includesRisk1: true,
    includesRisk2: true,
    accentHex: "#2563EB",
    translations: {
      sv: { name: "Intensivpaket Silver", shortDesc: "Ett komplett upplägg med körning, riskutbildning och teori.", features: ["10 körlektioner à 50 minuter", "Riskettan och Risktvåan", "Digital teori i 12 månader"] },
      en: { name: "Silver intensive package", shortDesc: "A complete plan with driving, risk training and theory.", features: ["10 driving lessons of 50 minutes", "Risk 1 and Risk 2", "Digital theory for 12 months"] },
      ti: { name: "ሲልቨር ጽዑቕ ፓኬጅ", shortDesc: "ምዝዋር፣ ስልጠና ሓደጋን ቲዮሪን ዘጠቓለለ ምሉእ መደብ።", features: ["10 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1ን ሪስክ 2ን", "ዲጂታላዊ ቲዮሪ ን12 ወርሒ"] },
      ar: { name: "الباقة المكثفة الفضية", shortDesc: "خطة متكاملة تشمل القيادة وتدريب المخاطر والنظري.", features: ["10 دروس، مدة كل منها 50 دقيقة", "المخاطر 1 والمخاطر 2", "نظري رقمي لمدة 12 شهرًا"] },
      so: { name: "Xirmada degdegga ah ee Silver", shortDesc: "Qorshe dhammaystiran oo leh wadis, tababarka khatarta iyo teori.", features: ["10 cashar oo min 50 daqiiqo ah", "Risk 1 iyo Risk 2", "Teori dijitaal ah 12 bilood"] },
    },
  },
  {
    slug: "intensivpaket-guld",
    kind: ProductKind.PACKAGE,
    active: false,
    priceOre: 1849500,
    compareAtOre: 1898900,
    lessonCredits: 20,
    theoryDays: 365,
    includesRisk1: true,
    includesRisk2: true,
    badge: "POPULARAST",
    accentHex: "#F5B429",
    translations: {
      sv: { name: "Intensivpaket Guld", shortDesc: "Ett omfattande upplägg för dig som vill träna målmedvetet.", features: ["20 körlektioner à 50 minuter", "Riskettan och Risktvåan", "Digital teori i 12 månader"] },
      en: { name: "Gold intensive package", shortDesc: "A comprehensive plan for focused driving practice.", features: ["20 driving lessons of 50 minutes", "Risk 1 and Risk 2", "Digital theory for 12 months"] },
      ti: { name: "ጎልድ ጽዑቕ ፓኬጅ", shortDesc: "ብዕላማ ክትለማመድ ንእትደሊ ሰፊሕ መደብ።", features: ["20 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1ን ሪስክ 2ን", "ዲጂታላዊ ቲዮሪ ን12 ወርሒ"] },
      ar: { name: "الباقة المكثفة الذهبية", shortDesc: "خطة شاملة لمن يريد التدريب بتركيز.", features: ["20 درسًا، مدة كل منها 50 دقيقة", "المخاطر 1 والمخاطر 2", "نظري رقمي لمدة 12 شهرًا"] },
      so: { name: "Xirmada degdegga ah ee Gold", shortDesc: "Qorshe ballaadhan oo loogu talagalay tababar ujeeddo leh.", features: ["20 cashar oo min 50 daqiiqo ah", "Risk 1 iyo Risk 2", "Teori dijitaal ah 12 bilood"] },
    },
  },
  {
    slug: "intensivpaket-platinum",
    kind: ProductKind.PACKAGE,
    active: false,
    priceOre: 2549500,
    compareAtOre: 2693900,
    lessonCredits: 30,
    theoryDays: 365,
    includesRisk1: true,
    includesRisk2: true,
    accentHex: "#7C3AED",
    translations: {
      sv: { name: "Intensivpaket Platinum", shortDesc: "Vårt mest omfattande upplägg för mycket körträning.", features: ["30 körlektioner à 50 minuter", "Riskettan och Risktvåan", "Digital teori i 12 månader"] },
      en: { name: "Platinum intensive package", shortDesc: "Our most extensive plan for substantial driving practice.", features: ["30 driving lessons of 50 minutes", "Risk 1 and Risk 2", "Digital theory for 12 months"] },
      ti: { name: "ፕላቲነም ጽዑቕ ፓኬጅ", shortDesc: "ንብዙሕ ልምምድ ምዝዋር ዝተዳለወ ዝሰፍሐ መደብና።", features: ["30 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1ን ሪስክ 2ን", "ዲጂታላዊ ቲዮሪ ን12 ወርሒ"] },
      ar: { name: "الباقة المكثفة البلاتينية", shortDesc: "خطتنا الأشمل لمن يحتاج إلى تدريب قيادة مكثف.", features: ["30 درسًا، مدة كل منها 50 دقيقة", "المخاطر 1 والمخاطر 2", "نظري رقمي لمدة 12 شهرًا"] },
      so: { name: "Xirmada degdegga ah ee Platinum", shortDesc: "Qorshahayaga ugu ballaadhan ee tababar wadis badan.", features: ["30 cashar oo min 50 daqiiqo ah", "Risk 1 iyo Risk 2", "Teori dijitaal ah 12 bilood"] },
    },
  },
  {
    slug: "korkortsgaranti",
    kind: ProductKind.GUARANTEE,
    active: false,
    priceOre: 2995000,
    compareAtOre: 3091400,
    lessonCredits: 35,
    theoryDays: 365,
    includesRisk1: true,
    includesRisk2: true,
    translations: {
      sv: { name: "Körkortsgaranti", shortDesc: "Ett fastprisupplägg som lanseras först efter juridisk granskning.", features: ["35 körlektioner à 50 minuter", "Riskettan och Risktvåan", "Digital teori i 12 månader", "Villkor inväntar juridiskt godkännande"] },
      en: { name: "Driving licence guarantee", shortDesc: "A fixed-price plan that will launch only after legal review.", features: ["35 driving lessons of 50 minutes", "Risk 1 and Risk 2", "Digital theory for 12 months", "Terms pending legal approval"] },
      ti: { name: "ውሕስነት ፍቓድ ምዝዋር", shortDesc: "ድሕሪ ሕጋዊ ግምገማ ጥራይ ዝጅምር ናይ ቀዋሚ ዋጋ መደብ።", features: ["35 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1ን ሪስክ 2ን", "ዲጂታላዊ ቲዮሪ ን12 ወርሒ", "ውዕላት ሕጋዊ ፍቓድ ይጽበ"] },
      ar: { name: "ضمان رخصة القيادة", shortDesc: "خطة بسعر ثابت لن تُطرح قبل اكتمال المراجعة القانونية.", features: ["35 درسًا، مدة كل منها 50 دقيقة", "المخاطر 1 والمخاطر 2", "نظري رقمي لمدة 12 شهرًا", "الشروط بانتظار الاعتماد القانوني"] },
      so: { name: "Dammaanadda laysanka wadista", shortDesc: "Qorshe qiime go'an leh oo la furayo marka dib-u-eegista sharcigu dhammaato.", features: ["35 cashar oo min 50 daqiiqo ah", "Risk 1 iyo Risk 2", "Teori dijitaal ah 12 bilood", "Shuruuduhu waxay sugayaan ansixin sharci"] },
    },
  },
  {
    slug: "riskettan",
    kind: ProductKind.COURSE_SEAT,
    active: false,
    priceOre: 49500,
    includesRisk1: true,
    translations: {
      sv: { name: "Riskettan", shortDesc: "Obligatorisk riskutbildning del 1 för B-körkort.", features: ["Riskbeteenden, alkohol och trötthet", "Kurstid publiceras när tillfällen är klara"] },
      en: { name: "Risk 1", shortDesc: "Mandatory part 1 risk training for a category B licence.", features: ["Risk behaviour, alcohol and fatigue", "Course times appear when occasions are ready"] },
      ti: { name: "ሪስክ 1", shortDesc: "ንፍቓድ B ግዴታዊ ቀዳማይ ክፋል ስልጠና ሓደጋ።", features: ["ባህሪ ሓደጋ፣ ኣልኮላን ድኻምን", "ግዜ ኮርስ ምስ ተዳለወ ይዝርጋሕ"] },
      ar: { name: "المخاطر 1", shortDesc: "الجزء الأول الإلزامي من تدريب المخاطر لرخصة الفئة B.", features: ["سلوك المخاطر والكحول والإرهاق", "تظهر المواعيد عند اعتماد الدورات"] },
      so: { name: "Risk 1", shortDesc: "Qaybta koowaad ee khasabka ah ee tababarka khatarta laysanka B.", features: ["Dabeecadaha khatarta, khamriga iyo daalka", "Waqtiyada ayaa soo baxaya marka la diyaariyo"] },
    },
  },
  {
    slug: "risktvaan",
    kind: ProductKind.COURSE_SEAT,
    active: false,
    priceOre: 219500,
    includesRisk2: true,
    translations: {
      sv: { name: "Risktvåan", shortDesc: "Obligatorisk praktisk riskutbildning del 2 för B-körkort.", features: ["Praktiska övningar på halkbana", "Tid och anläggning publiceras när de är bekräftade"] },
      en: { name: "Risk 2", shortDesc: "Mandatory practical part 2 risk training for a category B licence.", features: ["Practical skid-pad exercises", "Time and venue appear after confirmation"] },
      ti: { name: "ሪስክ 2", shortDesc: "ንፍቓድ B ግዴታዊ ግብራዊ ካልኣይ ክፋል ስልጠና ሓደጋ።", features: ["ግብራዊ ልምምድ ኣብ መንሸራተቲ ሜዳ", "ግዜን ቦታን ምስ ተረጋገጸ ይዝርጋሕ"] },
      ar: { name: "المخاطر 2", shortDesc: "الجزء الثاني العملي والإلزامي من تدريب المخاطر لرخصة B.", features: ["تمارين عملية على حلبة الانزلاق", "يظهر الموعد والمكان بعد تأكيدهما"] },
      so: { name: "Risk 2", shortDesc: "Qaybta labaad ee khasabka ah iyo wax-ku-oolka ah ee tababarka khatarta laysanka B.", features: ["Layliyo wax-ku-ool ah oo goobta simbiriirixashada ah", "Waqtiga iyo goobta ayaa soo baxaya marka la xaqiijiyo"] },
    },
  },
  {
    slug: "handledarutbildning",
    kind: ProductKind.COURSE_SEAT,
    active: false,
    priceOre: 49900,
    translations: {
      sv: { name: "Handledarutbildning", shortDesc: "Introduktionsutbildning för elev och handledare vid privat övningskörning.", features: ["För elev och handledare", "Kurstid publiceras när tillfällen är klara"] },
      en: { name: "Supervisor course", shortDesc: "Introduction course for learners and supervisors practising privately.", features: ["For learner and supervisor", "Course times appear when occasions are ready"] },
      ti: { name: "ስልጠና ተቖጻጻሪ", shortDesc: "ንብሕታዊ ልምምድ ምዝዋር ንተማሃራይን ተቖጻጻሪን መእተዊ ስልጠና።", features: ["ንተማሃራይን ተቖጻጻሪን", "ግዜ ኮርስ ምስ ተዳለወ ይዝርጋሕ"] },
      ar: { name: "دورة المشرف", shortDesc: "دورة تمهيدية للمتعلم والمشرف عند التدريب الخاص على القيادة.", features: ["للمتعلم والمشرف", "تظهر المواعيد عند اعتماد الدورات"] },
      so: { name: "Koorsada kormeeraha", shortDesc: "Koorsada hordhaca ah ee ardayga iyo kormeeraha marka si gaar ah loo tababaranayo.", features: ["Ardayga iyo kormeeraha", "Waqtiyada ayaa soo baxaya marka la diyaariyo"] },
    },
  },
  {
    slug: "korkortsteori",
    kind: ProductKind.THEORY_ACCESS,
    active: false,
    priceOre: 39900,
    theoryDays: 365,
    translations: {
      sv: { name: "Digital körkortsteori", shortDesc: "Digital teori för B-körkort, tillgänglig när den licensierade frågebanken är klar.", features: ["Tillgång i 365 dagar", "Studieläge och övningsprov", "Lanseras med licensierade frågor"] },
      en: { name: "Digital driving theory", shortDesc: "Digital category B theory, available when the licensed question bank is ready.", features: ["Access for 365 days", "Study mode and mock exams", "Launches with licensed questions"] },
      ti: { name: "ዲጂታላዊ ቲዮሪ ምዝዋር", shortDesc: "ፍቓድ ዘለዎ ባንክ ሕቶታት ምስ ተዳለወ ዝርከብ ዲጂታላዊ ቲዮሪ B።", features: ["ን365 መዓልቲ ፍቓድ", "ናይ መጽናዕትን ፈተነን ኣገባብ", "ብፍቓድ ዘለዎም ሕቶታት ይጅምር"] },
      ar: { name: "نظري القيادة الرقمي", shortDesc: "نظري رقمي لرخصة B، يتاح عند اكتمال بنك الأسئلة المرخص.", features: ["وصول لمدة 365 يومًا", "وضع دراسة واختبارات تجريبية", "يُطلق بأسئلة مرخصة"] },
      so: { name: "Teoriga wadista ee dijitaalka ah", shortDesc: "Teori dijitaal ah oo laysanka B ah, lana heli doono marka kaydka su'aalaha shatiga leh diyaar noqdo.", features: ["Gelitaan 365 maalmood", "Hab waxbarasho iyo imtixaano tijaabo ah", "Waxa lagu furayaa su'aalo shati leh"] },
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
  const seededProductIds = new Map<string, string>();
  for (const [i, p] of PRODUCTS.entries()) {
    const catalogueData = {
      kind: p.kind,
      active: p.active,
      sortOrder: i * 10,
      priceOre: p.priceOre,
      compareAtOre: p.compareAtOre ?? null,
      vatRatePct: 25, // Provisional until the client's accountant confirms it.
      currency: "SEK",
      lessonCredits: p.lessonCredits ?? 0,
      lessonMinutes: p.lessonMinutes ?? 50,
      theoryDays: p.theoryDays ?? null,
      includesRisk1: p.includesRisk1 ?? false,
      includesRisk2: p.includesRisk2 ?? false,
      creditValidDays: 730,
      badge: p.badge ?? null,
      accentHex: p.accentHex ?? null,
    };
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: catalogueData,
      create: {
        slug: p.slug,
        ...catalogueData,
      },
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

  // Course definitions are real catalogue links. Occasions and venues are not
  // seeded: courses stay inactive until confirmed operational data exists.
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
    if (!productId) throw new Error(`Missing seeded product: ${course.slug}`);
    await db.course.upsert({
      where: { id: course.id },
      update: { kind: course.kind, productId },
      create: { id: course.id, kind: course.kind, productId },
    });
  }

  // ── accounts ──────────────────────────────────────────────────────────
  // Dev only. Railway and Vercel are checked as well because deployment seed
  // jobs do not always set NODE_ENV explicitly.
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT_ID) ||
    process.env.RAILWAY_ENVIRONMENT === "production" ||
    process.env.RAILWAY_ENVIRONMENT_NAME === "production" ||
    process.env.VERCEL_ENV === "production";
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

    const teacherUser = await db.user.upsert({
      where: { email: "larare@makina.local" },
      update: {
        passwordHash: hash,
        role: Role.TEACHER,
        deletedAt: null,
        firstName: "Sara",
        lastName: "Johansson (DEMO)",
      },
      create: {
        email: "larare@makina.local",
        passwordHash: hash,
        role: Role.TEACHER,
        firstName: "Sara",
        lastName: "Johansson (DEMO)",
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
      await db.teacherProfile.update({
        where: { id: teacherUser.teacherProfile.id },
        data: {
          active: true,
          slug: "sara-johansson",
          languages: ["sv", "en", "ti"],
          transmissions: [Transmission.MANUAL, Transmission.AUTOMATIC],
          yearsExperience: 5,
        },
      });
      const teacherBios: Record<Locale, string> = {
        sv: "Demoprofil – Sara är inte en verklig bokningsbar trafiklärare. Profilen finns endast för att visa hur lärarsökning, språkval och bokning fungerar i utvecklingsmiljön.",
        en: "Demo profile – Sara is not a real instructor available for bookings. This profile exists only to demonstrate instructor search, language selection and booking in the development environment.",
        ti: "ናይ ምርኢት ፕሮፋይል – ሳራ ንቦታ ምሓዝ ዝርከብ ናይ ሓቂ መምህር ኣይኮነትን። እዚ ፕሮፋይል ኣብ ናይ ልምዓት ከባቢ ድለያ መምህር፣ ምርጫ ቋንቋን ቦታ ምሓዝን ንምርኣይ ጥራይ እዩ።",
        ar: "ملف تجريبي – سارة ليست مدربة حقيقية متاحة للحجز. هذا الملف موجود فقط لعرض البحث عن المدربين واختيار اللغة والحجز في بيئة التطوير.",
        so: "Bog tijaabo ah – Sara ma aha macallin dhab ah oo ballan laga qabsan karo. Boggan waxa keliya oo uu muujinayaa raadinta macallinka, doorashada luqadda iyo qabashada ballanta ee deegaanka horumarinta.",
      };
      for (const locale of LOCALES) {
        await db.teacherTranslation.upsert({
          where: {
            teacherId_locale: {
              teacherId: teacherUser.teacherProfile.id,
              locale,
            },
          },
          update: { bio: teacherBios[locale] },
          create: {
            teacherId: teacherUser.teacherProfile.id,
            locale,
            bio: teacherBios[locale],
          },
        });
      }
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
      await db.teacherAvailability.deleteMany({
        where: { teacherId: teacherUser.teacherProfile.id },
      });
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
