/**
 * Seed — Makina Trafikskola
 *
 * Catalogue prices are based on the client-authorized 2026 Stockholm/Upplands
 * Väsby market position.
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
import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { seedTheory } from "./seed-theory";

const db = new PrismaClient();

const LOCALES = ["sv", "en", "ti", "ar", "so"] as const;
const TIME_ZONE = "Europe/Stockholm";

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
      address: "Stationsgatan 2",
      city: "Upplands Väsby",
      postalCode: "194 32",
      lat: 59.5186,
      lng: 17.9112,
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

// Provisional until the client's accountant confirms VAT.
const PRODUCTS: Seed[] = [
  {
    slug: "en-korlektion",
    kind: ProductKind.SINGLE_LESSON,
    active: true,
    priceOre: 79500,
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
    priceOre: 49500,
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
    slug: "korpaket-b5",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 369500,
    compareAtOre: 397500,
    lessonCredits: 5,
    accentHex: "#8A8A93",
    translations: {
      sv: { name: "Körpaket B5", shortDesc: "Fem körlektioner för dig som redan övningskör privat och vill ha struktur på slutspurten. Du bokar lektionerna när det passar dig och saldot gäller i 24 månader.", features: ["5 körlektioner à 50 minuter", "Giltigt i 24 månader", "Spara 280 kr"] },
      en: { name: "B5 driving package", shortDesc: "Five driving lessons if you already practise privately and want structure for the final stretch. You book when it suits you and the lessons stay valid for 24 months.", features: ["5 driving lessons of 50 minutes", "Valid for 24 months", "Save 280 kr"] },
      ti: { name: "ፓኬጅ ምዝዋር B5", shortDesc: "ሓሙሽተ ትምህርቲ ምዝዋር ንቐደም ብሕታዊ ዝለማመድካን ኣብ መወዳእታ ስርዓት ዝደሊኻን። ትምህርትታት ኣብ ዝሰማማዕካ ግዜ ትሓዝ እሞ ን24 ወርሒ ይሰርሕ።", features: ["5 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ን24 ወርሒ ይሰርሕ", "280 kr ትቑጥብ"] },
      ar: { name: "باقة القيادة B5", shortDesc: "خمسة دروس إن كنت تتدرّب أصلاً بشكل خاص وتريد ترتيباً للمرحلة الأخيرة. تحجز عندما يناسبك والدروس تبقى صالحة 24 شهراً.", features: ["5 دروس، مدة كل منها 50 دقيقة", "صالحة لمدة 24 شهرًا", "وفّر 280 كرونة"] },
      so: { name: "Xirmada wadista B5", shortDesc: "Shan cashar wadis haddii aad horay si gaar ah ugu tababaratay oo aad rabto qaab dhismeed dhammaadka. Waxaad ballansataa marka kuu habboon, casharraduna waxay shaqeeyaan 24 bilood.", features: ["5 cashar oo min 50 daqiiqo ah", "Waxay shaqaynaysaa 24 bilood", "Kaydi 280 kr"] },
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
      sv: { name: "Körpaket B10", shortDesc: "Tio körlektioner med samma lärare hela vägen, så att någon känner till din körning och vet vad ni ska öva på härnäst.", features: ["10 körlektioner à 50 minuter", "Giltigt i 24 månader", "Spara 760 kr"] },
      en: { name: "B10 driving package", shortDesc: "Ten driving lessons with the same instructor throughout, so someone knows your driving and what you should practise next.", features: ["10 driving lessons of 50 minutes", "Valid for 24 months", "Save 760 kr"] },
      ti: { name: "ፓኬጅ ምዝዋር B10", shortDesc: "ዓሰርተ ትምህርቲ ምዝዋር ምስ ሓደ መምህር ካብ መጀመርታ ክሳብ መወዳእታ፣ ስለዚ ሓደ ሰብ ንምዝዋርካ ይፈልጥ እሞ እንታይ ክትለማመዱ ከምዘለኩም ይፈልጥ።", features: ["10 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ን24 ወርሒ ይሰርሕ", "760 kr ትቑጥብ"] },
      ar: { name: "باقة القيادة B10", shortDesc: "عشرة دروس مع المعلّم نفسه طوال الطريق، فيعرف قيادتك وما يجب أن تتدرّبا عليه بعد ذلك.", features: ["10 دروس، مدة كل منها 50 دقيقة", "صالحة لمدة 24 شهرًا", "وفّر 760 كرونة"] },
      so: { name: "Xirmada wadista B10", shortDesc: "Toban cashar oo macallin isku mid ah laga bilaabo ilaa dhamaadka, si qof u yaqaan wadistaada iyo waxa xiga ee aad ku celcelinaysaan.", features: ["10 cashar oo min 50 daqiiqo ah", "Waxay shaqaynaysaa 24 bilood", "Kaydi 760 kr"] },
    },
  },
  {
    slug: "intensivpaket-silver",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 1049500,
    compareAtOre: 1103900,
    lessonCredits: 10,
    includesTheory: true,
    includesRisk1: true,
    includesRisk2: true,
    accentHex: "#2563EB",
    translations: {
      sv: { name: "Intensivpaket Silver", shortDesc: "Tio körlektioner, båda riskutbildningarna och digital teori utan tidsgräns. För dig som har kört en del innan och vill ha allt samlat på ett ställe.", features: ["10 körlektioner à 50 minuter", "Riskettan och Risktvåan", "Digital teori utan tidsgräns"] },
      en: { name: "Silver intensive package", shortDesc: "Ten driving lessons, both risk courses and digital theory with no time limit. For you who have driven before and want everything in one place.", features: ["10 driving lessons of 50 minutes", "Risk 1 and Risk 2", "Digital theory with no time limit"] },
      ti: { name: "ሲልቨር ጽዑቕ ፓኬጅ", shortDesc: "ዓሰርተ ትምህርቲ ምዝዋር፣ ክልተ ስልጠናታት ሓደጋን ዲጂታላዊ ቲዮሪ ብዘይ ግዜ ገደብን። ቅድሚ ሕጂ ዝነዱኻን ኩሉ ኣብ ሓደ ቦታ ዝደሊኻን።", features: ["10 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1ን ሪስክ 2ን", "ዲጂታላዊ ቲዮሪ ብዘይ ግዜ ገደብ"] },
      ar: { name: "الباقة المكثفة الفضية", shortDesc: "عشرة دروس، دورتا المخاطر والنظري الرقمي بلا مهلة زمنية. لمن قاد من قبل ويريد كل شيء في مكان واحد.", features: ["10 دروس، مدة كل منها 50 دقيقة", "المخاطر 1 والمخاطر 2", "نظري رقمي بلا مهلة زمنية"] },
      so: { name: "Xirmada degdegga ah ee Silver", shortDesc: "Toban cashar wadis, labada koorso ee khatarta iyo teoriga dijitaalka ah oo aan xilli xadidan lahayn. Adiga oo horay u kaxaysay oo rabta in wax walba hal meel ku jiraan.", features: ["10 cashar oo min 50 daqiiqo ah", "Risk 1 iyo Risk 2", "Teori dijitaal ah oo aan xilli xadidan lahayn"] },
    },
  },
  {
    slug: "intensivpaket-guld",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 1849500,
    compareAtOre: 1898900,
    lessonCredits: 20,
    includesTheory: true,
    includesRisk1: true,
    includesRisk2: true,
    badge: "POPULARAST",
    accentHex: "#F5B429",
    translations: {
      sv: { name: "Intensivpaket Guld", shortDesc: "Tjugo körlektioner, båda riskutbildningarna, digital teori utan tidsgräns och förtur när du bokar tider. Vårt vanligaste val för dig som börjar från noll.", features: ["20 körlektioner à 50 minuter", "Riskettan och Risktvåan", "Digital teori utan tidsgräns"] },
      en: { name: "Gold intensive package", shortDesc: "Twenty driving lessons, both risk courses, digital theory with no time limit and priority when you book times. Our most common choice if you start from scratch.", features: ["20 driving lessons of 50 minutes", "Risk 1 and Risk 2", "Digital theory with no time limit"] },
      ti: { name: "ጎልድ ጽዑቕ ፓኬጅ", shortDesc: "ዕስራ ትምህርቲ ምዝዋር፣ ክልተ ስልጠናታት ሓደጋ፣ ዲጂታላዊ ቲዮሪ ብዘይ ግዜ ገደብን ኣብ ቦታ ምሓዝ ቀዳምነትን። ካብ ዜሮ እትጅምር እንተኾይንካ እቲ ኣዝዩ ዝውሕጥ ምርጫና እዩ።", features: ["20 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1ን ሪስክ 2ን", "ዲጂታላዊ ቲዮሪ ብዘይ ግዜ ገደብ"] },
      ar: { name: "الباقة المكثفة الذهبية", shortDesc: "عشرون درساً، دورتا المخاطر، النظري الرقمي بلا مهلة وأولوية عند حجز المواعيد. خيارنا الأكثر شيوعاً إن بدأت من الصفر.", features: ["20 درسًا، مدة كل منها 50 دقيقة", "المخاطر 1 والمخاطر 2", "نظري رقمي بلا مهلة زمنية"] },
      so: { name: "Xirmada degdegga ah ee Gold", shortDesc: "Labaatan cashar, labada koorso ee khatarta, teoriga dijitaalka ah oo aan xilli xadidan lahayn iyo mudnaan marka aad ballansato. Waa doorashadayada ugu badan haddii aad ka bilowdo eber.", features: ["20 cashar oo min 50 daqiiqo ah", "Risk 1 iyo Risk 2", "Teori dijitaal ah oo aan xilli xadidan lahayn"] },
    },
  },
  {
    slug: "intensivpaket-platinum",
    kind: ProductKind.PACKAGE,
    active: true,
    priceOre: 2549500,
    compareAtOre: 2693900,
    lessonCredits: 30,
    includesTheory: true,
    includesRisk1: true,
    includesRisk2: true,
    accentHex: "#7C3AED",
    translations: {
      sv: { name: "Intensivpaket Platinum", shortDesc: "Trettio körlektioner och full förberedelse hela vägen till uppkörningen, med digital teori utan tidsgräns och personlig uppföljning.", features: ["30 körlektioner à 50 minuter", "Riskettan och Risktvåan", "Digital teori utan tidsgräns"] },
      en: { name: "Platinum intensive package", shortDesc: "Thirty driving lessons and full preparation all the way to the driving test, with digital theory with no time limit and personal follow-up.", features: ["30 driving lessons of 50 minutes", "Risk 1 and Risk 2", "Digital theory with no time limit"] },
      ti: { name: "ፕላቲነም ጽዑቕ ፓኬጅ", shortDesc: "ሰላሳ ትምህርቲ ምዝዋርን ምሉእ ምድላው ክሳብ ፈተነ ምዝዋርን፣ ምስ ዲጂታላዊ ቲዮሪ ብዘይ ግዜ ገደብን ውልቃዊ ምኽታልን።", features: ["30 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1ን ሪስክ 2ን", "ዲጂታላዊ ቲዮሪ ብዘይ ግዜ ገደብ"] },
      ar: { name: "الباقة المكثفة البلاتينية", shortDesc: "ثلاثون درساً واستعداد كامل حتى اختبار القيادة، مع نظري رقمي بلا مهلة ومتابعة شخصية.", features: ["30 درسًا، مدة كل منها 50 دقيقة", "المخاطر 1 والمخاطر 2", "نظري رقمي بلا مهلة زمنية"] },
      so: { name: "Xirmada degdegga ah ee Platinum", shortDesc: "Soddon cashar iyo diyaar garow buuxa ilaa imtixaanka wadista, oo leh teori dijitaal ah oo aan xilli xadidan lahayn iyo raacitaanka shakhsi ahaaneed.", features: ["30 cashar oo min 50 daqiiqo ah", "Risk 1 iyo Risk 2", "Teori dijitaal ah oo aan xilli xadidan lahayn"] },
    },
  },
  {
    slug: "korkortsgaranti",
    kind: ProductKind.GUARANTEE,
    active: true,
    priceOre: 2995000,
    compareAtOre: 3091400,
    lessonCredits: 35,
    includesTheory: true,
    includesRisk1: true,
    includesRisk2: true,
    translations: {
      sv: { name: "Körkortsgaranti", shortDesc: "Du kör tills du klarar uppkörningen, till ett fast pris. Inkluderar båda riskutbildningarna och en personlig utbildningsplan från första lektionen.", features: ["35 körlektioner à 50 minuter", "Riskettan och Risktvåan", "Digital teori utan tidsgräns", "Villkor inväntar juridiskt godkännande"] },
      en: { name: "Driving licence guarantee", shortDesc: "You drive until you pass the driving test, at a fixed price. Includes both risk courses and a personal training plan from the first lesson.", features: ["35 driving lessons of 50 minutes", "Risk 1 and Risk 2", "Digital theory with no time limit", "Terms pending legal approval"] },
      ti: { name: "ውሕስነት ፍቓድ ምዝዋር", shortDesc: "ክሳብ ፈተነ ምዝዋር ብዕዉት ክትሰግር ብቐዋሚ ዋጋ ትዝውር። ክልተ ስልጠናታት ሓደጋን ካብ ቀዳማይ ትምህርቲ ውልቃዊ መደብን የጠቓልል።", features: ["35 ትምህርትታት፣ ነፍሲ ወከፍ 50 ደቒቕ", "ሪስክ 1ን ሪስክ 2ን", "ዲጂታላዊ ቲዮሪ ብዘይ ግዜ ገደብ", "ውዕላት ሕጋዊ ፍቓድ ይጽበ"] },
      ar: { name: "ضمان رخصة القيادة", shortDesc: "تقود حتى تنجح في اختبار القيادة بسعر ثابت. يشمل دورتي المخاطر وخطة تدريب شخصية من الدرس الأول.", features: ["35 درسًا، مدة كل منها 50 دقيقة", "المخاطر 1 والمخاطر 2", "نظري رقمي بلا مهلة زمنية", "الشروط بانتظار الاعتماد القانوني"] },
      so: { name: "Dammaanadda laysanka wadista", shortDesc: "Waxaad wadataa ilaa aad ku guulaysato imtixaanka wadista, qiimo go'an. Waxaa ku jira labada koorso ee khatarta iyo qorshe tababar oo qofeed laga bilaabo casharka koowaad.", features: ["35 cashar oo min 50 daqiiqo ah", "Risk 1 iyo Risk 2", "Teori dijitaal ah oo aan xilli xadidan lahayn", "Shuruuduhu waxay sugayaan ansixin sharci"] },
    },
  },
  {
    slug: "riskettan",
    kind: ProductKind.COURSE_SEAT,
    active: true,
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
    active: true,
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
      sv: { name: "Digital körkortsteori", shortDesc: "Öva kategori för kategori och gör övningsprov med samma upplägg som kunskapsprovet. Köp en gång — tillgången har ingen tidsgräns.", features: ["Obegränsad tillgång, ingen tidsgräns", "Studieläge och övningsprov", "Placeholderfrågor i väntan på licensierad bank"] },
      en: { name: "Digital driving theory", shortDesc: "Practise category by category and take mock exams in the same format as the knowledge test. Buy once — access has no time limit.", features: ["Unlimited access, no time limit", "Study mode and mock exams", "Placeholder questions pending a licensed bank"] },
      ti: { name: "ዲጂታላዊ ቲዮሪ ምዝዋር", shortDesc: "ብዓይነት ብዓይነት ለምምድ እሞ ከም ናይ ፍልጠት ፈተነ ዝኾነ ልምምዲ ፈተነ ግበር። ሓንሳብ ደርጊ — ፍቓድ ግዜ ገደብ የብሉን።", features: ["ዘይተወሰነ ፍቓድ፣ ግዜ ገደብ የለን", "ናይ መጽናዕትን ፈተነን ኣገባብ", "ብፍቓድ ዘለዎም ሕቶታት ይጽበ"] },
      ar: { name: "نظري القيادة الرقمي", shortDesc: "تدرّب فئة تلو فئة وأجرِ اختبارات تجريبية بنفس أسلوب اختبار المعرفة. اشترِ مرة واحدة — الوصول بلا مهلة زمنية.", features: ["وصول غير محدود، بلا مهلة زمنية", "وضع دراسة واختبارات تجريبية", "أسئلة مؤقتة بانتظار بنك مرخّص"] },
      so: { name: "Teoriga wadista ee dijitaalka ah", shortDesc: "Ku celceli qayb qayb oo samee imtixaano tijaabo ah oo la mid ah qaabka imtixaanka aqoonta. Hal mar iibso — gelitaanku xilli xadidan ma laha.", features: ["Gelitaan aan xadidnayn, xilli xadidan ma jiro", "Hab waxbarasho iyo imtixaano tijaabo ah", "Su'aalo ku meel gaar ah oo sugaya kayd shati leh"] },
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

  const locationsBySlug = new Map<string, string>();
  for (const location of CLIENT_DATA.locations) {
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
      includesTheory: p.includesTheory ?? false,
      includesRisk1: p.includesRisk1 ?? false,
      includesRisk2: p.includesRisk2 ?? false,
      creditValidDays: 730,
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
  for (const instructor of CLIENT_DATA.instructors) {
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
    if (!productId) throw new Error(`Missing seeded product: ${course.slug}`);
    await db.course.upsert({
      where: { id: course.id },
      update: { kind: course.kind, productId },
      create: { id: course.id, kind: course.kind, productId },
    });
  }

  const saraId = teacherIdsBySlug.get("sara-johansson");
  const dawitId = teacherIdsBySlug.get("dawit-tesfay");
  const aminaId = teacherIdsBySlug.get("amina-hassan");
  const occasions = [
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
