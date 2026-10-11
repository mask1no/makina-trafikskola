import type { TheoryBankQuestion } from "../../scripts/import-theory";

type Locale = "sv" | "en" | "ti" | "ar";

type RoadSignDefinition = {
  code: string;
  labels: Record<Locale, string>;
};

const SIGNS: readonly RoadSignDefinition[] = [
  { code: "A1-1", labels: { sv: "Varning för farlig kurva", en: "Warning for a dangerous bend", ti: "መጠንቀቕታ ንሓደገኛ ዕጥፊ", ar: "تحذير من منعطف خطِر" } },
  { code: "A8-1", labels: { sv: "Varning för ojämn väg", en: "Warning for an uneven road", ti: "መጠንቀቕታ ንዘይማዕረ መንገዲ", ar: "تحذير من طريق غير مستوٍ" } },
  { code: "A9-1", labels: { sv: "Varning för farthinder", en: "Warning for a speed hump", ti: "መጠንቀቕታ ንመቐነሲ ፍጥነት", ar: "تحذير من مطب لتخفيف السرعة" } },
  { code: "A10-1", labels: { sv: "Varning för slirig väg", en: "Warning for a slippery road", ti: "መጠንቀቕታ ንሸታሕታሕ መንገዲ", ar: "تحذير من طريق زلق" } },
  { code: "A13-1", labels: { sv: "Varning för övergångsställe", en: "Warning for a pedestrian crossing", ti: "መጠንቀቕታ ንመሳገሪ እግረኛታት", ar: "تحذير من ممر مشاة" } },
  { code: "A15-1", labels: { sv: "Varning för barn", en: "Warning for children", ti: "መጠንቀቕታ ንህጻናት", ar: "تحذير من أطفال" } },
  { code: "A16-1", labels: { sv: "Varning för cyklande och mopedförare", en: "Warning for cyclists and moped riders", ti: "መጠንቀቕታ ንብሽክለተኛታትን ሞፔድን", ar: "تحذير من راكبي الدراجات والدراجات الآلية" } },
  { code: "A19-1", labels: { sv: "Varning för älg", en: "Warning for moose", ti: "መጠንቀቕታ ንኤልክ", ar: "تحذير من حيوان الموظ" } },
  { code: "A20-1", labels: { sv: "Varning för vägarbete", en: "Warning for roadworks", ti: "መጠንቀቕታ ንስራሕ መንገዲ", ar: "تحذير من أعمال طريق" } },
  { code: "A25-1", labels: { sv: "Varning för mötande trafik", en: "Warning for oncoming traffic", ti: "መጠንቀቕታ ንዝመጽእ ትራፊክ", ar: "تحذير من حركة مرور مقابلة" } },
  { code: "A30-1", labels: { sv: "Varning för cirkulationsplats", en: "Warning for a roundabout", ti: "መጠንቀቕታ ንዙርያ መንገዲ", ar: "تحذير من دوّار" } },
  { code: "A35-1", labels: { sv: "Varning för järnvägskorsning med bommar", en: "Warning for a level crossing with barriers", ti: "መጠንቀቕታ ንባቡር መሳገሪ ምስ መከላኸሊ", ar: "تحذير من تقاطع سكة بحواجز" } },
  { code: "B1-1", labels: { sv: "Väjningsplikt", en: "Give way", ti: "ቅድሚያ ሃብ", ar: "إعطاء الأولوية" } },
  { code: "B2-1", labels: { sv: "Stopplikt", en: "Stop", ti: "ግዴታ ደው ምባል", ar: "قف" } },
  { code: "B3-1", labels: { sv: "Övergångsställe", en: "Pedestrian crossing", ti: "መሳገሪ እግረኛታት", ar: "ممر مشاة" } },
  { code: "B4-1", labels: { sv: "Huvudled", en: "Priority road", ti: "ቀንዲ መንገዲ", ar: "طريق ذو أولوية" } },
  { code: "C1-1", labels: { sv: "Förbud mot infart med fordon", en: "No entry for vehicles", ti: "ንተሽከርከርቲ ምእታው ክልኩል", ar: "ممنوع دخول المركبات" } },
  { code: "C27-1", labels: { sv: "Förbud mot omkörning", en: "No overtaking", ti: "ምቕዳም ክልኩል", ar: "ممنوع التجاوز" } },
  { code: "C31-5", labels: { sv: "Hastighetsbegränsning 50 km/h", en: "Speed limit 50 km/h", ti: "ደረት ፍጥነት 50 km/h", ar: "حد السرعة 50 كم/س" } },
  { code: "C35-1", labels: { sv: "Förbud mot att parkera fordon", en: "No parking", ti: "ምዕራፍ ክልኩል", ar: "ممنوع الوقوف" } },
  { code: "C39-1", labels: { sv: "Förbud mot att stanna och parkera", en: "No stopping or parking", ti: "ደው ምባልን ምዕራፍን ክልኩል", ar: "ممنوع التوقف والوقوف" } },
  { code: "D3-1", labels: { sv: "Påbjuden cirkulationsriktning", en: "Mandatory roundabout direction", ti: "ግዴታዊ ኣንፈት ዙርያ", ar: "اتجاه إلزامي في الدوّار" } },
  { code: "D4-1", labels: { sv: "Påbjuden cykelbana", en: "Mandatory cycle track", ti: "ግዴታዊ መንገዲ ብሽክለታ", ar: "مسار دراجات إلزامي" } },
  { code: "E1-1", labels: { sv: "Motorväg", en: "Motorway", ti: "ሞተር መንገዲ", ar: "طريق سريع" } },
  { code: "E19-1", labels: { sv: "Parkering", en: "Parking", ti: "መዕረፊ መኪና", ar: "موقف سيارات" } },
] as const;

const PROMPTS: Record<Locale, readonly string[]> = {
  sv: ["Vilket vägmärke visas?", "Vad betyder märket på bilden?", "Vilken beskrivning passar vägmärket?"],
  en: ["Which road sign is shown?", "What does the sign in the image mean?", "Which description matches the road sign?"],
  ti: ["ኣየናይ ምልክት መንገዲ እዩ ተራእዩ?", "እቲ ኣብ ስእሊ ዘሎ ምልክት እንታይ ማለት እዩ?", "ኣየናይ መግለጺ ምስቲ ምልክት ይሰማማዕ?"],
  ar: ["ما إشارة الطريق الظاهرة؟", "ماذا تعني الإشارة في الصورة؟", "أي وصف يطابق إشارة الطريق؟"],
};

function explanation(locale: Locale, label: string, code: string) {
  if (locale === "sv") return `Märket är ${label} (${code}).`;
  if (locale === "en") return `The sign means ${label} (${code}).`;
  if (locale === "ti") return `እዚ ምልክት ${label} እዩ (${code})።`;
  return `تعني الإشارة: ${label} (${code}).`;
}

function roundOptions(signIndex: number, round: number, locale: Locale) {
  const correct = SIGNS[signIndex]!;
  const distractors = [round + 1, round + 7, round + 13].map(
    (offset) => SIGNS[(signIndex + offset) % SIGNS.length]!,
  );
  const correctIndex = (signIndex + round) % 4;
  const options = distractors.map((item) => item.labels[locale]);
  options.splice(correctIndex, 0, correct.labels[locale]);
  return { options, correctIndex };
}

export const roadSignQuestions: TheoryBankQuestion[] = SIGNS.flatMap(
  (sign, signIndex) =>
    Array.from({ length: 12 }, (_, round) => {
      const sv = roundOptions(signIndex, round, "sv");
      const en = roundOptions(signIndex, round, "en");
      const ti = roundOptions(signIndex, round, "ti");
      const ar = roundOptions(signIndex, round, "ar");
      const promptIndex = round % PROMPTS.sv.length;
      return {
        id: `sign-${sign.code.toLowerCase()}-${String(round + 1).padStart(2, "0")}`,
        parm: 10,
        question_sv: PROMPTS.sv[promptIndex]!,
        options_sv: sv.options,
        explanation_sv: explanation("sv", sign.labels.sv, sign.code),
        source_citation: `Transportstyrelsen, vägmärke ${sign.code}`,
        translations: {
          en: {
            question: PROMPTS.en[promptIndex]!,
            options: en.options,
            explanation: explanation("en", sign.labels.en, sign.code),
          },
          ti: {
            question: PROMPTS.ti[promptIndex]!,
            options: ti.options,
            explanation: explanation("ti", sign.labels.ti, sign.code),
          },
          ar: {
            question: PROMPTS.ar[promptIndex]!,
            options: ar.options,
            explanation: explanation("ar", sign.labels.ar, sign.code),
          },
        },
        correct_index: sv.correctIndex,
        difficulty: 1,
        needs_image: true,
        image_url: `/road-signs/${sign.code.toLowerCase()}.svg`,
        status: "review" as const,
      };
    }),
);

if (roadSignQuestions.length !== 300) {
  throw new Error(`ROAD_SIGN_BANK_COUNT ${roadSignQuestions.length}`);
}
