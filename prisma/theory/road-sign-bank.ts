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

type SignGroup = "warning" | "priority" | "prohibit" | "mandatory" | "info";

const GROUP_LABELS: Record<SignGroup, Record<Locale, string>> = {
  warning: { sv: "Varningsmärke", en: "Warning sign", ti: "ምልክት መጠንቀቕታ", ar: "إشارة تحذير" },
  priority: { sv: "Väjningspliktsmärke", en: "Priority sign", ti: "ምልክት ቅድሚያ", ar: "إشارة أولوية" },
  prohibit: { sv: "Förbudsmärke", en: "Prohibitory sign", ti: "ምልክት እገዳ", ar: "إشارة منع" },
  mandatory: { sv: "Påbudsmärke", en: "Mandatory sign", ti: "ምልክት ግዴታ", ar: "إشارة إلزام" },
  info: { sv: "Anvisningsmärke", en: "Information sign", ti: "ምልክት ሓበሬታ", ar: "إشارة إرشاد" },
};

const PROMPTS: Record<Locale, readonly string[]> = {
  sv: [
    "Vilket vägmärke visas?",
    "Vad betyder märket på bilden?",
    "Vad ska du göra när du ser märket?",
    "Vilken grupp tillhör vägmärket?",
  ],
  en: [
    "Which road sign is shown?",
    "What does the sign in the image mean?",
    "What should you do when you see the sign?",
    "Which group does the road sign belong to?",
  ],
  ti: [
    "ኣየናይ ምልክት መንገዲ እዩ ተራእዩ?",
    "እቲ ኣብ ስእሊ ዘሎ ምልክት እንታይ ማለት እዩ?",
    "ነዚ ምልክት ምስ ርኣኻ እንታይ ክትገብር ኣለካ?",
    "እዚ ምልክት ናይ ኣየናይ ጉጅለ እዩ?",
  ],
  ar: [
    "ما إشارة الطريق الظاهرة؟",
    "ماذا تعني الإشارة في الصورة؟",
    "ماذا تفعل عندما ترى الإشارة؟",
    "إلى أي مجموعة تنتمي إشارة الطريق؟",
  ],
};

const ACTIONS: Record<string, Record<Locale, string>> = {
  "A1-1": { sv: "Sänk farten inför kurvan", en: "Slow down before the bend", ti: "ቅድሚ ዕጥፊ ፍጥነት ኣንእስ", ar: "خفف السرعة قبل المنعطف" },
  "A8-1": { sv: "Sänk farten på den ojämna vägen", en: "Slow down on the uneven road", ti: "ኣብ ዘይማዕረ መንገዲ ፍጥነት ኣንእስ", ar: "خفف السرعة على الطريق غير المستوي" },
  "A9-1": { sv: "Sänk farten inför farthindret", en: "Slow down for the speed hump", ti: "ቅድሚ መቐነሲ ፍጥነት ኣንእስ", ar: "خفف السرعة قبل مطب السرعة" },
  "A10-1": { sv: "Anpassa farten på den sliriga vägen", en: "Adjust speed on the slippery road", ti: "ኣብ ሸታሕታሕ መንገዲ ፍጥነት ኣስተኻኽል", ar: "عدّل السرعة على الطريق الزلق" },
  "A13-1": { sv: "Var beredd att stanna för gående", en: "Be ready to stop for pedestrians", ti: "ንእግረኛታት ንምዕራፍ ተዳለ", ar: "كن مستعداً للتوقف للمشاة" },
  "A15-1": { sv: "Håll låg fart där barn kan finnas", en: "Keep a low speed where children may be", ti: "ኣብ ቦታ ህጻናት ትሑት ፍጥነት ሕዝ", ar: "أبقِ سرعة منخفضة حيث قد يوجد أطفال" },
  "A16-1": { sv: "Se upp för cyklar och mopeder", en: "Watch for bicycles and mopeds", ti: "ንብሽክለታን ሞፔድን ተጠንቀቕ", ar: "انتبه للدراجات والدراجات الآلية" },
  "A19-1": { sv: "Se upp för älg på vägen", en: "Watch for moose on the road", ti: "ንኤልክ ኣብ መንገዲ ተጠንቀቕ", ar: "انتبه للموظ على الطريق" },
  "A20-1": { sv: "Sänk farten förbi vägarbetet", en: "Slow down past the roadworks", ti: "ኣብ ስራሕ መንገዲ ፍጥነት ኣንእስ", ar: "خفف السرعة عند أعمال الطريق" },
  "A25-1": { sv: "Håll till höger för mötande trafik", en: "Keep right for oncoming traffic", ti: "ንዝመጽእ ትራፊክ ናብ የማን ሕዝ", ar: "الزم اليمين لحركة المرور المقابلة" },
  "A30-1": { sv: "Förbered dig på cirkulationsplatsen", en: "Prepare for the roundabout", ti: "ንዙርያ መንገዲ ተዳለ", ar: "استعد للدوّار" },
  "A35-1": { sv: "Var beredd att stanna vid järnvägen", en: "Be ready to stop at the railway", ti: "ኣብ ባቡር መሳገሪ ንምዕራፍ ተዳለ", ar: "كن مستعداً للتوقف عند السكة" },
  "B1-1": { sv: "Lämna företräde", en: "Give way", ti: "ቅድሚያ ሃብ", ar: "أعطِ الأولوية" },
  "B2-1": { sv: "Stanna helt innan du kör", en: "Stop completely before driving on", ti: "ቅድሚ ምዝዋር ምሉእ ደው በል", ar: "قف تماماً قبل المتابعة" },
  "B3-1": { sv: "Lämna företräde åt gående på övergångsstället", en: "Give way to people on the crossing", ti: "ንእግረኛታት ኣብ መሳገሪ ቅድሚያ ሃብ", ar: "أعطِ الأولوية للمشاة على الممر" },
  "B4-1": { sv: "Du kör på en huvudled", en: "You are on a priority road", ti: "ኣብ ቀንዲ መንገዲ ትዝውር ኣለኻ", ar: "أنت على طريق ذي أولوية" },
  "C1-1": { sv: "Vänd om, infart är förbjuden", en: "Turn around, entry is forbidden", ti: "ምለስ፣ ምእታው ክልኩል እዩ", ar: "ارجع، الدخول ممنوع" },
  "C27-1": { sv: "Kör om inte", en: "Do not overtake", ti: "ኣይትቕደም", ar: "لا تتجاوز" },
  "C31-5": { sv: "Håll högst 50 km/h", en: "Do not exceed 50 km/h", ti: "ካብ 50 km/h ንላዕሊ ኣይትዝውር", ar: "لا تتجاوز 50 كم/س" },
  "C35-1": { sv: "Parkera inte här", en: "Do not park here", ti: "ኣብዚ ኣይተዕርፍ", ar: "لا تركن هنا" },
  "C39-1": { sv: "Stanna eller parkera inte här", en: "Do not stop or park here", ti: "ኣብዚ ኣይትዕረፍን ኣይትዕርፍን", ar: "لا تتوقف ولا تركن هنا" },
  "D3-1": { sv: "Följ den påbjudna riktningen i cirkulationen", en: "Follow the mandatory roundabout direction", ti: "ነቲ ግዴታዊ ኣንፈት ዙርያ ተኸተል", ar: "اتبع الاتجاه الإلزامي في الدوّار" },
  "D4-1": { sv: "Använd cykelbanan", en: "Use the cycle track", ti: "መንገዲ ብሽክለታ ተጠቐም", ar: "استخدم مسار الدراجات" },
  "E1-1": { sv: "Du kör in på motorväg", en: "You are entering a motorway", ti: "ናብ ሞተር መንገዲ ትኣቱ ኣለኻ", ar: "أنت تدخل طريقاً سريعاً" },
  "E19-1": { sv: "Här får du parkera", en: "You may park here", ti: "ኣብዚ ክተዕርፍ ትኽእል", ar: "يُسمح بالركن هنا" },
};

function explanation(locale: Locale, label: string, code: string) {
  if (locale === "sv") return `Märket är ${label} (${code}).`;
  if (locale === "en") return `The sign means ${label} (${code}).`;
  if (locale === "ti") return `እዚ ምልክት ${label} እዩ (${code})።`;
  return `تعني الإشارة: ${label} (${code}).`;
}

function signGroup(code: string): SignGroup {
  if (code.startsWith("A")) return "warning";
  if (code.startsWith("B")) return "priority";
  if (code.startsWith("C")) return "prohibit";
  if (code.startsWith("D")) return "mandatory";
  return "info";
}

function labelOptions(signIndex: number, round: number, locale: Locale) {
  const correct = SIGNS[signIndex]!;
  const distractors = [round + 1, round + 7, round + 13].map(
    (offset) => SIGNS[(signIndex + offset) % SIGNS.length]!,
  );
  const correctIndex = (signIndex + round) % 4;
  const options = distractors.map((item) => item.labels[locale]);
  options.splice(correctIndex, 0, correct.labels[locale]);
  return { options, correctIndex };
}

function actionOptions(signIndex: number, locale: Locale) {
  const correct = ACTIONS[SIGNS[signIndex]!.code]!;
  const distractors = [1, 8, 16].map(
    (offset) => ACTIONS[SIGNS[(signIndex + offset) % SIGNS.length]!.code]!,
  );
  const correctIndex = signIndex % 4;
  const options = distractors.map((item) => item[locale]);
  options.splice(correctIndex, 0, correct[locale]);
  return { options, correctIndex };
}

function groupOptions(signIndex: number, locale: Locale) {
  const groups = Object.keys(GROUP_LABELS) as SignGroup[];
  const correct = signGroup(SIGNS[signIndex]!.code);
  const others = groups.filter((group) => group !== correct);
  const picked = [0, 1, 2].map((offset) => others[(signIndex + offset) % others.length]!);
  const correctIndex = signIndex % 4;
  const options = picked.map((group) => GROUP_LABELS[group][locale]);
  options.splice(correctIndex, 0, GROUP_LABELS[correct][locale]);
  return { options, correctIndex };
}

function optionsFor(signIndex: number, round: number, locale: Locale) {
  if (round === 2) return actionOptions(signIndex, locale);
  if (round === 3) return groupOptions(signIndex, locale);
  return labelOptions(signIndex, round, locale);
}

const SIGN_QUESTION_CAP = 300;
const ROUNDS = 4;

export const roadSignQuestions: TheoryBankQuestion[] = Array.from({ length: ROUNDS }, (_, round) =>
  SIGNS.map((sign, signIndex) => {
    const sv = optionsFor(signIndex, round, "sv");
    const en = optionsFor(signIndex, round, "en");
    const ti = optionsFor(signIndex, round, "ti");
    const ar = optionsFor(signIndex, round, "ar");
    return {
      id: `sign-r${round}-${sign.code.toLowerCase()}`,
      parm: 10,
      question_sv: PROMPTS.sv[round]!,
      options_sv: sv.options,
      explanation_sv: explanation("sv", sign.labels.sv, sign.code),
      source_citation: `Transportstyrelsen, vägmärke ${sign.code}`,
      translations: {
        en: {
          question: PROMPTS.en[round]!,
          options: en.options,
          explanation: explanation("en", sign.labels.en, sign.code),
        },
        ti: {
          question: PROMPTS.ti[round]!,
          options: ti.options,
          explanation: explanation("ti", sign.labels.ti, sign.code),
        },
        ar: {
          question: PROMPTS.ar[round]!,
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
).flat();

if (roadSignQuestions.length > SIGN_QUESTION_CAP || roadSignQuestions.length !== SIGNS.length * ROUNDS) {
  throw new Error(`ROAD_SIGN_BANK_COUNT ${roadSignQuestions.length}`);
}
