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

import { seedTheory } from "./seed-theory";

const db = new PrismaClient();

const LOCALES = ["sv", "en", "ti", "ar", "so"] as const;
const TIME_ZONE = "Europe/Stockholm";
const PRODUCTION_PRODUCT_SLUGS = new Set([
  "testlektion",
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
]);

type Locale = (typeof LOCALES)[number];
type Translation = { name: string; shortDesc: string; features: string[] };

function loc(
  sv: string,
  en: string,
  ti: string,
  ar: string,
  so: string,
): Record<Locale, string> {
  return { sv, en, ti, ar, so };
}

function stockholmAt(now: Date, daysAhead: number, time: string) {
  const localDate = formatInTimeZone(
    addDays(now, daysAhead),
    TIME_ZONE,
    "yyyy-MM-dd",
  );
  return fromZonedTime(`${localDate}T${time}:00`, TIME_ZONE);
}

// ─── CLIENT DATA — replace before launch ───────────────────────────
export const CLIENT_DATA = {
  locations: [
    {
      slug: "upplands-vasby",
      name: "Upplands Väsby – Huvudkontor",
      address: "Centralvägen 5",
      city: "Upplands Väsby",
      postalCode: "194 77",
      lat: 59.5194,
      lng: 17.9088,
    },
    {
      slug: "sollentuna",
      name: "Sollentuna",
      address: "Turebergs torg 1",
      city: "Sollentuna",
      postalCode: "191 47",
      lat: 59.428,
      lng: 17.9511,
    },
    {
      slug: "kista",
      name: "Kista",
      address: "Danmarksgatan 14",
      city: "Kista",
      postalCode: "164 53",
      lat: 59.4026,
      lng: 17.9432,
    },
    {
      slug: "marsta",
      name: "Märsta",
      address: "Stationsgatan 20",
      city: "Märsta",
      postalCode: "195 34",
      lat: 59.6211,
      lng: 17.8589,
    },
  ],
  instructors: [
    {
      email: "larare@makina.local",
      firstName: "Sara",
      lastName: "Johansson",
      slug: "sara-johansson",
      languages: ["sv", "en", "ti"],
      transmissions: [Transmission.MANUAL, Transmission.AUTOMATIC],
      yearsExperience: 8,
      locationSlug: "upplands-vasby",
      days: [1, 2, 3, 4, 5],
      startTime: "09:00",
      endTime: "17:00",
      vehicle: {
        model: "Volvo V60",
        registration: "YKM12A",
        transmission: Transmission.MANUAL,
      },
      bio: loc(
        "Sara tar det lugnt i början och förklarar varje val i trafiken med enkla ord. Hon gillar att öva samma situation flera gånger tills du känner dig trygg. Många elever som är nervösa bakom ratten kommer vidare hos henne.",
        "Sara starts slowly and explains every choice in traffic in plain words. She likes to practise the same situation until you feel safe. Many nervous learners find their footing with her.",
        "ሳራ ኣብ መጀመርታ ብዝኸኣለ ቀስ ኢላ ትጅምር እሞ ነፍሲ ወከፍ ምርጫ ኣብ ትራፊክ ብቐሊል ቃላት ትገልጽ። ሓንቲ ኩነታት ክሳብ ትዕመን ብተደጋጋሚ ትለማመድ። ብዙሓት ዝሰምብዱ ተማሃሮ ኣብኣ ይረኽቡ መሰረት።",
        "تبدأ سارة بهدوء وتشرح كل قرار في السير بكلمات بسيطة. تحب أن تعيد الموقف نفسه حتى تشعر بالأمان. كثير من المتعلمين القلقين يجدون ثقتهم معها.",
        "Sara waxay ku bilaabtaa si tartiib ah oo waxay ku sharaxdaa doorashad kasta ee taraafikada ereyo fudud. Waxay jeceshahay inay ku celceliso xaalad isku mid ah ilaa aad nabadgelyo dareento. Arday badan oo walwalsan ayaa iyada la helaya kalsoonida.",
      ),
    },
    {
      email: "amina.hassan@makina.local",
      firstName: "Amina",
      lastName: "Hassan",
      slug: "amina-hassan",
      languages: ["ar", "so", "sv"],
      transmissions: [Transmission.AUTOMATIC],
      yearsExperience: 6,
      locationSlug: "sollentuna",
      days: [1, 2, 3, 4, 5],
      startTime: "07:00",
      endTime: "15:00",
      vehicle: {
        model: "Toyota Corolla",
        registration: "TBL34C",
        transmission: Transmission.AUTOMATIC,
      },
      bio: loc(
        "Amina undervisar bara automat och lägger tid på blick, tempo och hur du läser andra trafikanter. Hon möter dig tidigt på morgonen om det passar jobbet eller skolan. Du får tydlig återkoppling efter varje lektion.",
        "Amina teaches automatic only and spends time on observation, pace and how you read other road users. She can meet you early in the morning around work or school. You get clear feedback after every lesson.",
        "ኣሚና ኣውቶማቲክ ጥራይ ትምህርቲ ትህብ እሞ ኣብ ምርኣይ፣ ፍጥነትን ከመይ ጌርካ ካልኦት ተሳተፍቲ መንገዲ ከተንብብን ግዜ ትውዕል። ንስራሕ ወይ ቤት ትምህርቲ እንተሰማሚዑ ንግሆ ኣቐዲማ ትራኽበካ። ድሕሪ ነፍሲ ወከፍ ትምህርቲ ንጹር ግብረ መልሲ ትህብ።",
        "تعلّم أمينة الأوتوماتيك فقط وتركّز على النظر والسرعة وكيف تقرأ مستخدمي الطريق. يمكن أن تلتقيك باكراً حول العمل أو المدرسة. تحصل على ملاحظات واضحة بعد كل درس.",
        "Amina waxay bariisaa otomaatig keliya waxayna wakhti ku bixisaa fiirsashada, xawaaraha iyo sida aad u akhrido dadka kale ee waddada. Waxay kula kulmi kartaa subaxdii hore haddii shaqada ama dugsigu u baahan yahay. Cashar kasta kadib waxaad helaysaa jawaab cad.",
      ),
    },
    {
      email: "dawit.tesfay@makina.local",
      firstName: "Dawit",
      lastName: "Tesfay",
      slug: "dawit-tesfay",
      languages: ["ti", "sv", "en"],
      transmissions: [Transmission.MANUAL, Transmission.AUTOMATIC],
      yearsExperience: 15,
      locationSlug: "kista",
      days: [2, 3, 4, 5, 6],
      startTime: "09:00",
      endTime: "17:00",
      vehicle: {
        model: "Volkswagen Golf",
        registration: "HNS56D",
        transmission: Transmission.MANUAL,
      },
      bio: loc(
        "Dawit har kört med nybörjare i femton år och vet när det är dags att höja tempot. Han förklarar växling och motorbroms så att det sitter i kroppen. På helgen tar han gärna längre pass inför uppkörningen.",
        "Dawit has taught beginners for fifteen years and knows when it is time to raise the pace. He explains gear changes and engine braking so the skill stays in the body. At weekends he likes longer sessions before the driving test.",
        "ዳዊት ንዓሰርተው ሓሙሽተ ዓመት ምስ ጀመርቲ ሰሪሑ እሞ መኣዝ ፍጥነት ክትውስኽ ከምዘለካ ይፈልጥ። ምቕያር ማርሻን ምዕጻው ሞተርን ኣብ ኣካል ክሰፍር ጌሩ ይገልጽ። ኣብ ሰንበት ቅድሚ ፈተነ ምዝዋር ነዊሕ ክፍሊታት ብሃንቀውታ ይወስድ።",
        "درّب داويت المبتدئين خمس عشرة سنة ويعرف متى يحين رفع الإيقاع. يشرح تغيير السرعات والفرملة بالمحرك حتى تثبت المهارة في الجسم. في عطلة الأسبوع يفضّل حصصاً أطول قبل اختبار القيادة.",
        "Dawit wuxuu baraayay bilowga muddo shan iyo toban sano ah wuxuuna ogyahay goorta la kordhinayo xawaaraha. Wuxuu u sharaxaa beddelka gears-ka iyo biriikada matoorka si xirfaddu ugu sii jirto jidhka. Toddobaadka dhammaadkiisa wuxuu jecel yahay casharro dhaadheer ka hor imtixaanka wadista.",
      ),
    },
    {
      email: "nora.bergstrom@makina.local",
      firstName: "Nora",
      lastName: "Bergström",
      slug: "nora-bergstrom",
      languages: ["sv", "en"],
      transmissions: [Transmission.MANUAL, Transmission.AUTOMATIC],
      yearsExperience: 3,
      locationSlug: "marsta",
      days: [1, 2, 3, 4, 5],
      startTime: "12:00",
      endTime: "20:00",
      vehicle: {
        model: "Kia Ceed",
        registration: "RFP78E",
        transmission: Transmission.AUTOMATIC,
      },
      bio: loc(
        "Nora tar eftermiddags- och kvällslektioner, bra om du pluggar eller jobbar dagtid. Hon är nyfiken, tydlig och gillar landsvägskörning norrut mot Arlanda. Du får en kort plan för vad ni övar nästa gång innan du går av.",
        "Nora teaches afternoon and evening lessons, useful if you study or work during the day. She is curious, clear and enjoys rural driving north towards Arlanda. You leave with a short plan for what you will practise next time.",
        "ኖራ ድሕሪ ቀትሪን ምሸትን ትምህርቲ ትህብ፣ መዓልቲ እንተትምህር ወይ እንተትሰርሕ ጽቡቕ እዩ። ንጹር እያ እሞ ንሰሜን ናብ ኣርላንዳ ናይ ገጠር ምዝዋር ትፈቱ። ቅድሚ ምውጻእካ ነቲ ዝቕጽል እትለማመዶ ሓጺር መደብ ትህበካ።",
        "تدرّس نورا بعد الظهر وفي المساء، وهذا يناسب الدراسة أو العمل نهاراً. هي واضحة وتحب القيادة على الطرق الريفية شمالاً نحو أرلاندا. تغادر بخطة قصيرة لما ستتمرّنان عليه في المرة التالية.",
        "Nora waxay bariisaa galabtii iyo fiidkii, taasoo ku habboon haddii aad dhigato ama shaqeyso maalintii. Way cad dahay waxayna jeceshahay wadista waddooyinka miyiga ee woqooyi xagga Arlanda. Waxaad ka baxaysaa qorshe gaaban oo ku saabsan waxa aad ku celcelin doontanaan marka xigta.",
      ),
    },
  ],
} as const;
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
  translations: Record<Locale, Translation>;
};

const PRODUCTS: Seed[] = [
  {
    slug: "en-korlektion",
    kind: ProductKind.SINGLE_LESSON,
    active: true,
    priceOre: 79900,
    lessonCredits: 1,
    translations: {
      sv: { name: "En körlektion", shortDesc: "50 minuter bakom ratten med en lärare som anpassar tempot efter dig. Passar dig som vill prova på, fylla på inför uppkörningen eller köra enstaka lektioner vid sidan av privat övningskörning.", features: ["50 minuters körning", "Manuell eller automat", "Personlig återkoppling"] },
      en: { name: "Single driving lesson", shortDesc: "50 minutes behind the wheel with an instructor who matches your pace. Good if you want to try us, top up before the driving test, or take extra lessons beside private practice.", features: ["50 minutes of driving", "Manual or automatic", "Personal feedback"] },
      ti: { name: "ሓደ ትምህርቲ ምዝዋር", shortDesc: "50 ደቒቕ ድሕሪ መሪሕ መንእሰይ ምስ መምህር ፍጥነትካ ዝሰማማዕ። ንምፍታን፣ ቅድሚ ፈተነ ንምምላእ ወይ ኣብ ጎኒ ብሕታዊ ልምምድ ተወሳኺ ትምህርቲ እንተደሊኻ ይሰርሕ።", features: ["50 ደቒቕ ምዝዋር", "ማንዋል ወይ ኣውቶማቲክ", "ውልቃዊ ግብረ መልሲ"] },
      ar: { name: "درس قيادة منفرد", shortDesc: "50 دقيقة خلف المقود مع معلّم يضبط السرعة حسبك. مناسب للتجربة أو للتعزيز قبل الاختبار أو لدروس إضافية إلى جانب التدريب الخاص.", features: ["50 دقيقة قيادة", "يدوي أو أوتوماتيكي", "ملاحظات شخصية"] },
      so: { name: "Hal cashar wadis", shortDesc: "50 daqiiqo oo giraangiraha gadaashiisa ah macallin ku habboon xawaarahaaga. Waa fiican tahay haddii aad tijaabinayso, ku kordhinayso ka hor imtixaanka, ama casharro dheeraad ah ka qaadanayso tababarka gaarka ah.", features: ["50 daqiiqo oo wadis ah", "Gacanta ama otomaatig", "Qiimayn kuu gaar ah"] },
    },
  },
  {
    slug: "testlektion",
    kind: ProductKind.TEST_LESSON,
    active: true,
    priceOre: 49900,
    lessonCredits: 1,
    translations: {
      sv: { name: "Testlektion", shortDesc: "Vi bedömer din nuvarande nivå och ger dig en tydlig plan: ungefär hur många lektioner du behöver, vad du ska öva på och i vilken ordning. Börja här om du är osäker på vilket paket som passar.", features: ["50 minuters nivåbedömning", "Personlig utbildningsplan"] },
      en: { name: "Assessment lesson", shortDesc: "We assess your current level and give you a clear plan: roughly how many lessons you need, what to practise and in which order. Start here if you are unsure which package fits.", features: ["50-minute level assessment", "Personal training plan"] },
      ti: { name: "ናይ ግምገማ ትምህርቲ", shortDesc: "ናይ ሕጂ ደረጃኻ ነገምግም እሞ ንጹር መደብ ንህበካ፦ ክንደይ ትምህርቲ ከምእትድልየካ፣ እንታይ ከተለማምድ ከምዘለካን ብዝኣከለ ተኸተልን። ኣየናይ ፓኬጅ ከምዝሰማማዕ እንተዘይፈሊጥካ ኣብዚ ጀምር።", features: ["ናይ 50 ደቒቕ ግምገማ ደረጃ", "ውልቃዊ መደብ ትምህርቲ"] },
      ar: { name: "درس تقييم", shortDesc: "نقيّم مستواك الحالي ونضع خطة واضحة: كم درساً تحتاج تقريباً، وماذا تتدرّب وبأي ترتيب. ابدأ من هنا إن لم تعرف أي باقة تناسبك.", features: ["تقييم مستوى لمدة 50 دقيقة", "خطة تدريب شخصية"] },
      so: { name: "Cashar qiimayn ah", shortDesc: "Waxaanu qiimeynaa heerkaaga hadda waxaanu ku siinnaa qorshe cad: qiyaastii immisa cashar aad u baahan tahay, maxaad ku celcelinaysaa iyo kala horreynta. Halkan ka bilow haddii aadan hubin xirmada kugu habboon.", features: ["Qiimayn heer oo 50 daqiiqo ah", "Qorshe tababar oo qofeed"] },
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
      so: { name: "3 cashar wadis", shortDesc: "Saddex cashar oo 50 daqiiqo ah marka aad rabto inaad si degdeg ah u kordhiso adigoon xirmo weyn qaadan.", features: ["3 cashar oo min 50 daqiiqo ah", "Qorshe shakhsi ah oo macallin ah", "Waxay shaqaynaysaa 12 bilood", "Kaydi 98 kr"] },
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
      sv: { name: "B5-paket", shortDesc: "Fem körlektioner med individuell planering, träning i grundläggande körteknik och förberedelse inför uppkörningen. Giltigt i 12 månader.", features: ["5 körlektioner à 50 minuter", "Individuell planering med trafiklärare", "Träning i grundläggande körteknik", "Förberedelse inför uppkörningen", "Giltigt i 12 månader"] },
      en: { name: "B5 package", shortDesc: "Five driving lessons with personal planning, basic technique practice and test preparation. Valid for 12 months.", features: ["5 driving lessons of 50 minutes", "Personal planning with an instructor", "Basic driving technique practice", "Preparation for the driving test", "Valid for 12 months"] },
      ti: { name: "ፓኬጅ B5", shortDesc: "ሓሙሽተ ትምህርቲ ምዝዋር ምስ ውልቃዊ መደብ፣ መሰረታዊ ቴክኒክን ናይ ፈተነ ምድላውን። ን12 ወርሒ ይሰርሕ።", features: ["5 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ውልቃዊ መደብ ምስ መምህር", "መሰረታዊ ቴክኒክ ምዝዋር", "ናይ ፈተነ ምድላው", "ን12 ወርሒ ይሰርሕ"] },
      ar: { name: "باقة B5", shortDesc: "خمسة دروس مع تخطيط فردي وتمارين تقنية أساسية والتحضير للاختبار. صالحة 12 شهراً.", features: ["5 دروس، مدة كل منها 50 دقيقة", "تخطيط فردي مع معلّم", "تدريب على التقنية الأساسية", "التحضير لاختبار القيادة", "صالحة لمدة 12 شهرًا"] },
      so: { name: "Xirmada B5", shortDesc: "Shan cashar oo leh qorshe shakhsi, tababarka farsamada aasaasiga ah iyo diyaarinta imtixaanka. Waxay shaqaynaysaa 12 bilood.", features: ["5 cashar oo min 50 daqiiqo ah", "Qorshe shakhsi ah oo macallin ah", "Tababarka farsamada aasaasiga", "Diyaarinta imtixaanka wadista", "Waxay shaqaynaysaa 12 bilood"] },
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
      sv: { name: "B10-paket", shortDesc: "Tio körlektioner med individuell planering, träning i grundläggande körteknik och förberedelse inför uppkörningen. Giltigt i 12 månader.", features: ["10 körlektioner à 50 minuter", "Individuell planering med trafiklärare", "Träning i grundläggande körteknik", "Förberedelse inför uppkörningen", "Giltigt i 12 månader"] },
      en: { name: "B10 package", shortDesc: "Ten driving lessons with personal planning, basic technique practice and test preparation. Valid for 12 months.", features: ["10 driving lessons of 50 minutes", "Personal planning with an instructor", "Basic driving technique practice", "Preparation for the driving test", "Valid for 12 months"] },
      ti: { name: "ፓኬጅ B10", shortDesc: "ዓሰርተ ትምህርቲ ምዝዋር ምስ ውልቃዊ መደብ፣ መሰረታዊ ቴክኒክን ናይ ፈተነ ምድላውን። ን12 ወርሒ ይሰርሕ።", features: ["10 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ውልቃዊ መደብ ምስ መምህር", "መሰረታዊ ቴክኒክ ምዝዋር", "ናይ ፈተነ ምድላው", "ን12 ወርሒ ይሰርሕ"] },
      ar: { name: "باقة B10", shortDesc: "عشرة دروس مع تخطيط فردي وتمارين تقنية أساسية والتحضير للاختبار. صالحة 12 شهراً.", features: ["10 دروس، مدة كل منها 50 دقيقة", "تخطيط فردي مع معلّم", "تدريب على التقنية الأساسية", "التحضير لاختبار القيادة", "صالحة لمدة 12 شهرًا"] },
      so: { name: "Xirmada B10", shortDesc: "Toban cashar oo leh qorshe shakhsi, tababarka farsamada aasaasiga ah iyo diyaarinta imtixaanka. Waxay shaqaynaysaa 12 bilood.", features: ["10 cashar oo min 50 daqiiqo ah", "Qorshe shakhsi ah oo macallin ah", "Tababarka farsamada aasaasiga", "Diyaarinta imtixaanka wadista", "Waxay shaqaynaysaa 12 bilood"] },
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
      so: { name: "20 cashar wadis", shortDesc: "Labaatan cashar oo 50 daqiiqo ah marka aad rabto inaad u dhisto wadista tallaabo tallaabo qiimo go'an.", features: ["20 cashar oo min 50 daqiiqo ah", "Qorshe shakhsi ah oo macallin ah", "Waxay shaqaynaysaa 12 bilood", "Kaydi 1 981 kr"] },
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
      so: { name: "Xirmada degdegga ah ee Silver", shortDesc: "Toban cashar, Risk 1, Risk 2 iyo teoriga dijitaalka ah qiimo go'an. Waxay shaqaynaysaa 12 bilood.", features: ["10 cashar oo min 50 daqiiqo ah", "Risk 1", "Risk 2", "Teori dijitaal ah", "Qorshe shakhsi ah", "Waxay shaqaynaysaa 12 bilood"] },
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
      so: { name: "Xirmada degdegga ah ee Gold", shortDesc: "Labaatan cashar, Risk 1, Risk 2 iyo teoriga dijitaalka ah. Waxay shaqaynaysaa 12 bilood.", features: ["20 cashar oo min 50 daqiiqo ah", "Risk 1", "Risk 2", "Teori dijitaal ah", "Qorshe shakhsi ah", "Waxay shaqaynaysaa 12 bilood"] },
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
      so: { name: "Xirmada degdegga ah ee Platinum", shortDesc: "Soddon cashar, Risk 1, Risk 2 iyo teoriga dijitaalka ah. Waxay shaqaynaysaa 12 bilood.", features: ["30 cashar oo min 50 daqiiqo ah", "Risk 1", "Risk 2", "Teori dijitaal ah", "Qorshe shakhsi ah", "Waxay shaqaynaysaa 12 bilood"] },
    },
  },
  {
    slug: "korkortsgaranti",
    kind: ProductKind.GUARANTEE,
    active: true,
    priceOre: 3199900,
    compareAtOre: 3299900,
    lessonCredits: 35,
    includesTheory: true,
    includesRisk1: true,
    includesRisk2: true,
    translations: {
      sv: { name: "Körkortsgaranti", shortDesc: "Körlektioner tills du klarar uppkörningen till ett fast pris, med personlig plan, Riskettan, Risktvåan och komplett digitalt teoripaket. Giltigt i 12 månader.", features: ["Körlektioner tills du klarar uppkörningen", "Personlig utbildningsplan", "Riskettan och Risktvåan", "Komplett digitalt teoripaket", "Giltigt i 12 månader"] },
      en: { name: "Driving licence guarantee", shortDesc: "Lessons until you pass the driving test at a fixed price, with a personal plan, Risk 1, Risk 2 and a full digital theory package. Valid for 12 months.", features: ["Lessons until you pass the driving test", "Personal training plan", "Risk 1 and Risk 2", "Full digital theory package", "Valid for 12 months"] },
      ti: { name: "ውሕስነት ፍቓድ ምዝዋር", shortDesc: "ክሳብ ፈተነ ምዝዋር ብዕዉት ክትሰግር ብቐዋሚ ዋጋ፣ ምስ ውልቃዊ መደብ፣ ሪስክ 1ን 2ን ዲጂታላዊ ቲዮሪን። ን12 ወርሒ ይሰርሕ።", features: ["ክሳብ እትሰግር ትምህርቲ", "ውልቃዊ መደብ", "ሪስክ 1ን 2ን", "ዲጂታላዊ ቲዮሪ", "ን12 ወርሒ ይሰርሕ"] },
      ar: { name: "ضمان رخصة القيادة", shortDesc: "دروس حتى تنجح في الاختبار بسعر ثابت، مع خطة شخصية ودورتي المخاطر ونظري رقمي كامل. صالح 12 شهراً.", features: ["دروس حتى النجاح في الاختبار", "خطة تدريب شخصية", "المخاطر 1 و2", "باقة نظري رقمية كاملة", "صالحة لمدة 12 شهرًا"] },
      so: { name: "Dammaanadda laysanka wadista", shortDesc: "Casharro ilaa aad ku guulaysato imtixaanka qiimo go'an, qorshe shakhsi, Risk 1 & 2 iyo teori dijitaal oo buuxa. Waxay shaqaynaysaa 12 bilood.", features: ["Casharro ilaa aad ku guulaysato", "Qorshe tababar oo qofeed", "Risk 1 iyo Risk 2", "Xirmo teori dijitaal oo buuxa", "Waxay shaqaynaysaa 12 bilood"] },
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
      so: { name: "Risk 1", shortDesc: "Qaybta koowaad ee khasabka ah ee tababarka khatarta laysanka B.", features: ["Dabeecadaha khatarta, khamriga iyo daalka", "Waqtiyada ayaa soo baxaya marka la diyaariyo"] },
    },
  },
  {
    slug: "risktvaan",
    kind: ProductKind.COURSE_SEAT,
    active: true,
    priceOre: 189900,
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
    active: true,
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
    active: true,
    priceOre: 39900,
    includesTheory: true,
    translations: {
      sv: { name: "Digital körkortsteori", shortDesc: "Öva kategori för kategori och gör övningsprov med samma upplägg som kunskapsprovet. Köp en gång — tillgången har ingen tidsgräns.", features: ["Obegränsad tillgång, ingen tidsgräns", "Studieläge och övningsprov", "Övningsprov i samma form som kunskapsprovet"] },
      en: { name: "Digital driving theory", shortDesc: "Practise category by category and take mock exams in the same format as the knowledge test. Buy once — access has no time limit.", features: ["Unlimited access, no time limit", "Study mode and mock exams", "Mock tests in the same form as the knowledge test"] },
      ti: { name: "ዲጂታላዊ ቲዮሪ ምዝዋር", shortDesc: "ብዓይነት ብዓይነት ለምምድ እሞ ከም ናይ ፍልጠት ፈተነ ዝኾነ ልምምዲ ፈተነ ግበር። ሓንሳብ ደርጊ — ፍቓድ ግዜ ገደብ የብሉን።", features: ["ዘይተወሰነ ፍቓድ፣ ግዜ ገደብ የለን", "ናይ መጽናዕትን ፈተነን ኣገባብ", "ከም ናይ ፍልጠት ፈተና ዝመስል ልምምድ ፈተና"] },
      ar: { name: "نظري القيادة الرقمي", shortDesc: "تدرّب فئة تلو فئة وأجرِ اختبارات تجريبية بنفس أسلوب اختبار المعرفة. اشترِ مرة واحدة — الوصول بلا مهلة زمنية.", features: ["وصول غير محدود، بلا مهلة زمنية", "وضع دراسة واختبارات تجريبية", "اختبار تجريبي بنفس شكل اختبار المعرفة"] },
      so: { name: "Teoriga wadista ee dijitaalka ah", shortDesc: "Ku celceli qayb qayb oo samee imtixaano tijaabo ah oo la mid ah qaabka imtixaanka aqoonta. Hal mar iibso — gelitaanku xilli xadidan ma laha.", features: ["Gelitaan aan xadidnayn, xilli xadidan ma jiro", "Hab waxbarasho iyo imtixaano tijaabo ah", "Imtixaan tijaabo ah oo la mid ah imtixaanka aqoonta"] },
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
      so: { title: "Soo-degista wadista", description: "Kursiga, isteerinka, muraayadaha iyo suunka." },
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
      so: { title: "Maareynta baabuurka", description: "Bilow, joogsi, isteerin iyo beddelka gears-ka meel deggan." },
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
      so: { title: "Wadista magaalada ee hordhaca", description: "Waddooyin fudud oo magaalada dhexdeeda ah taraafiko yar." },
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
      so: { title: "Biriikada iyo fogaanta", description: "Biriiko jilicsan iyo fogaanta gaadhiga hore." },
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
      so: { title: "Xeerarka u-gudbinta", description: "Xeerka midig, waddada weyn iyo waajibka u-gudbinta." },
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
      so: { title: "Wareegga", description: "Gelitaanka, booska iyo ka-bixitaanka wareegga." },
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
      so: { title: "Waddada miyiga", description: "Xawaare sare, dhaafitaan iyo kala horimaad." },
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
      so: { title: "Leexashada iyo parking-ka", description: "Dib-u-socod, leexasho iyo parking magaalada dhexdeeda." },
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
      so: { title: "Wadista habeennimo", description: "Iftiinka hoose, iftiinka sare iyo hoos-u-dhigista dadka kale." },
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
      so: { title: "Waddo simbiriirixan", description: "Qabsashada, fogaanta iyo dhaqdhaqaaq jilicsan marka waddadu simbiriirixanto." },
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
      so: { title: "Waddada weyn", description: "Gelitaanka, beddelka haadka iyo ka-bixitaanka xawaare sare." },
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
      so: { title: "Taraafiko cufan", description: "Wada-shaqeyn, boos-qaadid iyo degganaansho safafka dhexdooda." },
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
      so: { title: "Wadis dhaqaale", description: "Qorsheyn, biriikada matoorka iyo xawaare siman." },
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
      so: { title: "Wadis madax-bannaan", description: "Adiga ayaa haga hannaanka oo go'aanno qaata taageero yar." },
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
      so: { title: "Diyaarinta imtixaanka wadista", description: "Qiimayn guud ka hor imtixaanka wadista ee Trafikverket." },
    },
  },
];

async function main() {
  const now = new Date();
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT_ID) ||
    process.env.RAILWAY_ENVIRONMENT === "production" ||
    process.env.RAILWAY_ENVIRONMENT_NAME === "production" ||
    process.env.VERCEL_ENV === "production";
  const locationsToSeed = isProduction
    ? CLIENT_DATA.locations.slice(0, 1)
    : CLIENT_DATA.locations;
  const instructorsToSeed = isProduction ? [] : CLIENT_DATA.instructors;
  const productsToSeed = isProduction
    ? PRODUCTS.filter((product) => PRODUCTION_PRODUCT_SLUGS.has(product.slug))
    : PRODUCTS;

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
        active: true,
      },
      create: {
        slug: location.slug,
        name: location.name,
        address: location.address,
        city: location.city,
        postalCode: location.postalCode,
        lat: location.lat,
        lng: location.lng,
        active: true,
      },
    });
    locationsBySlug.set(location.slug, row.id);
  }

  const seededProductIds = new Map<string, string>();
  for (const [i, p] of productsToSeed.entries()) {
    const catalogueData = {
      kind: p.kind,
      // Production sales stay closed until real instructors and bookable
      // availability have been loaded by the client.
      active: isProduction ? false : p.active,
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

  const teacherIdsBySlug = new Map<string, string>();
  for (const instructor of instructorsToSeed) {
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
            photoUrl: `/instructors/${instructor.slug}.jpg`,
            languages: [...instructor.languages],
            transmissions: [...instructor.transmissions],
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
          photoUrl: `/instructors/${instructor.slug}.jpg`,
          languages: [...instructor.languages],
          transmissions: [...instructor.transmissions],
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
          photoUrl: `/instructors/${instructor.slug}.jpg`,
          languages: [...instructor.languages],
          transmissions: [...instructor.transmissions],
          yearsExperience: instructor.yearsExperience,
        },
      });
    }
    teacherIdsBySlug.set(instructor.slug, profile.id);

    for (const locale of LOCALES) {
      await db.teacherTranslation.upsert({
        where: { teacherId_locale: { teacherId: profile.id, locale } },
        update: { bio: instructor.bio[locale] },
        create: {
          teacherId: profile.id,
          locale,
          bio: instructor.bio[locale],
        },
      });
    }

    await db.teacherLocation.deleteMany({ where: { teacherId: profile.id } });
    await db.teacherLocation.create({
      data: { teacherId: profile.id, locationId },
    });

    await db.teacherAvailability.deleteMany({ where: { teacherId: profile.id } });
    for (const dayOfWeek of instructor.days) {
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

    await db.vehicle.upsert({
      where: { registration: instructor.vehicle.registration },
      update: {
        model: instructor.vehicle.model,
        transmission: instructor.vehicle.transmission,
        active: true,
        teacherId: profile.id,
      },
      create: {
        model: instructor.vehicle.model,
        registration: instructor.vehicle.registration,
        transmission: instructor.vehicle.transmission,
        active: true,
        teacherId: profile.id,
      },
    });
  }

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
    await db.course.upsert({
      where: { id: course.id },
      update: { kind: course.kind, productId },
      create: { id: course.id, kind: course.kind, productId },
    });
  }

  const saraId = teacherIdsBySlug.get("sara-johansson");
  const dawitId = teacherIdsBySlug.get("dawit-tesfay");
  const aminaId = teacherIdsBySlug.get("amina-hassan");
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
      teacherId: saraId,
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
      teacherId: saraId,
    },
    {
      id: "seed-occasion-risktvaan-1",
      courseId: "seed-course-risktvaan",
      daysAhead: 31,
      start: "08:00",
      end: "16:00",
      capacity: 12,
      venueName: "Halkbanan Arlandastad",
      venueAddress: "Driftvägen 1, 190 60 Stockholm-Arlanda",
      teacherId: dawitId,
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
      teacherId: aminaId,
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

  // The client must confirm ownership of the theory source before it is
  // published. Development keeps representative data for exercising the UI.
  if (!isProduction) {
    await seedTheory(db);
  }

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

    await db.user.update({
      where: { email: "larare@makina.local" },
      data: { passwordHash: hash, deletedAt: null, role: Role.TEACHER },
    });

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
