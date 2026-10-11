import type { TheoryBankQuestion } from "../../scripts/import-theory";

import { extraPracticeQuestions } from "./practice-bank-extra";

type LocaleCode = "sv" | "en" | "ti" | "ar";
type Row = [question: string, a: string, b: string, c: string, why: string];

const SOURCES: Record<number, string> = {
  1: "Trafikförordningen (1998:1276), 3 kap.",
  2: "Trafikförordningen (1998:1276), 3–4 kap.; Trafikbrottslagen (1951:649)",
  3: "Körkortslagen (1998:488), 5 kap.; Trafikförordningen (1998:1276), 3 kap.",
  4: "Fordonsförordningen (2009:211); Trafikförordningen (1998:1276), 4 kap.",
  5: "Trafikförordningen (1998:1276), 2 kap. 1 §; Miljöbalken (1998:808), 2 kap.",
  6: "Trafikförordningen (1998:1276), 3 kap.; Vägmärkesförordningen (2007:90)",
  7: "Trafikförordningen (1998:1276), 3 kap.; Vägmärkesförordningen (2007:90)",
  8: "Trafikförordningen (1998:1276), 3 kap. 47–57 §§",
  9: "Trafikförordningen (1998:1276); Körkortslagen (1998:488)",
};

function pack(row: Row) {
  return {
    question: row[0],
    options: [row[1], row[2], row[3]] as [string, string, string],
    explanation: row[4],
  };
}

function item(
  id: string,
  parm: number,
  correct: number,
  difficulty: 1 | 2 | 3,
  text: Record<LocaleCode, Row>,
): TheoryBankQuestion {
  const sv = pack(text.sv);
  return {
    id,
    parm,
    question_sv: sv.question,
    options_sv: [...sv.options],
    explanation_sv: sv.explanation,
    source_citation: SOURCES[parm] ?? "Trafikförordningen (1998:1276)",
    correct_index: correct,
    difficulty,
    needs_image: false,
    status: "ok",
    translations: {
      en: pack(text.en),
      ti: pack(text.ti),
      ar: pack(text.ar),
    },
  };
}

/**
 * Original practice questions based on public Swedish traffic rules.
 * This is not Trafikverket's question bank.
 * The correct option is not always first.
 * Each category keeps 20 questions. The importer marks those 20 as free.
 */

export const practiceBankQuestions: TheoryBankQuestion[] = [
  item("mk-01", 1, 1, 1, {
    sv: ["Vilken bashastighet gäller i tättbebyggt område om inget annat är skyltat?", "30 km/h", "50 km/h", "70 km/h", "Bashastigheten i tättbebyggt område är 50 km/h när ingen annan gräns är skyltad."],
    en: ["What is the default speed in a built-up area when no other limit is signed?", "30 km/h", "50 km/h", "70 km/h", "The default speed in a built-up area is 50 km/h when no other limit is signed."],
    ti: ["ኣብ ጽቡቕ ዝተሃንጸ ከተማ እንተዘይተሓንጺጸ እንታይ ባዕላዊ ፍጥነት ይሰርሕ?", "30 km/h", "50 km/h", "70 km/h", "ኣብ ጽቡቕ ዝተሃንጸ ከተማ ካልእ ገደብ እንተዘይተሓንጺጹ ባዕላዊ ፍጥነት 50 km/h እዩ።"],
    ar: ["ما السرعة الأساسية داخل منطقة مبنية إذا لم تُوضع إشارة أخرى؟", "30 كم/س", "50 كم/س", "70 كم/س", "السرعة الأساسية داخل المنطقة المبنية هي 50 كم/س إذا لم تُوضع إشارة أخرى."],
  }),
  item("mk-02", 1, 2, 1, {
    sv: ["Vilken bashastighet gäller utanför tättbebyggt område om inget annat är skyltat?", "50 km/h", "90 km/h", "70 km/h", "Utanför tättbebyggt område är bashastigheten 70 km/h."],
    en: ["What is the default speed outside a built-up area when nothing else is signed?", "50 km/h", "90 km/h", "70 km/h", "Outside a built-up area the default speed is 70 km/h."],
    ti: ["ካብ ጽቡቕ ዝተሃንጸ ከተማ ወጻኢ እንተዘይተሓንጺጸ እንታይ ባዕላዊ ፍጥነት ይሰርሕ?", "50 km/h", "90 km/h", "70 km/h", "ካብ ከተማ ወጻኢ ባዕላዊ ፍጥነት 70 km/h እዩ።"],
    ar: ["ما السرعة الأساسية خارج المنطقة المبنية إذا لم تُوضع إشارة؟", "50 كم/س", "90 كم/س", "70 كم/س", "خارج المنطقة المبنية السرعة الأساسية 70 كم/س."],
  }),
  item("mk-03", 1, 0, 2, {
    sv: ["Vilken bashastighet gäller på motorväg om ingen annan gräns är skyltad?", "110 km/h", "120 km/h", "100 km/h", "På motorväg är bashastigheten 110 km/h. En högre gräns måste vara beslutad och skyltad."],
    en: ["What is the default speed on a motorway when no other limit is signed?", "110 km/h", "120 km/h", "100 km/h", "The default motorway speed is 110 km/h. A higher limit must be decided and signed."],
    ti: ["ኣብ ሞተርወይ ካልእ ገደብ እንተዘይተሓንጺጸ እንታይ ባዕላዊ ፍጥነት ይሰርሕ?", "110 km/h", "120 km/h", "100 km/h", "ኣብ ሞተርወይ ባዕላዊ ፍጥነት 110 km/h እዩ። ዝለዓለ ገደብ ክውሰንን ክሕንጸጽን ኣለዎ።"],
    ar: ["ما السرعة الأساسية على الطريق السريع إذا لم تُوضع إشارة أخرى؟", "110 كم/س", "120 كم/س", "100 كم/س", "السرعة الأساسية على الطريق السريع 110 كم/س. الحد الأعلى يجب أن يُقرَّر ويُشار إليه."],
  }),
  item("mk-04", 1, 1, 1, {
    sv: ["Vad innebär högerregeln i en korsning utan väjningspliktsskylt?", "Den som kommer först kör", "Du har väjningsplikt mot fordon från höger", "Den som kör rakt fram har alltid företräde", "När inget annat reglerar korsningen har du väjningsplikt mot fordon som kommer från höger."],
    en: ["What does the right-hand rule mean at a junction with no yield sign?", "Whoever arrives first goes", "You must give way to vehicles from the right", "Whoever goes straight always has priority", "When nothing else regulates the junction, you give way to vehicles coming from the right."],
    ti: ["ኣብ መስቀለኛ መንገዲ ብዘይ ምልክት ምትሕልላፍ ሕጊ የማን እንታይ ማለት እዩ?", "ቀዲሙ ዝበጽሕ ይሓልፍ", "ካብ የማን ንዝመጽእ ተሽከርካሪ ትህብ", "ብቐጥታ ዝኸይድ ኩሉ ግዜ ቅድሚት ኣለዎ", "ካልእ ሕጊ እንተዘይሃለወ ካብ የማን ንዝመጽእ ተሽከርካሪ ትህብ።"],
    ar: ["ماذا تعني قاعدة اليمين في تقاطع بلا إشارة إعطاء أولوية؟", "من يصل أولاً يمر", "تلتزم بإعطاء الأولوية للقادم من اليمين", "من يسير مستقيمًا له الأولوية دائمًا", "إذا لم ينظم شيء آخر التقاطع، تعطي الأولوية للمركبات القادمة من اليمين."],
  }),
  item("mk-05", 1, 0, 1, {
    sv: ["Vad ska du göra vid en stoppskylt?", "Stanna helt innan du kör vidare", "Sakta ner och köra om det är fritt", "Blinka och hålla din fart", "Stopplikt betyder att du stannar helt. Att bara sakta ner räcker inte."],
    en: ["What must you do at a stop sign?", "Stop completely before moving on", "Slow down and continue if it looks clear", "Signal and keep your speed", "A stop sign means a full stop. Slowing down is not enough."],
    ti: ["ኣብ ምልክት ስቶፕ እንታይ ክትገብር ኣለካ?", "ቅድሚ ምቕጻል ምሉእ ብምሉእ ትቆም", "ትወርድ እሞ ነጻ እንተኾይኑ ትቕጽል", "ትጠቅዕ እሞ ፍጥነትካ ትሕሉ", "ስቶፕ ማለት ምሉእ ምቁራጽ እዩ። ምውራድ ጥራይ ኣይኣኽልን።"],
    ar: ["ماذا يجب أن تفعل عند إشارة قف؟", "تتوقف توقفًا تامًا قبل المتابعة", "تخفف السرعة وتتابع إن بدا الطريق خاليًا", "تستخدم الإشارة وتحتفظ بسرعتك", "إشارة قف تعني توقفًا تامًا. تخفيف السرعة لا يكفي."],
  }),
  item("mk-06", 1, 2, 2, {
    sv: ["Vad gäller för dig som bilförare vid en cykelöverfart?", "Cyklister har alltid väjningsplikt mot dig", "Du får köra om ingen cykel syns långt bort", "Du har väjningsplikt mot cyklister som är på eller just ska färdas ut på överfarten", "Vid en cykelöverfart har bilföraren väjningsplikt mot cyklister som är där eller just ska ut på den."],
    en: ["What applies to you as a car driver at a cycle crossing (cykelöverfart)?", "Cyclists must always give way to you", "You may drive on if no bicycle is visible far away", "You must give way to cyclists who are on the crossing or about to enter it", "At a cykelöverfart the driver gives way to cyclists who are on it or about to enter it."],
    ti: ["ኣብ መሻገሪ ብሽክለታ ከም ሹፌር መኪና እንታይ ይሰርሕ?", "ብሽክለተኛታት ኩሉ ግዜ ንዓኻ ይህቡ", "ርሑቕ ብሽክለታ እንተዘይረኣኻ ትሓልፍ", "ኣብ መሻገሪ ዘለዉ ወይ ክኣትዉ ዝኸዱ ብሽክለተኛታት ትህቦም", "ኣብ ሳይከልኦቨርፋርት ሹፌር ንዝኣተዉ ወይ ክኣትዉ ዝኸዱ ብሽክለተኛታት ይህብ።"],
    ar: ["ما الذي يسري عليك كسائق عند معبر دراجات (cykelöverfart)؟", "على الدراجين دائمًا إعطاؤك الأولوية", "يمكنك العبور إن لم ترَ دراجة بعيدة", "تلتزم بإعطاء الأولوية للدراجين الموجودين على المعبر أو الذين يهمّون بدخوله", "عند cykelöverfart يعطي السائق الأولوية للدراجين الموجودين عليه أو الذين يهمّون بدخوله."],
  }),
  item("mk-07", 1, 0, 2, {
    sv: ["En buss blinkar för att lämna en hållplats i ett tättbebyggt område där högsta tillåtna hastighet är 50 km/h. Vad gör du?", "Du lämnar företräde så att bussen kan köra ut", "Du håller din plats eftersom bussen har väjningsplikt", "Du tutar och kör om bussen", "I tättbebyggt område med högst 50 km/h ska du lämna företräde när en buss blinkar ut från en hållplats."],
    en: ["A bus signals to leave a stop in a built-up area where the speed limit is 50 km/h. What do you do?", "You give way so the bus can pull out", "You hold your place because the bus must yield", "You honk and pass the bus", "In a built-up area with a limit of 50 km/h or lower, you give way when a bus signals to leave a stop."],
    ti: ["ኣብ ከተማ 50 km/h ዝኾነሉ ኣውቶቡስ ካብ መዕረፊ ክወጽእ ምልክት ይገብር። እንታይ ትገብር?", "ኣውቶቡስ ክወጽእ ትህቦ", "ቦታኻ ትሕሉ ምኽንያቱ ኣውቶቡስ ክህብ ኣለዎ", "ትጭዋውዕ እሞ ትሓልፎ", "ኣብ ከተማ እቲ ገደብ 50 km/h ወይ ትሕቲ ምስዝከውን ኣውቶቡስ ካብ መዕረፊ ክወጽእ ምልክት ምስገበረ ትህቦ።"],
    ar: ["حافلة تعطّل للخروج من موقف داخل منطقة مبنية حدّها 50 كم/س. ماذا تفعل؟", "تعطيها الأولوية لتخرج", "تحتفظ بمكانك لأن على الحافلة إعطاء الأولوية", "تستخدم البوق وتتجاوزها", "في منطقة مبنية حدّها 50 كم/س أو أقل تعطي الأولوية للحافلة التي تعطّل لمغادرة الموقف."],
  }),
  item("mk-08", 1, 1, 2, {
    sv: ["Vem har företräde i en cirkulationsplats?", "Den som kör in", "De som redan färdas i cirkulationen", "Den som blinkar vänster", "Du har väjningsplikt mot trafiken som redan är inne i cirkulationsplatsen."],
    en: ["Who has priority in a roundabout?", "The driver entering", "Those already travelling in the roundabout", "The driver signalling left", "You give way to traffic already in the roundabout."],
    ti: ["ኣብ ዙርያ መንገዲ መን ቅድሚት ኣለዎ?", "እቲ ዝኣቱ", "ኣብ ውሽጢ እተን ዘለዋ ተሽከርከርቲ", "የጋች ምልክት ዝገብር", "ኣብ ውሽጢ ዙርያ ንዘለዋ ትራፊክ ትህብ።"],
    ar: ["من له الأولوية في الدوار؟", "من يدخل", "من يسير بالفعل داخل الدوار", "من يستخدم إشارة اليسار", "تلتزم بإعطاء الأولوية للمرور الموجود أصلًا داخل الدوار."],
  }),
  item("mk-09", 2, 0, 1, {
    sv: ["När ska säkerhetsbälte användas i en personbil?", "Av förare och passagerare under färd", "Bara av föraren på motorväg", "Bara när färden är längre än 30 minuter", "Förare och passagerare ska använda bilbälte. Det gäller även korta resor."],
    en: ["When must a seat belt be used in a car?", "By the driver and passengers while driving", "Only by the driver on a motorway", "Only when the trip is longer than 30 minutes", "Driver and passengers must wear seat belts, including on short trips."],
    ti: ["ኣብ መኪና መዐቀኒ መዓንጢ መዓስ ክጥቀም ኣለዎ?", "ሹፌርን ተሳፈርትን ኣብ ጉዕዞ", "ሹፌር ጥራይ ኣብ ሞተርወይ", "ጉዕዞ ካብ 30 ደቒቕ ረጊሙ ጥራይ", "ሹፌርን ተሳፈርትን ቀበቶ ክጥቀሙ ኣለዎም፣ ኣብ ሓጺር ጉዕዞ እውን።"],
    ar: ["متى يجب استخدام حزام الأمان في السيارة؟", "على السائق والركاب أثناء السير", "على السائق فقط في الطريق السريع", "فقط إذا زادت الرحلة على 30 دقيقة", "على السائق والركاب ربط الحزام، حتى في الرحلات القصيرة."],
  }),
  item("mk-10", 2, 2, 2, {
    sv: ["Ett barn är kortare än 135 cm. Vad gäller i bilen?", "Barnet får sitta utan särskilt skydd om färden är kort", "Ett vanligt bilbälte räcker alltid", "Barnet ska använda en godkänd bilbarnstol eller kudde som passar", "Barn kortare än 135 cm ska använda ett särskilt skydd som passar barnets längd och vikt."],
    en: ["A child is shorter than 135 cm. What applies in the car?", "The child may sit without special protection on a short trip", "An ordinary seat belt is always enough", "The child must use an approved seat or booster that fits", "Children shorter than 135 cm need a restraint that matches their height and weight."],
    ti: ["ህጻን ቁመቱ ካብ 135 ሴንቲ ርኡይ እዩ። ኣብ መኪና እንታይ ይሰርሕ?", "ኣብ ሓጺር ጉዕዞ ብዘይ ፍሉይ መከላኸሊ ክቕመጥ ይኽእል", "ንቡር ቀበቶ ኩሉ ግዜ የኣክል", "ዝሰማማዕ ዝተረጋገጸ ኮፍ መበሊ ወይ ኩሽን ክጥቀም ኣለዎ", "ካብ 135 ሴንቲ ዝሓጸሩ ህጻናት ብቁመቶምን ክብደቶምን ዝሰማማዕ መከላኸሊ የድልዮም።"],
    ar: ["طفل أقصر من 135 سم. ما الذي يسري في السيارة؟", "يجوز أن يجلس بلا حماية خاصة في رحلة قصيرة", "حزام عادي يكفي دائمًا", "يجب أن يستخدم مقعدًا أو داعمًا معتمدًا ومناسبًا", "الأطفال الأقصر من 135 سم يحتاجون وسيلة تثبيت تناسب طولهم ووزنهم."],
  }),
  item("mk-11", 2, 1, 1, {
    sv: ["Var går gränsen för rattfylleri?", "0,5 promille", "0,2 promille", "0,8 promille", "Gränsen för rattfylleri är 0,2 promille alkohol i blodet."],
    en: ["Where is the drink-driving limit?", "0.5 per mille", "0.2 per mille", "0.8 per mille", "The drink-driving limit is 0.2 per mille of alcohol in the blood."],
    ti: ["ደረት ስኪር ምዝዋር ኣበይ እዩ?", "0.5 ፕሮሚል", "0.2 ፕሮሚል", "0.8 ፕሮሚል", "ደረት ስኪር ምዝዋር 0.2 ፕሮሚል ኣልኮል ኣብ ደም እዩ።"],
    ar: ["أين يقع حد القيادة تحت تأثير الكحول؟", "0.5 بالألف", "0.2 بالألف", "0.8 بالألف", "حد القيادة تحت تأثير الكحول هو 0.2 بالألف في الدم."],
  }),
  item("mk-12", 2, 0, 2, {
    sv: ["Från vilken alkoholhalt räknas rattfylleriet som grovt?", "1,0 promille", "0,5 promille", "1,5 promille", "Rattfylleri räknas som grovt från 1,0 promille."],
    en: ["From which alcohol level is drink-driving classed as aggravated?", "1.0 per mille", "0.5 per mille", "1.5 per mille", "Drink-driving is aggravated from 1.0 per mille."],
    ti: ["ካብ ክንደይ ኣልኮል ጀሚሩ ስኪር ምዝዋር ከቢድ ይቑጸር?", "1.0 ፕሮሚል", "0.5 ፕሮሚል", "1.5 ፕሮሚል", "ስኪር ምዝዋር ካብ 1.0 ፕሮሚል ጀሚሩ ከቢድ ይቑጸር።"],
    ar: ["من أي نسبة يُعدّ القيادة تحت تأثير الكحول جسيمة؟", "1.0 بالألف", "0.5 بالألف", "1.5 بالألف", "تُعدّ القيادة تحت تأثير الكحول جسيمة ابتداءً من 1.0 بالألف."],
  }),
  item("mk-13", 2, 2, 1, {
    sv: ["Får du hålla en mobiltelefon i handen medan du kör?", "Ja, om du kör långsamt", "Ja, i köer", "Nej", "Det är förbjudet att hålla en mobiltelefon eller annan kommunikationsutrustning i handen under körning."],
    en: ["May you hold a mobile phone in your hand while driving?", "Yes, if you drive slowly", "Yes, in a queue", "No", "It is forbidden to hold a mobile phone or other communication device while driving."],
    ti: ["እንትዝውር ሞባይል ብኢድካ ክትሕዝ ትኽእል ዲኻ?", "እወ፣ ቀስ እንተተዘዊርካ", "እወ፣ ኣብ መስርዕ", "ኣይፋል", "ኣብ ምዝዋር ሞባይል ወይ ካልእ መራኸቢ ብኢድ ምሓዝ ክልኩል እዩ።"],
    ar: ["هل يجوز أن تمسك هاتفًا بيدك أثناء القيادة؟", "نعم إذا قدت ببطء", "نعم في الازدحام", "لا", "يُحظر إمساك الهاتف أو أي جهاز اتصال باليد أثناء القيادة."],
  }),
  item("mk-14", 2, 1, 1, {
    sv: ["När ska bilens belysning vara tänd?", "Bara i mörker och regn", "Även i dagsljus", "Bara på motorväg", "Belysningen ska vara tänd även på dagen."],
    en: ["When must the car's lights be on?", "Only in darkness and rain", "In daylight as well", "Only on the motorway", "Lights must be on during the day as well."],
    ti: ["መብራህቲ መኪና መዓስ ክበርህ ኣለዎ?", "ኣብ ጸልማትን ዝናብን ጥራይ", "ኣብ መዓልቲ እውን", "ኣብ ሞተርወይ ጥራይ", "መብራህቲ ኣብ መዓልቲ እውን ክበርህ ኣለዎ።"],
    ar: ["متى يجب أن تكون أضواء السيارة مضاءة؟", "في الظلام والمطر فقط", "في وضح النهار أيضًا", "على الطريق السريع فقط", "يجب أن تكون الأضواء مضاءة في النهار أيضًا."],
  }),
  item("mk-15", 2, 0, 2, {
    sv: ["Ett utryckningsfordon närmar sig med blåljus och siren. Vad gör du?", "Lämnar fri väg och stannar om det behövs", "Ökar farten så att du inte är i vägen", "Följer efter så att du kommer fram snabbare", "Du ska lämna fri väg åt utryckningsfordon. Följ inte efter det."],
    en: ["An emergency vehicle approaches with blue lights and a siren. What do you do?", "Leave a clear path and stop if needed", "Speed up so you are not in the way", "Follow it so you get there faster", "Leave a clear path for the emergency vehicle. Do not follow it."],
    ti: ["ናይ ህጹጽ ተሽከርከሪ ብሰማያዊ መብራህትን ሳይረንን ትቀርብ። እንታይ ትገብር?", "ነጻ መንገዲ ትህብ እሞ እንተደሊኻ ትቆም", "ከይትኸውን መትከል ፍጥነት ትውስኽ", "ብቕልጡፍ ክትበጽሕ ስለትደሊ ትስዕቦ", "ንህጹጽ ተሽከርከሪ ነጻ መንገዲ ትህብ። ድሕሪኡ ኣይትስዕብ።"],
    ar: ["تقترب مركبة طوارئ بأضواء زرقاء وصفّارة. ماذا تفعل؟", "تفسح الطريق وتتوقف إن لزم", "تزيد السرعة كي لا تعترضها", "تتبعها لتصل أسرع", "أفسح الطريق لمركبة الطوارئ. لا تتبعها."],
  }),
  item("mk-16", 2, 2, 1, {
    sv: ["Vad är tresekundersregeln ett sätt att göra?", "Mäta bromssträckan i meter", "Välja rätt växel", "Hålla ett tillräckligt avstånd till fordonet framför", "Tresekundersregeln är ett praktiskt sätt att hålla avstånd: när fordonet framför passerar en punkt räknar du minst tre sekunder innan du är där."],
    en: ["What is the three-second rule a way of doing?", "Measuring the braking distance in metres", "Choosing the right gear", "Keeping enough distance from the vehicle ahead", "The three-second rule is a practical way to keep a gap: count at least three seconds after the vehicle ahead passes a point."],
    ti: ["ሕጊ ሰለስተ ሰከንድ መንገዲ እንታይ ምግባር እዩ?", "ናይ ብረክ ርሕቀት ብሜትሮ ምዕቃን", "ቅኑዕ ጊር ምምራጽ", "ርሑቕ ካብ ቅድሚኻ ዘሎ ተሽከርከሪ ምሓዝ", "ሰለስተ ሰከንድ ንቑጽ ክትገብር እዩ፣ እቲ ቅድሚኻ ዘሎ ነጥቢ ምስሓለፈ ክሳብ ሰለስተ ሰከንድ ትቑጽር።"],
    ar: ["قاعدة الثلاث ثوانٍ وسيلة لفعل ماذا؟", "قياس مسافة الكبح بالأمتار", "اختيار الغيار المناسب", "إبقاء مسافة كافية عن المركبة أمامك", "قاعدة الثلاث ثوانٍ طريقة عملية للمسافة: عدّ ثلاث ثوانٍ على الأقل بعد أن تمر المركبة الأمامية بنقطة."],
  }),
  item("mk-17", 3, 1, 1, {
    sv: ["Hur påverkar trötthet din körning?", "Den gör reaktionen snabbare", "Den försämrar uppmärksamhet och reaktion", "Den påverkar bara körning på natten", "Trötthet gör dig mindre uppmärksam och långsammare att reagera. Vila innan du kör."],
    en: ["How does tiredness affect your driving?", "It makes your reaction faster", "It worsens attention and reaction", "It only affects driving at night", "Tiredness makes you less alert and slower to react. Rest before you drive."],
    ti: ["ድኻም ምዝዋርካ ብኸመይ ይጸልዎ?", "ምላሽ ይቅልጥፎ", "ትኹረትን ምላሽን የጉድኦ", "ኣብ ለይቲ ጥራይ ይጸልዎ", "ድኻም ትኹረት ይቕንስ እሞ ምላሽ የነውት። ቅድሚ ምዝዋር ዕረፍ።"],
    ar: ["كيف يؤثر التعب في قيادتك؟", "يجعل ردّ الفعل أسرع", "يُضعف الانتباه وردّ الفعل", "يؤثر فقط في القيادة ليلًا", "التعب يقلل الانتباه ويبطئ ردّ الفعل. استرح قبل أن تقود."],
  }),
  item("mk-18", 3, 0, 2, {
    sv: ["Du drack alkohol kvällen innan. Får du köra morgonen efter om du känner dig pigg?", "Nej, inte om alkohol finns kvar i kroppen", "Ja, om du sovit minst sex timmar", "Ja, om du äter frukost", "Känslan av att vara pigg räcker inte. Kör inte om du fortfarande har alkohol i kroppen."],
    en: ["You drank alcohol the evening before. May you drive the next morning if you feel alert?", "No, not if alcohol is still in your body", "Yes, if you slept at least six hours", "Yes, if you eat breakfast", "Feeling alert is not enough. Do not drive if alcohol is still in your body."],
    ti: ["ትማሊ ለይቲ ኣልኮል ሰቲኻ። ንግሆ ህያው እንተተሰሚዕካ ክትዝውር ትኽእል ዲኻ?", "ኣይፋል፣ ኣልኮል ኣብ ኣካላትካ እንተተሪፉ", "እወ፣ እንተዓሪፍካ ልዕሊ ሽድሽተ ሰዓት", "እወ፣ ቁርሲ እንተበሊዕካ", "ህያው ምስምማዕ ኣይኣኽልን። ኣልኮል ኣብ ኣካላትካ እንተሃለወ ኣይትዝውር።"],
    ar: ["شربت كحولًا مساء الأمس. هل تقود في الصباح إذا شعرت باليقظة؟", "لا، إذا بقي كحول في جسمك", "نعم إذا نمت ست ساعات على الأقل", "نعم إذا تناولت الفطور", "الشعور باليقظة لا يكفي. لا تقد إذا بقي كحول في جسمك."],
  }),
  item("mk-19", 3, 2, 2, {
    sv: ["Läkemedel kan påverka körningen. Vad är det säkraste?", "Köra långsammare och hoppas att det räcker", "Ta en extra dos så att du blir piggare", "Läsa varningen och avstå från att köra om läkemedlet påverkar förmågan", "Vissa läkemedel försämrar omdöme, syn eller reaktion. Kör inte om varningen säger att du inte ska köra."],
    en: ["Medicine can affect driving. What is the safest choice?", "Drive more slowly and hope that is enough", "Take an extra dose so you feel more alert", "Read the warning and do not drive if the medicine affects your ability", "Some medicines impair judgement, vision or reaction. Do not drive if the warning says not to."],
    ti: ["መድሃኒት ምዝዋር ክጸልዎ ይኽእል። እቲ ውሑስ ምርጫ እንታይ እዩ?", "ቀስ ምዝዋርን ተስፋ ምግባርን", "ተወሳኺ መጠን ምውሳድ ክትህየው", "መጠንቀቕታ ምንባብ እሞ ንኽእለት እንተጸሊኡ ዘይምዝዋር", "ገለ መድሃኒት ፍርዲ፣ ምርኣይ ወይ ምላሽ ይጉድእ። መጠንቀቕታ ዘይትዝውር እንተበለ ኣይትዝውር።"],
    ar: ["الدواء قد يؤثر في القيادة. ما الخيار الأسلم؟", "القيادة أبطأ والأمل أن يكفي ذلك", "أخذ جرعة إضافية لتصبح أكثر يقظة", "قراءة التحذير والامتناع عن القيادة إذا أثّر الدواء في قدرتك", "بعض الأدوية تُضعف الحكم أو البصر أو ردّ الفعل. لا تقد إذا قال التحذير ذلك."],
  }),
  item("mk-20", 3, 1, 2, {
    sv: ["Hastigheten ökar. Vad händer med bromssträckan?", "Den blir kortare", "Den blir längre", "Den är alltid densamma", "Ju fortare du kör, desto längre blir bromssträckan. Den växer snabbare än farten."],
    en: ["Your speed increases. What happens to the braking distance?", "It becomes shorter", "It becomes longer", "It always stays the same", "The faster you drive, the longer the braking distance. It grows faster than the speed."],
    ti: ["ፍጥነት ይውስኽ። ናይ ብረክ ርሕቀት እንታይ ይኸውን?", "ይሓጽር", "ይነውሕ", "ኩሉ ግዜ ሓደ እዩ", "ብዝበለጸ ፍጥነት ክትዝውር ከለኻ ናይ ብረክ ርሕቀት ይነውሕ። ካብ ፍጥነት ብቕልጡፍ ይዓቢ።"],
    ar: ["تزداد سرعتك. ماذا يحدث لمسافة الكبح؟", "تقصر", "تطول", "تبقى دائمًا كما هي", "كلما زادت السرعة طالت مسافة الكبح. وهي تزيد أسرع من السرعة."],
  }),
  item("mk-21", 3, 0, 1, {
    sv: ["Du blir arg på en annan förare. Vad är säkrast?", "Släpp det och håll uppmärksamheten på trafiken", "Köra ikapp för att visa vad du tycker", "Tuta länge så att föraren förstår", "Ilska tar uppmärksamhet från körningen. Låt det gå och håll blicken på trafiken."],
    en: ["You get angry with another driver. What is safest?", "Let it go and keep your attention on the traffic", "Catch up to show what you think", "Honk for a long time so the driver understands", "Anger takes attention away from driving. Let it pass and watch the traffic."],
    ti: ["ኣብ ካልእ ሹፌር ትቖጣ። እቲ ውሑስ እንታይ እዩ?", "ግደፎ እሞ ትኹረትካ ኣብ ትራፊክ ግበር", "ርእይቶኻ ንምርኣይ ስዓቦ", "ሹፌር ክርድኦ ነዊሕ ጭውዋዕ", "ቝጣ ትኹረት ካብ ምዝዋር ይወስድ። ግደፎ እሞ ንትራፊክ ርአ።"],
    ar: ["تغضب من سائق آخر. ما الأسلم؟", "تترك الأمر وتُبقي انتباهك على المرور", "تلحق به لتريه رأيك", "تستخدم البوق طويلًا ليفهم", "الغضب يصرف الانتباه عن القيادة. دعه يمر وراقب المرور."],
  }),
  item("mk-22", 3, 2, 2, {
    sv: ["Ditt körkort säger att du ska använda glasögon eller linser. Vad gäller?", "Det räcker att du har dem med dig", "Du kan välja själv när de behövs", "Du ska använda dem när du kör", "Om villkoret står på körkortet ska du använda synkorrigering när du kör."],
    en: ["Your licence says you must use glasses or lenses. What applies?", "It is enough to carry them with you", "You may decide yourself when they are needed", "You must wear them when you drive", "If the condition is on the licence, you must use the correction when you drive."],
    ti: ["ፍቓድካ መነጽር ወይ ሌንስ ክትጥቀም ይብል። እንታይ ይሰርሕ?", "ምሳኻ ምሓዝ የኣኽል", "መዓስ ከምዝድልዩ ንስኻ ትውስን", "እንትዝውር ክትጥቀሞም ኣለካ", "እቲ ቅድመ ኩነት ኣብ ፍቓድ እንተጸሓፈ ኣብ ምዝዋር ክትጥቀመሉ ኣለካ።"],
    ar: ["رخصتك تقول إن عليك استخدام نظارة أو عدسات. ما الذي يسري؟", "يكفي أن تحملها معك", "تقرر أنت متى تلزم", "يجب أن تضعها عندما تقود", "إذا كان الشرط على الرخصة فعليك استخدام التصحيح أثناء القيادة."],
  }),
  item("mk-23", 3, 1, 1, {
    sv: ["Varför är det farligt att stirra på en sak länge, till exempel en mobil eller en olycka?", "Bilen stannar av sig själv", "Du missar vad som händer runt dig", "Det gör att du ser bättre i mörker", "När blicken fastnar på ett ställe missar du övrig trafik, fotgängare och hinder."],
    en: ["Why is it dangerous to stare at one thing for a long time, such as a phone or a crash?", "The car stops by itself", "You miss what is happening around you", "It helps you see better in the dark", "When your eyes stay on one place you miss the rest of the traffic, people and obstacles."],
    ti: ["ንሓደ ነገር ነዊሕ ምጥማት፣ ከም ሞባይል ወይ ሓደጋ፣ ስለምንታይ ሓደገኛ እዩ?", "መኪና ባዕላ ትቆም", "ኣብ ከባቢኻ ዝኸውን ትስዕቦ", "ኣብ ጸልማት ጽቡቕ ክትርኢ ይሕግዝ", "ኣዒንትኻ ኣብ ሓደ ቦታ ምስጸንሑ ካልእ ትራፊክን ሰባትን ዕንቅፋትን ትስዕብ።"],
    ar: ["لماذا يخطر التحديق طويلًا في شيء واحد، كهاتف أو حادث؟", "السيارة تتوقف وحدها", "تفوّت ما يجري حولك", "يساعدك على الرؤية أفضل في الظلام", "حين تثبت العين على مكان تفوّت بقية المرور والمشاة والعوائق."],
  }),
  item("mk-24", 3, 0, 3, {
    sv: ["Du kör i grupp och de andra vill att du kör fortare än vad du är bekväm med. Vad är säkrast?", "Köra i din egen säkra takt", "Hålla samma fart som gruppen även om det känns för fort", "Köra om gruppen för att inte sinka den", "Grupptryck är inte ett skäl att köra fortare än du klarar. Håll din egen säkra fart."],
    en: ["You are driving with a group and the others want you to go faster than you are comfortable with. What is safest?", "Drive at your own safe pace", "Match the group even if it feels too fast", "Overtake the group so you do not delay it", "Group pressure is not a reason to drive faster than you can handle. Keep your own safe speed."],
    ti: ["ምስ ጉጅለ ትዝውር እሞ ካልኦት ካብ ዝስመዓካ ብዝበለጸ ፍጥነት ክትዝውር ይደልዩ። እቲ ውሑስ እንታይ እዩ?", "ብናትካ ውሑስ ቅርጻዕ ምዝዋር", "ብዙሕ እንተተሰሚዑ ምስ ጉጅለ ምስማም", "ጉጅለ ከይትዓገት ምሕላፍ", "ጸቕጢ ጉጅለ ካብ ትኽእለሉ ብዝበለጸ ንምዝዋር ምኽንያት ኣይኮነን። ናትካ ውሑስ ፍጥነት ሕዝ።"],
    ar: ["تقود مع مجموعة ويريد الآخرون أن تسير أسرع مما ترتاح له. ما الأسلم؟", "القيادة بوتيرتك الآمنة", "مجاراة المجموعة حتى لو شعرت أنها سريعة", "تجاوز المجموعة كي لا تعطلها", "ضغط المجموعة ليس سببًا للقيادة أسرع مما تقدر عليه. حافظ على سرعتك الآمنة."],
  }),
  item("mk-25", 4, 1, 1, {
    sv: ["Vilket minsta mönsterdjup gäller för sommardäck?", "1,0 mm", "1,6 mm", "3,0 mm", "Sommardäck ska ha minst 1,6 mm mönsterdjup."],
    en: ["What is the minimum tread depth for summer tyres?", "1.0 mm", "1.6 mm", "3.0 mm", "Summer tyres must have at least 1.6 mm of tread."],
    ti: ["ንሓጋይ ጎማ እንታይ ዝተሓተ ጥልመት ቅርጺ ይሰርሕ?", "1.0 ሚሜ", "1.6 ሚሜ", "3.0 ሚሜ", "ናይ ሓጋይ ጎማ እንተወሓደ 1.6 ሚሜ ጥልመት ክህልዎ ኣለዎ።"],
    ar: ["ما أقل عمق لنقش إطارات الصيف؟", "1.0 مم", "1.6 مم", "3.0 مم", "إطارات الصيف يجب أن يكون نقشها 1.6 مم على الأقل."],
  }),
  item("mk-26", 4, 2, 1, {
    sv: ["Vilket minsta mönsterdjup gäller för vinterdäck när kravet på vinterdäck gäller?", "1,6 mm", "2,0 mm", "3 mm", "När vinterdäck krävs ska mönsterdjupet vara minst 3 mm."],
    en: ["What is the minimum tread when winter tyres are required?", "1.6 mm", "2.0 mm", "3 mm", "When winter tyres are required the tread must be at least 3 mm."],
    ti: ["ናይ ክረምቲ ጎማ ምስድለ እንታይ ዝተሓተ ጥልመት ይሰርሕ?", "1.6 ሚሜ", "2.0 ሚሜ", "3 ሚሜ", "ናይ ክረምቲ ጎማ ምስድለ ጥልመት እንተወሓደ 3 ሚሜ ክኸውን ኣለዎ።"],
    ar: ["ما أقل نقش عندما تُشترط إطارات الشتاء؟", "1.6 مم", "2.0 مم", "3 مم", "عندما تُشترط إطارات الشتاء يجب أن يكون النقش 3 مم على الأقل."],
  }),
  item("mk-27", 4, 0, 2, {
    sv: ["När är dubbdäck normalt tillåtna?", "1 oktober–15 april", "1 december–31 mars", "Hela året", "Dubbdäck får användas 1 oktober–15 april. Annan tid bara om det är eller befaras bli vinterväglag."],
    en: ["When are studded tyres normally allowed?", "1 October–15 April", "1 December–31 March", "All year", "Studded tyres may be used from 1 October to 15 April. Outside that, only if there is or is expected to be winter road conditions."],
    ti: ["ናይ ስፒክ ጎማ መዓስ ብንቡር ይፍቀድ?", "1 ጥቅምቲ–15 ሚያዝያ", "1 ታሕሳስ–31 መጋቢት", "ኩሉ ዓመት", "ናይ ስፒክ ጎማ ካብ 1 ጥቅምቲ ክሳብ 15 ሚያዝያ ይጥቀም። ካብኡ ወጻኢ ናይ ክረምቲ መንገዲ ምስዝህሉ ወይ ክህሉ ምስዝግመት ጥራይ።"],
    ar: ["متى يُسمح عادة بالإطارات ذات المسامير؟", "1 أكتوبر–15 أبريل", "1 ديسمبر–31 مارس", "طوال السنة", "يُسمح بالإطارات ذات المسامير من 1 أكتوبر إلى 15 أبريل. خارج ذلك فقط إذا كان الطريق شتويًا أو يُخشى أن يصبح كذلك."],
  }),
  item("mk-28", 4, 1, 2, {
    sv: ["Under vilken period måste bilen ha vinterdäck vid vinterväglag?", "1 oktober–15 april", "1 december–31 mars", "Bara när det snöar just nu", "Vid vinterväglag under 1 december–31 mars ska personbilar använda vinterdäck."],
    en: ["During which period must the car have winter tyres in winter road conditions?", "1 October–15 April", "1 December–31 March", "Only while it is snowing at that moment", "In winter road conditions from 1 December to 31 March, cars must use winter tyres."],
    ti: ["ኣብ ክረምታዊ መንገዲ መኪና ኣበይ እዋን ናይ ክረምቲ ጎማ ክህልዋ ኣለዋ?", "1 ጥቅምቲ–15 ሚያዝያ", "1 ታሕሳስ–31 መጋቢት", "ኣብታ ሰዓት ምስዝናብ ጥራይ", "ካብ 1 ታሕሳስ ክሳብ 31 መጋቢት ኣብ ክረምታዊ መንገዲ መካይን ናይ ክረምቲ ጎማ ክጥቀማ ኣለወን።"],
    ar: ["في أي فترة يجب أن تحمل السيارة إطارات شتاء عند أحوال الطرق الشتوية؟", "1 أكتوبر–15 أبريل", "1 ديسمبر–31 مارس", "فقط أثناء تساقط الثلج في تلك اللحظة", "في أحوال الطرق الشتوية من 1 ديسمبر إلى 31 مارس يجب أن تستخدم السيارات إطارات شتاء."],
  }),
  item("mk-29", 4, 2, 2, {
    sv: ["Bilen har ABS och du måste bromsa hårt. Vad gör du?", "Du pumpar bromsen", "Du släpper ratten och bromsar", "Du trampar ner bromsen stadigt och styr dit du vill", "Med ABS trampar du ner bromsen bestämt och fortsätter styra. Systemet hindrar hjulen från att låsa sig."],
    en: ["The car has ABS and you must brake hard. What do you do?", "You pump the brake", "You let go of the wheel and brake", "You press the brake firmly and steer where you want to go", "With ABS you press the brake firmly and keep steering. The system stops the wheels from locking."],
    ti: ["መኪና ABS ኣለዋ እሞ ጥንኩር ክትብርክ ኣለካ። እንታይ ትገብር?", "ብረክ ትጭንቅን", "መሪሕ ትሓድግ እሞ ትብርክ", "ብረክ ብጽኑዕ ትጭንቕ እሞ ናብ እትደሊ ትመርሕ", "ብABS ብረክ ብጽኑዕ ትጭንቕ እሞ ምምራሕ ትቕጽል። ሲስተም መንኰርኰር ካብ ምዕጻው ይኽልእ።"],
    ar: ["السيارة فيها ABS وعليك الكبح بقوة. ماذا تفعل؟", "تضغط الفرامل على دفعات", "تترك المقود وتكبح", "تضغط الفرامل بثبات وتوجّه حيث تريد", "مع ABS تضغط الفرامل بثبات وتستمر في التوجيه. النظام يمنع العجلات من الانغلاق."],
  }),
  item("mk-30", 4, 0, 3, {
    sv: ["Bilen vattenplanar. Vad är det första du gör?", "Lättar på gasen och håller ratten stilla", "Bromsar hårt och svänger undan", "Ökar farten så att däcken får fäste", "Vid vattenplaning lättar du på gasen, undviker hårda rattrörelser och låter däcken få kontakt med vägen igen."],
    en: ["The car is aquaplaning. What do you do first?", "Ease off the accelerator and hold the wheel steady", "Brake hard and swerve", "Speed up so the tyres grip", "In aquaplaning you ease off, avoid sharp steering and let the tyres meet the road again."],
    ti: ["መኪና ኣብ ማይ ትንሸራተት። መጀመርታ እንታይ ትገብር?", "ጋዝ ትቐልል እሞ መሪሕ ብስቕታ ትሕዝ", "ጥንኩር ትብርክ እሞ ትጥምት", "ጎማ መትከል ክረክብ ፍጥነት ትውስኽ", "ኣብ ማይ ምንሽርታት ጋዝ ትቐልል፣ ስለዝበለ መሪሕ ትወግድ፣ ጎማ መንገዲ ክረክብ ትጽበ።"],
    ar: ["السيارة تتزحلق على الماء. ماذا تفعل أولًا؟", "ترفع قدمك عن الوقود وتُبقي المقود ثابتًا", "تكبح بقوة وتنحرف", "تزيد السرعة لتمسك الإطارات", "عند التزحلق على الماء ترفع القدم عن الوقود وتتجنب تحريك المقود بشدة حتى تلامس الإطارات الطريق."],
  }),
  item("mk-31", 4, 1, 1, {
    sv: ["Vad ska du kontrollera på belysningen innan du kör?", "Att bara helljuset fungerar", "Att lyktor, blinkers och bromsljus fungerar", "Att innerbelysningen är tänd", "Före körning ska halv- och helljus, blinkers och bromsljus fungera."],
    en: ["What should you check on the lights before driving?", "That only the high beam works", "That lamps, indicators and brake lights work", "That the interior light is on", "Before driving, dipped and main beam, indicators and brake lights should work."],
    ti: ["ቅድሚ ምዝዋር ኣብ መብራህቲ እንታይ ክትመርምር ኣለካ?", "ዓቢ መብራህቲ ጥራይ ከምዝሰርሕ", "መብራህቲ፣ ምልክትን ብረክ መብራህትን ከምዝሰርሑ", "ናይ ውሽጢ መብራህቲ ከምዝበርህ", "ቅድሚ ምዝዋር ትሑትን ዓቢን መብራህቲ፣ ምልክትን ብረክ መብራህትን ክሰርሑ ኣለዎም።"],
    ar: ["ماذا تفحص في الأضواء قبل القيادة؟", "أن الضوء العالي فقط يعمل", "أن المصابيح والإشارات وأضواء الفرامل تعمل", "أن ضوء المقصورة مضاء", "قبل القيادة يجب أن تعمل الأضواء المنخفضة والعالية والإشارات وأضواء الفرامل."],
  }),
  item("mk-32", 4, 0, 2, {
    sv: ["Lasten skymmer en baklykta. Får du köra så?", "Nej", "Ja, om färden är kort", "Ja, på dagen", "Lasten får inte skymma belysning, registreringsskylt eller din sikt."],
    en: ["The load hides a rear lamp. May you drive like that?", "No", "Yes, on a short trip", "Yes, in daylight", "The load must not hide lights, the number plate or your view."],
    ti: ["ጽዕነት ናይ ድሕሪት መብራህቲ ይሽፍን። ከምኡ ክትዝውር ትኽእል ዲኻ?", "ኣይፋል", "እወ፣ ኣብ ሓጺር ጉዕዞ", "እወ፣ ኣብ መዓልቲ", "ጽዕነት መብራህቲ፣ ቁጽሪ ሰሌዳ ወይ ምርኣይካ ክሽፍን የብሉን።"],
    ar: ["الحمولة تحجب مصباحًا خلفيًا. هل تقود هكذا؟", "لا", "نعم في رحلة قصيرة", "نعم في النهار", "يجب ألا تحجب الحمولة الأضواء أو لوحة التسجيل أو رؤيتك."],
  }),
  item("mk-33", 5, 1, 1, {
    sv: ["Hur påverkar en lägre och jämn fart bränsleförbrukningen?", "Den ökar alltid", "Den minskar ofta förbrukningen", "Den påverkar bara elbilar", "En lägre och jämnare fart drar i regel mindre bränsle än upprepade accelerationer."],
    en: ["How does a lower, steady speed affect fuel use?", "It always increases it", "It often reduces consumption", "It only affects electric cars", "A lower, steadier speed usually uses less fuel than repeated acceleration."],
    ti: ["ትሑትን ቀጻልን ፍጥነት ነዳዲ ብኸመይ ይጸልዎ?", "ኩሉ ግዜ ይውስኽ", "መብዛሕቱ ግዜ ፍጻመ ይቕንስ", "ናይ ኤሌክትሪክ መካይን ጥራይ ይጸልዎ", "ትሑትን ቀጻልን ፍጥነት ካብ ተደጋጋሚ ምቅልጣፍ ነዳዲ ይቕንስ።"],
    ar: ["كيف تؤثر سرعة أقل وثابتة في استهلاك الوقود؟", "تزيده دائمًا", "غالبًا تقلل الاستهلاك", "تؤثر فقط في السيارات الكهربائية", "السرعة الأقل والأكثر ثباتًا تستهلك عادة وقودًا أقل من التسارع المتكرر."],
  }),
  item("mk-34", 5, 0, 2, {
    sv: ["Du närmar dig en lägre hastighetsgräns. Vad sparar oftast mest bränsle?", "Att släppa gasen i tid och motorbromsa", "Att hålla farten och bromsa sent", "Att lägga i friläge i nedförsbacke", "Att planera och lätta på gasen i tid drar mindre än att bromsa bort farten sent."],
    en: ["You are approaching a lower speed limit. What usually saves the most fuel?", "Easing off in time and using engine braking", "Keeping speed and braking late", "Coasting in neutral downhill", "Planning and easing off in time uses less fuel than braking the speed away late."],
    ti: ["ናብ ትሑት ገደብ ፍጥነት ትቀርብ። መብዛሕቱ ግዜ ነዳዲ እንታይ ይቑጥብ?", "ብግዚኡ ጋዝ ምቕናስን ብሞተር ምብራክን", "ፍጥነት ምሓዝን ደንጉዩ ምብራክን", "ኣብ ቁልቁል ናብ ነጻ ጊር ምእታው", "ቅድመ ውጥን ምግባርን ብግዚኡ ጋዝ ምቕናስን ካብ ደንጉዩ ምብራክ ነዳዲ ይቕንስ።"],
    ar: ["تقترب من حد سرعة أقل. ما الذي يوفّر الوقود عادة؟", "رفع القدم في الوقت واستخدام فرملة المحرك", "إبقاء السرعة والكبح متأخرًا", "الحياد في المنحدر", "التخطيط ورفع القدم في الوقت يستهلك أقل من كبح السرعة متأخرًا."],
  }),
  item("mk-35", 5, 2, 1, {
    sv: ["Motorn går på tomgång länge utan att du kör. Vad stämmer?", "Det är alltid det som drar minst bränsle", "Det värmer alltid katalysatorn bäst", "Onödig tomgång drar bränsle utan att du kommer fram", "Stäng av motorn när du står stilla längre än du behöver. Tomgång förbrukar bränsle utan nytta."],
    en: ["The engine idles for a long time while you are not driving. What is true?", "That always uses the least fuel", "It always warms the catalytic converter best", "Needless idling uses fuel without getting you anywhere", "Switch off when you are stopped longer than you need. Idling burns fuel for no benefit."],
    ti: ["ሞተር ነዊሕ ብዘይ ምዝዋር ይሰርሕ። እንታይ ሓቂ እዩ?", "ኩሉ ግዜ ዝተሓተ ነዳዲ እዩ", "ካታሊስት ኩሉ ግዜ ብዝበለጸ ይውዕዮ", "ዘየድሊ ምስራሕ ነዳዲ ይበልዕ ብዘይ ምብጻሕ", "ካብ እትደሊ ዝያዳ ምስቆምካ ሞተር ኣጥፍእ። ባዶ ምስራሕ ነዳዲ ብዘይ ጥቕሚ ይበልዕ።"],
    ar: ["المحرك يعمل بلا حمل طويلًا وأنت لا تقود. ما الصحيح؟", "ذلك يستهلك دائمًا أقل وقود", "يسخّن المحوّل دائمًا بأفضل صورة", "التشغيل بلا داعٍ يستهلك وقودًا دون أن تتقدم", "أطفئ المحرك إذا توقفت أطول مما يلزم. التشغيل بلا حمل يحرق وقودًا بلا فائدة."],
  }),
  item("mk-36", 5, 1, 2, {
    sv: ["Däcktrycket är för lågt. Vad är en följd?", "Bilen drar alltid mindre bränsle", "Rullmotstånd och förbrukning ökar", "Bromssträckan blir alltid kortare", "För lågt tryck ökar rullmotståndet, drar mer bränsle och försämrar köregenskaperna."],
    en: ["The tyre pressure is too low. What is one result?", "The car always uses less fuel", "Rolling resistance and consumption increase", "The braking distance always gets shorter", "Pressure that is too low raises rolling resistance, uses more fuel and worsens handling."],
    ti: ["ጸቕጢ ጎማ ኣዝዩ ትሑት እዩ። ሓደ ሳዕቤን እንታይ እዩ?", "መኪና ኩሉ ግዜ ነዳዲ ትቕንስ", "ምንቅስቓስን ፍጻመን ይውስኽ", "ናይ ብረክ ርሕቀት ኩሉ ግዜ ይሓጽር", "ትሑት ጸቕጢ ተቓውሞ ይውስኽ፣ ነዳዲ ይውስኽ እሞ ምዝዋር ይጎድእ።"],
    ar: ["ضغط الإطار منخفض جدًا. ما إحدى النتائج؟", "السيارة تستهلك دائمًا وقودًا أقل", "تزداد مقاومة التدحرج والاستهلاك", "مسافة الكبح تقصر دائمًا", "الضغط المنخفض يزيد المقاومة ويستهلك وقودًا أكثر ويُضعف التحكم."],
  }),
  item("mk-37", 5, 0, 1, {
    sv: ["En takbox sitter kvar fast du inte behöver den. Vad stämmer?", "Den ökar luftmotstånd och förbrukning", "Den minskar alltid förbrukningen", "Den påverkar bara ljudet", "En takbox som inte används ökar luftmotståndet. Ta av den när den inte behövs."],
    en: ["A roof box is still fitted although you do not need it. What is true?", "It increases air resistance and consumption", "It always reduces consumption", "It only affects noise", "An unused roof box increases drag. Remove it when you do not need it."],
    ti: ["ሳንዱቕ ኣብ ናሕሲ ኣሎ እሞ ኣየድልየካን። እንታይ ሓቂ እዩ?", "ናይ ኣየር ተቓውሞን ፍጻመን ይውስኽ", "ፍጻመ ኩሉ ግዜ ይቕንስ", "ድምጺ ጥራይ ይጸልዎ", "ዘየድሊ ሳንዱቕ ናሕሲ ተቓውሞ ኣየር ይውስኽ። ኣየድልን ከሎ ኣውጽኦ።"],
    ar: ["صندوق سقف ما زال مركّبًا وأنت لا تحتاجه. ما الصحيح؟", "يزيد مقاومة الهواء والاستهلاك", "يقلل الاستهلاك دائمًا", "يؤثر في الصوت فقط", "صندوق السقف غير المستخدم يزيد المقاومة. انزعه عندما لا تحتاجه."],
  }),
  item("mk-38", 5, 2, 2, {
    sv: ["Du accelererar hårt och bromsar ofta i stadstrafik. Vad blir följden?", "Lägre förbrukning", "Kortare restid utan annan kostnad", "Högre bränsleförbrukning", "Upprepade kraftiga accelerationer och inbromsningar drar mer bränsle än en jämn fart."],
    en: ["You accelerate hard and brake often in city traffic. What is the result?", "Lower consumption", "A shorter trip with no other cost", "Higher fuel consumption", "Repeated hard acceleration and braking uses more fuel than a steady speed."],
    ti: ["ኣብ ከተማ ጥንኩር ትቅልጥፍ እሞ ተደጋጋሚ ትብርክ። ሳዕቤን እንታይ እዩ?", "ትሑት ፍጻመ", "ሓጺር ጉዕዞ ብዘይ ካልእ ወጻኢ", "ልዑል ፍጻመ ነዳዲ", "ተደጋጋሚ ምቅልጣፍን ምብራክን ካብ ቀጻሊ ፍጥነት ነዳዲ ይውስኽ።"],
    ar: ["تسرّع بقوة وتكبح كثيرًا في المدينة. ما النتيجة؟", "استهلاك أقل", "رحلة أقصر بلا كلفة أخرى", "استهلاك وقود أعلى", "التسارع والكبح القوي المتكرر يستهلك وقودًا أكثر من سرعة ثابتة."],
  }),
  item("mk-39", 5, 1, 1, {
    sv: ["Varför ska en motor vara servad?", "Bara för att garantin ska gälla", "En välskött motor drar mindre och släpper ut mindre", "Service påverkar inte utsläpp", "Service håller motorn effektiv, vilket minskar både förbrukning och utsläpp."],
    en: ["Why should an engine be serviced?", "Only so the warranty stays valid", "A maintained engine uses less and emits less", "Service does not affect emissions", "Service keeps the engine efficient, which lowers both consumption and emissions."],
    ti: ["ሞተር ስለምንታይ ክግልገል ኣለዎ?", "ዋህስና ጥራይ ንምቕጻል", "ዝተጠንቀቐ ሞተር ይቕንስን ይንኪ ይቕንስን", "ግልጋሎት ነዳዲ ኣየጸልዎን", "ግልጋሎት ሞተር ብቑዕ ይገብሮ፣ ፍጻመን ነዳድን ይቕንስ።"],
    ar: ["لماذا يجب صيانة المحرك؟", "فقط ليبقى الضمان", "المحرك المُصان يستهلك أقل وينبعث أقل", "الصيانة لا تؤثر في الانبعاث", "الصيانة تُبقي المحرك كفؤًا فينخفض الاستهلاك والانبعاث."],
  }),
  item("mk-40", 5, 0, 3, {
    sv: ["Luftkonditioneringen är på utan att du behöver den. Vad stämmer?", "Den kan öka bränsleförbrukningen", "Den minskar alltid förbrukningen", "Den påverkar bara elbilar", "Luftkonditionering som inte behövs belastar motorn och kan öka förbrukningen."],
    en: ["The air conditioning is on although you do not need it. What is true?", "It can increase fuel consumption", "It always reduces consumption", "It only affects electric cars", "Air conditioning you do not need loads the engine and can increase consumption."],
    ti: ["ኤር ኮንዲሽን ብዘየድሊ ይሰርሕ። እንታይ ሓቂ እዩ?", "ፍጻመ ነዳዲ ክውስኽ ይኽእል", "ፍጻመ ኩሉ ግዜ ይቕንስ", "ናይ ኤሌክትሪክ መካይን ጥራይ ይጸልዎ", "ዘየድሊ ኤር ኮንዲሽን ሞተር ይጽዕን እሞ ፍጻመ ክውስኽ ይኽእል።"],
    ar: ["التكييف يعمل وأنت لا تحتاجه. ما الصحيح؟", "قد يزيد استهلاك الوقود", "يقلل الاستهلاك دائمًا", "يؤثر فقط في السيارات الكهربائية", "التكييف غير اللازم يحمّل المحرك وقد يزيد الاستهلاك."],
  }),
  item("mk-41", 6, 1, 1, {
    sv: ["Du ser en varningsskylt för älg eller annat vilt. Vad gör du?", "Håller farten eftersom skylten bara informerar", "Sänker farten och är beredd att stanna", "Tutar så att djuren håller sig borta", "En viltskylt betyder förhöjd risk. Sänk farten och var beredd att bromsa."],
    en: ["You see a warning sign for moose or other wild animals. What do you do?", "Keep your speed because the sign is only information", "Lower your speed and be ready to stop", "Honk so the animals stay away", "A wildlife sign means a higher risk. Lower your speed and be ready to brake."],
    ti: ["ናይ ኣጋማን ወይ ካልእ ኣራዊት መጠንቀቕታ ትርኢ። እንታይ ትገብር?", "ምልክት ሓበሬታ ጥራይ ስለዝኾነ ፍጥነት ትሕዝ", "ፍጥነት ትቕንስ እሞ ንምቁራጽ ትዳሎ", "እንስሳ ክርሕቕ ትጭዋውዕ", "ምልክት ኣራዊት ዝለዓለ ሓደጋ እዩ። ፍጥነት ቕንስ እሞ ንምብራክ ተዳለ።"],
    ar: ["ترى إشارة تحذير من الموظ أو حيوان بري. ماذا تفعل؟", "تبقي السرعة لأن الإشارة معلومات فقط", "تخفّض السرعة وتستعد للتوقف", "تستخدم البوق لتبتعد الحيوانات", "إشارة الحيوان تعني خطرًا أعلى. خفّض السرعة واستعد للكبح."],
  }),
  item("mk-42", 6, 0, 2, {
    sv: ["När får du köra om?", "När du ser att sträckan är fri och omkörningen kan göras säkert", "Så fort fordonet framför kör långsammare än bashastigheten", "Alltid när vägen har två körfält i din riktning", "Köra om bara när du har fri sikt och kan genomföra omkörningen utan fara."],
    en: ["When may you overtake?", "When you can see the stretch is clear and the overtake can be done safely", "As soon as the vehicle ahead is slower than the default speed", "Always when the road has two lanes in your direction", "Overtake only when you have a clear view and can finish the manoeuvre without danger."],
    ti: ["መዓስ ክትሓልፍ ትኽእል?", "እቲ ቦታ ነጻ ምዃኑን ምሕላፍ ብውሕስና ክፍጸም ከምዝኽእልን ምስትርኢ", "ቅድሚኻ ዘሎ ካብ ባዕላዊ ፍጥነት ዝዀነሰ ምስኸውን ብኡንብኡ", "ኩሉ ግዜ ኣብ ኣንፈትካ ክልተ መንገዲ ምስህሉ", "ንጹር ምርኣይ ምስህልወካን ብዘይ ሓደጋ ክትውድእ ምስትኽእልን ጥራይ ሓልፍ።"],
    ar: ["متى يجوز التجاوز؟", "عندما ترى أن المسافة خالية ويمكن إتمام التجاوز بأمان", "فورًا إذا كانت المركبة أمامك أبطأ من السرعة الأساسية", "دائمًا إذا كان للطريق مساران في اتجاهك", "تجاوز فقط عندما تكون الرؤية واضحة ويمكنك إنهاء التجاوز بلا خطر."],
  }),
  item("mk-43", 6, 2, 1, {
    sv: ["En heldragen mittlinje finns på din sida. Får du köra över den för att köra om?", "Ja, om du hinner tillbaka", "Ja, om du blinkar", "Nej", "En heldragen linje får du inte köra över för att köra om."],
    en: ["There is a solid centre line on your side. May you cross it to overtake?", "Yes, if you can get back in time", "Yes, if you signal", "No", "You may not cross a solid line to overtake."],
    ti: ["ኣብ ጎንኻ ጽኑዕ ማእከላይ መስመር ኣሎ። ንምሕላፍ ክትሰግሮ ትኽእል ዲኻ?", "እወ፣ ብግዚኡ ክትምለስ እንተኸኣልካ", "እወ፣ ምልክት እንተገበርካ", "ኣይፋል", "ንምሕላፍ ጽኑዕ መስመር ክትሰግር ኣይትኽእልን።"],
    ar: ["يوجد خط أوسط متصل في جهتك. هل تعبره للتجاوز؟", "نعم إن عدت في الوقت", "نعم إن استخدمت الإشارة", "لا", "لا يجوز عبور الخط المتصل من أجل التجاوز."],
  }),
  item("mk-44", 6, 0, 3, {
    sv: ["Två fordon möts där hindret finns på din sida. Vem anpassar sig i första hand?", "Du, som har hindret på din sida", "Alltid den som kommer i motbacke", "Den som har nyast bil", "När mötet försvåras av ett hinder på din sida är det du som i första hand ska lämna plats."],
    en: ["Two vehicles meet where the obstacle is on your side. Who adapts first?", "You, because the obstacle is on your side", "Always the driver coming uphill", "The one with the newer car", "When meeting is made difficult by an obstacle on your side, you are the one who should give room first."],
    ti: ["ክልተ ተሽከርከርቲ ይራኸባ እሞ ዕንቅፋት ኣብ ጎንኻ ኣሎ። መን ቀዳማይ ይቕየር?", "ንስኻ፣ ዕንቅፋት ኣብ ጎንኻ ስለዘሎ", "ኩሉ ግዜ እቲ ካብ ታሕቲ ዝደይብ", "እቲ ሓድሽ መኪና ዘለዎ", "ምርኻብ ብዕንቅፋት ኣብ ጎንኻ ምስድንጉይ ንስኻ እዩ ቦታ ቀዳማይ ዝህብ።"],
    ar: ["تلتقي مركبتان والعائق في جهتك. من يتكيّف أولًا؟", "أنت، لأن العائق في جهتك", "دائمًا الصاعد", "صاحب السيارة الأحدث", "إذا صعّب عائق في جهتك التلاقي فأنت من يفسح أولًا."],
  }),
  item("mk-45", 6, 1, 1, {
    sv: ["Rött ljus blinkar vid en järnvägskorsning. Vad gör du?", "Du kör över om du inte ser ett tåg", "Du stannar", "Du sänker farten och passerar om bommen är uppe", "Blinkande rött ljus vid en plankorsning betyder stopp. Kör inte över."],
    en: ["A red light flashes at a railway crossing. What do you do?", "You cross if you cannot see a train", "You stop", "You slow down and pass if the barrier is up", "A flashing red light at a level crossing means stop. Do not cross."],
    ti: ["ቀይሕ መብራህቲ ኣብ መሻገሪ ባቡር ይብልጭ። እንታይ ትገብር?", "ባቡር እንተዘይረኣኻ ትሓልፍ", "ትቆም", "ዕንክብ እንተልዒሉ ፍጥነት ትቕንስ እሞ ትሓልፍ", "ዝብልጭ ቀይሕ መብራህቲ ኣብ መሻገሪ ባቡር ምቁራጽ እዩ። ኣይትሓልፍ።"],
    ar: ["يومض ضوء أحمر عند تقاطع سكة حديد. ماذا تفعل؟", "تعبر إن لم ترَ قطارًا", "تتوقف", "تخفف السرعة وتعبر إن كان الحاجز مرفوعًا", "الضوء الأحمر الوامض عند تقاطع سكة يعني التوقف. لا تعبر."],
  }),
  item("mk-46", 6, 0, 1, {
    sv: ["Bommarna fälls vid järnvägen. Får du köra runt dem om du inte ser ett tåg?", "Nej", "Ja, om du är ensam på vägen", "Ja, om du är gående och leder bilen", "Kör aldrig runt fällda bommar. De är nere för att ett tåg kan komma."],
    en: ["The barriers are coming down at the railway. May you drive around them if you see no train?", "No", "Yes, if you are alone on the road", "Yes, if you walk and lead the car", "Never drive around lowered barriers. They are down because a train may be coming."],
    ti: ["ዕንክብ ባቡር ይወርድ። ባቡር እንተዘይረኣኻ ክትዞሮ ትኽእል ዲኻ?", "ኣይፋል", "እወ፣ ኣብ መንገዲ በይንኻ እንተኾንካ", "እወ፣ ብእግሪ መኪና እንተመሪሕካ", "ዝወረደ ዕንክብ ፈጺምካ ኣይትዞሮ። ባቡር ክመጽእ ስለዝኽእል እዩ ዝወረደ።"],
    ar: ["الحواجز تنخفض عند السكة. هل تدور حولها إن لم ترَ قطارًا؟", "لا", "نعم إن كنت وحدك على الطريق", "نعم إن مشيت وقُدت السيارة", "لا تَدُر أبدًا حول حاجز منخفض. هو منخفض لأن قطارًا قد يأتي."],
  }),
  item("mk-47", 6, 2, 1, {
    sv: ["Du möter ett fordon i mörker och har helljus. Vad gör du?", "Behåller helljuset tills ni möts", "Släcker all belysning", "Bländar av till halvljus", "Blända av till halvljus i god tid så att du inte bländar mötande."],
    en: ["You meet a vehicle in the dark and have high beam on. What do you do?", "Keep the high beam until you meet", "Switch off all lights", "Dip to low beam", "Dip to low beam in good time so you do not dazzle oncoming drivers."],
    ti: ["ኣብ ጸልማት ተሽከርከሪ ትራኸብ እሞ ዓቢ መብራህቲ ኣለካ። እንታይ ትገብር?", "ክሳብ እትራኸብ ዓቢ መብራህቲ ትሕዝ", "ኩሉ መብራህቲ ትጠፍእ", "ናብ ትሑት መብራህቲ ትቕይር", "ንዝመጽእ ከይትደንጽር ብግዚኡ ናብ ትሑት መብራህቲ ቀይር።"],
    ar: ["تقابل مركبة في الظلام والضوء العالي مضاء. ماذا تفعل؟", "تبقي العالي حتى الالتقاء", "تطفئ كل الأضواء", "تخفض إلى الضوء المنخفض", "اخفض إلى الضوء المنخفض في الوقت كي لا تُبهر القادم."],
  }),
  item("mk-48", 6, 1, 3, {
    sv: ["Tät dimma. Vilket ljus använder du?", "Helljus, eftersom det lyser längst", "Dimljus tillsammans med halvljus när sikten är kraftigt nedsatt", "Bara parkeringsljus", "I tät dimma bländar helljus tillbaka. Använd dimljus och halvljus när sikten är kraftigt nedsatt."],
    en: ["Dense fog. Which light do you use?", "High beam, because it reaches furthest", "Fog lights with dipped beam when visibility is severely reduced", "Only parking lights", "In dense fog high beam reflects back. Use fog lights and dipped beam when visibility is severely reduced."],
    ti: ["ጽቡቕ ዕንበባ። እንታይ መብራህቲ ትጥቀም?", "ዓቢ መብራህቲ፣ ርሑቕ ስለዝበርህ", "ዕንበባ መብራህትን ትሑት መብራህትን ምርኣይ ምስጽልመት", "ናይ ፓርኪንግ መብራህቲ ጥራይ", "ኣብ ጽቡቕ ዕንበባ ዓቢ መብራህቲ ይምለስ። ምርኣይ ምስጽልመት ዕንበባ መብራህትን ትሑት መብራህትን ተጠቐም።"],
    ar: ["ضباب كثيف. أي ضوء تستخدم؟", "الضوء العالي لأنه يصل أبعد", "أضواء الضباب مع الضوء المنخفض عندما تنخفض الرؤية بشدة", "أضواء الوقوف فقط", "في الضباب الكثيف يرتد الضوء العالي. استخدم أضواء الضباب والمنخفض عندما تسوء الرؤية بشدة."],
  }),
  item("mk-49", 7, 0, 2, {
    sv: ["Du kör in i ett gångfartsområde. Vad gäller?", "Du kör i gångfart och lämnar företräde åt gående", "Du kör 30 km/h och har företräde", "Gående får bara gå på trottoaren", "I ett gångfartsområde kör du i gångfart. Gående får använda hela ytan och du lämnar dem företräde."],
    en: ["You enter a walking-speed area (gångfartsområde). What applies?", "You drive at walking speed and give way to people on foot", "You drive at 30 km/h and have priority", "People may only walk on the pavement", "In a gångfartsområde you drive at walking speed. People may use the whole area and you give them priority."],
    ti: ["ናብ ቦታ ቅርጻዕ እግሪ ትኣቱ። እንታይ ይሰርሕ?", "ብቅርጻዕ እግሪ ትዝውር እሞ ንእግረኛ ትህብ", "30 km/h ትዝውር እሞ ቅድሚት ኣለካ", "እግረኛ ኣብ መጋረጃ ጥራይ ክኸዱ ይኽእሉ", "ኣብ ጋንግፋርትሶምራዴ ብቅርጻዕ እግሪ ትዝውር። ሰባት ኩሉ ቦታ ክጥቀሙ ይኽእሉ እሞ ትህቦም።"],
    ar: ["تدخل منطقة سرعة المشي. ما الذي يسري؟", "تقود بسرعة المشي وتعطي الأولوية للمشاة", "تقود 30 كم/س ولك الأولوية", "المشاة يسيرون على الرصيف فقط", "في منطقة سرعة المشي تقود بسرعة المشي. للمشاة استخدام المساحة كلها وتعطيهم الأولوية."],
  }),
  item("mk-50", 7, 1, 1, {
    sv: ["En person är på väg ut på ett obevakat övergångsställe. Vad gör du?", "Du håller farten om personen inte är mitt i gatan", "Du sänker farten och stannar så att personen kan gå över", "Du tutar så att personen väntar", "Vid ett obevakat övergångsställe ska du lämna företräde åt den som är på eller just ska gå ut på det."],
    en: ["A person is about to step onto an unsignalised pedestrian crossing. What do you do?", "You keep your speed if the person is not in the middle of the road", "You slow down and stop so the person can cross", "You honk so the person waits", "At an unsignalised crossing you give way to a person who is on it or about to step onto it."],
    ti: ["ሰብ ኣብ ዘይተቖጻጸረ መሻገሪ ክኣቱ ቀሪቡ። እንታይ ትገብር?", "ኣብ ማእከል መንገዲ እንተዘይኮይኑ ፍጥነት ትሕዝ", "ፍጥነት ትቕንስ እሞ ክሓልፍ ትቆም", "ክጽበ ጭውዋዕ ትገብር", "ኣብ ዘይተቖጻጸረ መሻገሪ ንዘሎ ወይ ክኣቱ ዝኸይድ ሰብ ትህቦ።"],
    ar: ["شخص يهمّ بالدخول إلى ممر مشاة غير محكوم بإشارة. ماذا تفعل؟", "تبقي السرعة إن لم يكن في وسط الطريق", "تخفّض السرعة وتتوقف ليتمكن من العبور", "تستخدم البوق لينتظر", "عند ممر غير محكوم بإشارة تعطي الأولوية لمن هو عليه أو يهمّ بدخوله."],
  }),
  item("mk-51", 7, 2, 1, {
    sv: ["En skylt visar 30 km/h utanför en skola. Vad gäller?", "30 km/h bara när barn syns", "50 km/h eftersom det är bashastigheten", "Högst 30 km/h", "Den skyltade gränsen gäller. Utanför en skola är den ofta 30 km/h och den gränsen ska hållas."],
    en: ["A sign shows 30 km/h outside a school. What applies?", "30 km/h only when children are visible", "50 km/h because that is the default", "30 km/h at most", "The signed limit applies. Outside a school it is often 30 km/h and that limit must be kept."],
    ti: ["ኣብ ደገ ቤት ትምህርቲ ምልክት 30 km/h ይርኢ። እንታይ ይሰርሕ?", "30 km/h ህጻናት ምስርአዩ ጥራይ", "50 km/h ምኽንያቱ ባዕላዊ ፍጥነት እዩ", "ዝለዓለ 30 km/h", "እቲ ዝተሓንጸጸ ገደብ እዩ ዝሰርሕ። ኣብ ደገ ቤት ትምህርቲ መብዛሕቱ 30 km/h እዩ እሞ ክትሕዞ ኣለካ።"],
    ar: ["إشارة تُظهر 30 كم/س خارج مدرسة. ما الذي يسري؟", "30 كم/س فقط عندما يظهر أطفال", "50 كم/س لأنها السرعة الأساسية", "30 كم/س كحد أقصى", "الحد المُشار إليه هو الذي يسري. خارج المدرسة كثيرًا ما يكون 30 كم/س ويجب الالتزام به."],
  }),
  item("mk-52", 7, 0, 1, {
    sv: ["Var på vägen ska du normalt köra?", "Så långt till höger som det är säkert", "Mitt i körfältet även när du kan hålla till höger", "Alltid i vänster körfält", "Du ska hålla till höger. Vänster körfält är inte din vanliga plats."],
    en: ["Where on the road should you normally drive?", "As far to the right as is safe", "In the middle even when you can keep right", "Always in the left lane", "Keep to the right. The left lane is not your usual place."],
    ti: ["ኣብ መንገዲ ብንቡር ኣበይ ክትዝውር ኣለካ?", "ብውሕስና ክሳብ እትኽእል ናብ የማን", "ናብ የማን ክትሕዝ እኳ እንተኸኣልካ ኣብ ማእከል", "ኩሉ ግዜ ኣብ የጋች መንገዲ", "ናብ የማን ሕዝ። የጋች መንገዲ ንቡር ቦታኻ ኣይኮነን።"],
    ar: ["أين تقود عادة على الطريق؟", "أقصى اليمين بما هو آمن", "في الوسط حتى لو أمكنك اليمين", "دائمًا في المسار الأيسر", "الزم اليمين. المسار الأيسر ليس مكانك المعتاد."],
  }),
  item("mk-53", 7, 1, 1, {
    sv: ["Du ska svänga. När blinkar du?", "Mitt i svängen", "I god tid innan svängen", "Bara om det finns andra fordon", "Blinka i god tid så att andra hinner förstå vad du tänker göra."],
    en: ["You are going to turn. When do you signal?", "In the middle of the turn", "In good time before the turn", "Only if there are other vehicles", "Signal in good time so others can understand what you intend to do."],
    ti: ["ክትጥምት ኢኻ። መዓስ ትጠቅዕ?", "ኣብ ማእከል ምጥማት", "ቅድሚ ምጥማት ብግዚኡ", "ካልእ ተሽከርከሪ ምስህሉ ጥራይ", "ብግዚኡ ጠቅዕ ካልኦት እንታይ ከምእትገብር ክርድኡ።"],
    ar: ["ستنحرف. متى تستخدم الإشارة؟", "في منتصف الانعطاف", "في الوقت قبل الانعطاف", "فقط إذا وُجدت مركبات أخرى", "استخدم الإشارة في الوقت ليفهم الآخرون ما تنوي فعله."],
  }),
  item("mk-54", 7, 2, 2, {
    sv: ["Du ska lämna en cirkulationsplats. När blinkar du höger?", "När du kör in", "Hela tiden inne i cirkulationen", "När du ska köra ut", "Blinka höger när du ska lämna cirkulationsplatsen, så att andra ser utfarten."],
    en: ["You are leaving a roundabout. When do you signal right?", "When you enter", "The whole time inside the roundabout", "When you are about to exit", "Signal right when you are about to leave, so others see the exit."],
    ti: ["ካብ ዙርያ ክትወጽእ ኢኻ። መዓስ ናብ የማን ትጠቅዕ?", "እንትኣቱ", "ኩሉ ግዜ ኣብ ውሽጢ ዙርያ", "እንትወጽእ", "ክትወጽእ ከለኻ ናብ የማን ጠቅዕ፣ ካልኦት መውጽኢ ክርእዩ።"],
    ar: ["ستغادر الدوار. متى تستخدم إشارة اليمين؟", "عند الدخول", "طوال الوقت داخل الدوار", "عندما تهمّ بالخروج", "استخدم إشارة اليمين عند الخروج ليرى الآخرون المخرج."],
  }),
  item("mk-55", 7, 0, 2, {
    sv: ["Korsningen framför dig är igenkörd. Får du köra in och bli stående?", "Nej, du stannar före korsningen", "Ja, om ljuset är grönt", "Ja, om du blinkar", "Kör inte in i en korsning om du riskerar att bli stående och blockera den."],
    en: ["The junction ahead is blocked. May you enter and end up stopped?", "No, you stop before the junction", "Yes, if the light is green", "Yes, if you signal", "Do not enter a junction if you may be left stopped and blocking it."],
    ti: ["ቅድሚኻ ዘሎ መስቀለኛ መንገዲ ተዓጽዩ። ክትኣቱ እሞ ክትቆም ትኽእል ዲኻ?", "ኣይፋል፣ ቅድሚ መስቀለኛ ትቆም", "እወ፣ መብራህቲ ቀጠልያ እንተኾይኑ", "እወ፣ ምልክት እንተገበርካ", "ክትቆም እሞ መስቀለኛ ከተዕጽዎ እንተኽእልካ ኣይትኣቱ።"],
    ar: ["التقاطع أمامك مزدحم. هل تدخل ثم تقف داخله؟", "لا، تتوقف قبل التقاطع", "نعم إذا كانت الإشارة خضراء", "نعم إذا استخدمت الإشارة", "لا تدخل تقاطعًا إن كنت قد تقف داخله وتسدّه."],
  }),
  item("mk-56", 7, 1, 2, {
    sv: ["Du svänger höger i en korsning. Vad är extra viktigt?", "Att öka farten genom svängen", "Att se efter cyklister och gående som kan vara bredvid dig", "Att hålla dig nära mitten", "I svängen kan en cyklist eller gående finnas i döda vinkeln. Titta innan du svänger."],
    en: ["You turn right at a junction. What is especially important?", "Increasing speed through the turn", "Looking for cyclists and people who may be beside you", "Staying close to the centre", "A cyclist or pedestrian may be in the blind spot. Look before you turn."],
    ti: ["ኣብ መስቀለኛ ናብ የማን ትጥምት። ተወሳኺ ኣገዳሲ እንታይ እዩ?", "ኣብ ምጥማት ፍጥነት ምውሳኽ", "ኣብ ጎንኻ ክህልዉ ዝኽእሉ ብሽክለተኛታትን እግረኛታትን ምርኣይ", "ናብ ማእከል ምቕራብ", "ብሽክለተኛ ወይ እግረኛ ኣብ ዘይርአ ቦታ ክህሉ ይኽእል። ቅድሚ ምጥማት ርአ።"],
    ar: ["تنعطف يمينًا في تقاطع. ما الأهم؟", "زيادة السرعة أثناء الانعطاف", "النظر إلى الدراجين والمشاة الذين قد يكونون بجانبك", "البقاء قرب الوسط", "قد يكون دراج أو ماشٍ في الزاوية العمياء. انظر قبل الانعطاف."],
  }),
  item("mk-57", 8, 1, 1, {
    sv: ["Hur nära före ett övergångsställe får du stanna eller parkera?", "Närmare än 5 meter", "Inte på eller inom 10 meter före övergångsstället", "Precis vid övergångsstället om du blinkar", "Du får inte stanna eller parkera på eller inom 10 meter före ett övergångsställe."],
    en: ["How close before a pedestrian crossing may you stop or park?", "Closer than 5 metres", "Not on it or within 10 metres before it", "Right at the crossing if you signal", "You may not stop or park on a pedestrian crossing or within 10 metres before it."],
    ti: ["ቅድሚ መሻገሪ እግረኛ ክንደይ ቀረባ ክትቆም ወይ ክትፓርክ ትኽእል?", "ካብ 5 ሜትሮ ንላዕሊ ቀረባ", "ኣብኡ ወይ ኣብ ውሽጢ 10 ሜትሮ ቅድሚኡ ኣይትቆምን", "ምልክት እንተገበርካ ብቐጥታ ኣብ መሻገሪ", "ኣብ መሻገሪ እግረኛ ወይ ኣብ ውሽጢ 10 ሜትሮ ቅድሚኡ ክትቆም ወይ ክትፓርክ ኣይትኽእልን።"],
    ar: ["كم تقترب قبل ممر المشاة للتوقف أو الوقوف؟", "أقرب من 5 أمتار", "لا عليه ولا ضمن 10 أمتار قبله", "عنده مباشرة إن استخدمت الإشارة", "لا يجوز التوقف أو الوقوف على ممر المشاة أو ضمن 10 أمتار قبله."],
  }),
  item("mk-58", 8, 0, 1, {
    sv: ["Hur nära en korsning får du parkera?", "Inte i korsningen och inte inom 10 meter från den korsande körbanans närmaste ytterkant", "5 meter räcker", "Du får parkera i korsningen om den är liten", "Du får inte parkera i en vägkorsning eller inom 10 meter från den korsande körbanans närmaste ytterkant."],
    en: ["How close to a junction may you park?", "Not in the junction and not within 10 metres of the nearest edge of the crossing carriageway", "5 metres is enough", "You may park in the junction if it is small", "You may not park in a junction or within 10 metres of the nearest edge of the crossing carriageway."],
    ti: ["ኣብ መስቀለኛ መንገዲ ክንደይ ቀረባ ክትፓርክ ትኽእል?", "ኣብ መስቀለኛ ኣይኮንን እሞ ካብ ቀረባ ወሰን ናይ ዝሰገረ መንገዲ ኣብ ውሽጢ 10 ሜትሮ ኣይኮንን", "5 ሜትሮ የኣኽል", "ንእሽቶ እንተኾይኑ ኣብ መስቀለኛ ክትፓርክ ትኽእል", "ኣብ መስቀለኛ ወይ ካብ ቀረባ ወሰን ናይ ዝሰገረ መንገዲ ኣብ ውሽጢ 10 ሜትሮ ክትፓርክ ኣይትኽእልን።"],
    ar: ["كم تقترب من تقاطع للوقوف؟", "لا في التقاطع ولا ضمن 10 أمتار من أقرب حافة للمسار المتقاطع", "5 أمتار تكفي", "يجوز الوقوف في التقاطع إن كان صغيرًا", "لا يجوز الوقوف في تقاطع أو ضمن 10 أمتار من أقرب حافة للمسار المتقاطع."],
  }),
  item("mk-59", 8, 2, 2, {
    sv: ["Hur nära en plankorsning får du parkera?", "10 meter", "20 meter", "Inte inom 30 meter", "Du får inte parkera på en väg inom 30 meter från en plankorsning."],
    en: ["How close to a level crossing may you park?", "10 metres", "20 metres", "Not within 30 metres", "You may not park on a road within 30 metres of a level crossing."],
    ti: ["ኣብ መሻገሪ ባቡር ክንደይ ቀረባ ክትፓርክ ትኽእል?", "10 ሜትሮ", "20 ሜትሮ", "ኣብ ውሽጢ 30 ሜትሮ ኣይፋልን", "ካብ መሻገሪ ባቡር ኣብ ውሽጢ 30 ሜትሮ ኣብ መንገዲ ክትፓርክ ኣይትኽእልን።"],
    ar: ["كم تقترب من تقاطع سكة للوقوف؟", "10 أمتار", "20 مترًا", "ليس ضمن 30 مترًا", "لا يجوز الوقوف على طريق ضمن 30 مترًا من تقاطع سكة."],
  }),
  item("mk-60", 8, 0, 1, {
    sv: ["Får du parkera på en huvudled?", "Nej", "Ja, om du står kortare än tre minuter", "Ja, på höger sida", "Parkering är förbjuden på en huvudled."],
    en: ["May you park on a priority road (huvudled)?", "No", "Yes, if you stay less than three minutes", "Yes, on the right side", "Parking is forbidden on a huvudled."],
    ti: ["ኣብ ቀንዲ መንገዲ ክትፓርክ ትኽእል ዲኻ?", "ኣይፋል", "እወ፣ ካብ ሰለስተ ደቒቕ ትሕቲ እንተጸንሕካ", "እወ፣ ኣብ የማን ጎኒ", "ኣብ ሁቩድለድ ምፓርኪንግ ክልኩል እዩ።"],
    ar: ["هل تقف على طريق له الأولوية (huvudled)؟", "لا", "نعم إن بقيت أقل من ثلاث دقائق", "نعم على الجانب الأيمن", "الوقوف ممنوع على huvudled."],
  }),
  item("mk-61", 8, 1, 1, {
    sv: ["Får du parkera så att utfarten från en fastighet blockeras?", "Ja, om du lämnar en lapp", "Nej", "Ja, på natten", "Du får inte parkera så att trafik till eller från en fastighet väsentligt försvåras."],
    en: ["May you park so that the exit from a property is blocked?", "Yes, if you leave a note", "No", "Yes, at night", "You may not park so that traffic to or from a property is substantially obstructed."],
    ti: ["ካብ ንብረት ዝወጽእ መንገዲ ከተዓጽዎ ክትፓርክ ትኽእል ዲኻ?", "እወ፣ ወረቐት እንተገደፍካ", "ኣይፋል", "እወ፣ ኣብ ለይቲ", "ናብ ንብረት ወይ ካብ ንብረት ዝኸይድ ትራፊክ ክትዕንቅፎ ኣይትኽእልን።"],
    ar: ["هل تقف بحيث يُسد مخرج عقار؟", "نعم إن تركت ورقة", "لا", "نعم ليلًا", "لا يجوز الوقوف بحيث تُعاق حركة الدخول إلى عقار أو الخروج منه بشكل جوهري."],
  }),
  item("mk-62", 8, 2, 2, {
    sv: ["På vilken sida parkerar du normalt?", "På vänster sida mot färdriktningen", "Mitt i gatan", "På höger sida i färdriktningen", "Du parkerar på höger sida i den riktning du kör, så nära kanten som möjligt."],
    en: ["On which side do you normally park?", "On the left, facing against the direction of travel", "In the middle of the street", "On the right, in the direction of travel", "You park on the right in the direction you are driving, as close to the edge as possible."],
    ti: ["ብንቡር ኣብ ኣየናይ ጎኒ ትፓርክ?", "ኣብ የጋች ኣንጻር ኣንፈት", "ኣብ ማእከል ጎደና", "ኣብ የማን ኣብ ኣንፈት ምዝዋር", "ኣብ የማን ኣብ ኣንፈት እትዝውረሉ ትፓርክ፣ ናብ ወሰን ብዝበለጸ ቀረባ።"],
    ar: ["على أي جانب تقف عادة؟", "على اليسار عكس اتجاه السير", "في وسط الشارع", "على اليمين في اتجاه السير", "تقف على اليمين في اتجاه قيادتك، أقرب ما يمكن إلى الحافة."],
  }),
  item("mk-63", 8, 0, 1, {
    sv: ["Får du stanna på ett övergångsställe?", "Nej", "Ja, för att släppa av en passagerare", "Ja, om du har varningsblinkers", "Du får inte stanna eller parkera på ett övergångsställe."],
    en: ["May you stop on a pedestrian crossing?", "No", "Yes, to let a passenger out", "Yes, if the hazard lights are on", "You may not stop or park on a pedestrian crossing."],
    ti: ["ኣብ መሻገሪ እግረኛ ክትቆም ትኽእል ዲኻ?", "ኣይፋል", "እወ፣ ተሳፋሪ ንምውራድ", "እወ፣ መጠንቀቕታ መብራህቲ እንተበሪህካ", "ኣብ መሻገሪ እግረኛ ክትቆም ወይ ክትፓርክ ኣይትኽእልን።"],
    ar: ["هل تتوقف على ممر المشاة؟", "لا", "نعم لإنزال راكب", "نعم إذا كانت أضواء التحذير مضاءة", "لا يجوز التوقف أو الوقوف على ممر المشاة."],
  }),
  item("mk-64", 8, 1, 3, {
    sv: ["Skylten visar datumparkering. Var parkerar du den 4:e?", "På den udda sidan", "På den jämna sidan", "På båda sidor", "Vid datumparkering parkerar du på jämn sida jämna datum och på udda sida udda datum, under den tid skylten anger."],
    en: ["The sign shows date parking. Where do you park on the 4th?", "On the odd side", "On the even side", "On both sides", "With date parking you use the even side on even dates and the odd side on odd dates, during the hours on the sign."],
    ti: ["ምልክት ናይ ዕለት ፓርኪንግ ይርኢ። ኣብ 4ይ ኣበይ ትፓርክ?", "ኣብ ዘይሙዉቕ ጎኒ", "ኣብ ሙዉቕ ጎኒ", "ኣብ ክልቲኡ ጎኒ", "ኣብ ዕለት ፓርኪንግ ኣብ ሙዉቕ ዕለት ኣብ ሙዉቕ ጎኒ፣ ኣብ ዘይሙዉቕ ዕለት ኣብ ዘይሙዉቕ ጎኒ፣ ኣብቲ ምልክት ዝበሎ ግዜ ትፓርክ።"],
    ar: ["الإشارة تُظهر وقوفًا حسب التاريخ. أين تقف في اليوم 4؟", "في الجانب الفردي", "في الجانب الزوجي", "في الجانبين", "في الوقوف حسب التاريخ تقف في الجانب الزوجي في التواريخ الزوجية والفردي في الفردية، خلال الوقت على الإشارة."],
  }),
  item("mk-65", 9, 0, 1, {
    sv: ["Vad behöver du innan du får övningsköra privat?", "Körkortstillstånd och en godkänd handledare", "Bara ett vanligt ID-kort", "Ett godkänt kunskapsprov", "Privat övningskörning kräver körkortstillstånd och en handledare som uppfyller kraven."],
    en: ["What do you need before private practice driving?", "A learner's permit and an approved supervisor", "Only an ordinary ID card", "A passed theory test", "Private practice requires a learner's permit and a supervisor who meets the rules."],
    ti: ["ቅድሚ ብሕታዊ ልምምድ ምዝዋር እንታይ የድልየካ?", "ፍቓድ መማረኺን ዝተረጋገጸ ተቖጻጻሪን", "ንቡር መለለዪ ጥራይ", "ዝሓለፈ ፈተነ ቲዮሪ", "ብሕታዊ ልምምድ ፍቓድ መማረኽን ነቲ ሕጊ ዝምልእ ተቖጻጻሪን የድሊ።"],
    ar: ["ماذا تحتاج قبل التدريب الخاص على القيادة؟", "تصريح تعلّم ومشرف معتمد", "بطاقة هوية عادية فقط", "اختبار نظري ناجح", "التدريب الخاص يتطلب تصريح تعلّم ومشرفًا يستوفي الشروط."],
  }),
  item("mk-66", 9, 1, 1, {
    sv: ["Vilken skylt ska sitta på bilen vid övningskörning?", "En röd varningstriangel", "En grön skylt med texten ÖVNINGSKÖR", "Ingen skylt om handledaren sitter bredvid", "Vid övningskörning ska skylten ÖVNINGSKÖR vara väl synlig fram och bak."],
    en: ["Which sign must be on the car during practice driving?", "A red warning triangle", "A green sign reading ÖVNINGSKÖR", "No sign if the supervisor sits beside you", "During practice the sign ÖVNINGSKÖR must be clearly visible at the front and rear."],
    ti: ["ኣብ ልምምድ ምዝዋር ኣብ መኪና እንታይ ምልክት ክህሉ ኣለዎ?", "ቀይሕ ስሉስ ኩርናዕ", "ቀጠልያ ምልክት ÖVNINGSKÖR ዝብል", "ተቖጻጻሪ ኣብ ጎንኻ እንተቐሚጡ ምልክት ኣየድልን", "ኣብ ልምምድ ምልክት ÖVNINGSKÖR ኣብ ቅድሚትን ድሕሪትን ንጹር ክረአ ኣለዎ።"],
    ar: ["أي لوحة يجب أن تكون على السيارة أثناء التدريب؟", "مثلث تحذير أحمر", "لوحة خضراء مكتوب عليها ÖVNINGSKÖR", "لا لوحة إذا جلس المشرف بجانبك", "أثناء التدريب يجب أن تكون لوحة ÖVNINGSKÖR ظاهرة من الأمام والخلف."],
  }),
  item("mk-67", 9, 2, 2, {
    sv: ["Vem måste gå handledarutbildningen vid privat övningskörning?", "Bara eleven", "Bara trafikskolan", "Handledaren", "Den som ska vara handledare vid privat övningskörning måste ha gått introduktionsutbildningen."],
    en: ["Who must take the supervisor course for private practice?", "Only the learner", "Only the driving school", "The supervisor", "The person who will supervise private practice must have completed the introduction course."],
    ti: ["ኣብ ብሕታዊ ልምምድ መን ናይ ተቖጻጻሪ ትምህርቲ ክወስድ ኣለዎ?", "ተማሃራይ ጥራይ", "ትራፊክ ትምህርቲ ጥራይ", "ተቖጻጻሪ", "ብሕታዊ ልምምድ ተቖጻጻሪ ክኸውን ዝደሊ ሰብ መእተዊ ትምህርቲ ክወስድ ኣለዎ።"],
    ar: ["من يجب أن يحضر دورة المشرف للتدريب الخاص؟", "المتعلم فقط", "مدرسة القيادة فقط", "المشرف", "من سيكون مشرفًا على التدريب الخاص يجب أن يكون قد أتم دورة المقدمة."],
  }),
  item("mk-68", 9, 0, 2, {
    sv: ["Vad krävs utöver körlektioner innan du får göra körprovet för behörighet B?", "Riskutbildning del 1 och del 2", "Bara ett godkänt kunskapsprov", "En egen bil", "För behörighet B ska riskutbildningens båda delar vara genomförda innan körprovet."],
    en: ["Besides driving lessons, what is required before the category B driving test?", "Risk training part 1 and part 2", "Only a passed theory test", "A car of your own", "For category B both parts of the risk training must be completed before the driving test."],
    ti: ["ቅድሚ ናይ B ፈተነ ምዝዋር፣ ካብ ትምህርቲ ምዝዋር ወጻኢ እንታይ ይድለ?", "ናይ ሓደጋ ስልጠና ክፋል 1ን 2ን", "ዝሓለፈ ፈተነ ቲዮሪ ጥራይ", "ናይ ገዛእ መኪና", "ንB ክልቲኡ ክፋል ናይ ሓደጋ ስልጠና ቅድሚ ፈተነ ምዝዋር ክውዳእ ኣለዎ።"],
    ar: ["إلى جانب دروس القيادة، ما المطلوب قبل اختبار القيادة للفئة B؟", "تدريب المخاطر الجزء 1 والجزء 2", "اختبار نظري ناجح فقط", "سيارة خاصة بك", "للصنف B يجب إتمام جزأي تدريب المخاطر قبل اختبار القيادة."],
  }),
  item("mk-69", 9, 1, 2, {
    sv: ["Hur länge gäller ett godkänt kunskapsprov för behörighet B som du gör från och med 19 augusti 2026?", "4 månader", "12 månader", "2 år", "Ett godkänt kunskapsprov för behörighet B som görs från och med 19 augusti 2026 gäller i 12 månader. Prov före det datumet gällde 4 månader."],
    en: ["How long is a passed category B theory test valid if you take it on or after 19 August 2026?", "4 months", "12 months", "2 years", "A passed category B theory test taken on or after 19 August 2026 is valid for 12 months. Tests before that date were valid for 4 months."],
    ti: ["ካብ 19 ነሓሰ 2026 ጀሚሩ እትገብሮ ዝሓለፈ ናይ B ፈተነ ፍልጠት ክንደይ ይጸንሕ?", "4 ኣዋርሕ", "12 ኣዋርሕ", "2 ዓመት", "ካብ 19 ነሓሰ 2026 ጀሚሩ ዝሓለፈ ናይ B ፈተነ ፍልጠት ን12 ኣዋርሕ ይጸንሕ። ቅድሚኡ ዝተገብረ 4 ኣዋርሕ ይጸንሕ ነይሩ።"],
    ar: ["كم تبقى صلاحية اختبار نظري ناجح للصنف B تجريه من 19 أغسطس 2026؟", "4 أشهر", "12 شهرًا", "سنتان", "اختبار نظري ناجح للصنف B من 19 أغسطس 2026 يسري 12 شهرًا. الاختبارات قبل ذلك التاريخ كانت تسري 4 أشهر."],
  }),
  item("mk-70", 9, 2, 1, {
    sv: ["Måste en bil som används i trafik vara trafikförsäkrad?", "Bara om den är yngre än tio år", "Bara på motorväg", "Ja", "Trafikförsäkring är obligatorisk för ett motordrivet fordon som används i trafik."],
    en: ["Must a car used in traffic have third-party insurance?", "Only if it is less than ten years old", "Only on the motorway", "Yes", "Third-party insurance is compulsory for a motor vehicle used in traffic."],
    ti: ["ኣብ ትራፊክ እትጥቀመላ መኪና ትራፊክ መድሕን ክህልዋ ኣለዋ ድዩ?", "ካብ ዓሰርተ ዓመት ነኣሽቱ እንተኾይነን ጥራይ", "ኣብ ሞተርወይ ጥራይ", "እወ", "ኣብ ትራፊክ ዝጥቀም ሞተር ተሽከርከሪ ትራፊክ መድሕን ግዴታ እዩ።"],
    ar: ["هل يجب أن تكون السيارة المستخدمة في المرور مؤمّنة تأمينًا إلزاميًا؟", "فقط إن كان عمرها أقل من عشر سنوات", "فقط على الطريق السريع", "نعم", "التأمين الإلزامي واجب على المركبة الآلية المستخدمة في المرور."],
  }),
  item("mk-71", 9, 0, 1, {
    sv: ["Var gör du kunskapsprov och körprov för personbil?", "Hos Trafikverket", "På vilken trafikskola som helst", "Hos Polisen", "Kunskapsprov och körprov för körkort bokas och genomförs hos Trafikverket."],
    en: ["Where do you take the theory test and the driving test for a car?", "At Trafikverket", "At any driving school", "At the police", "The theory test and the driving test are booked and taken at Trafikverket."],
    ti: ["ናይ መኪና ፈተነ ፍልጠትን ፈተነ ምዝዋርን ኣበይ ትገብር?", "ኣብ ትራፊክቨርከት", "ኣብ ዝኾነ ትራፊክ ትምህርቲ", "ኣብ ፖሊስ", "ፈተነ ፍልጠትን ፈተነ ምዝዋርን ኣብ ትራፊክቨርከት ይተሓዝን ይፍጸምን።"],
    ar: ["أين تؤدي اختبار المعرفة واختبار القيادة للسيارة؟", "لدى Trafikverket", "في أي مدرسة قيادة", "لدى الشرطة", "يُحجز اختبار المعرفة واختبار القيادة ويُؤدَّيان لدى Trafikverket."],
  }),
  item("mk-72", 9, 1, 2, {
    sv: ["Får du övningsköra ensam på en tom parkering utan körkort eller handledare?", "Ja, om området är avstängt", "Nej", "Ja, om du kör långsammare än 30 km/h", "Övningskörning kräver att kraven är uppfyllda, bland annat körkortstillstånd och godkänd handledare. Att platsen är tom ändrar inte det."],
    en: ["May you practise driving alone in an empty car park without a licence or a supervisor?", "Yes, if the area is closed off", "No", "Yes, if you drive slower than 30 km/h", "Practice driving requires the conditions to be met, including a learner's permit and an approved supervisor. An empty place does not change that."],
    ti: ["ብዘይ ፍቓድ ወይ ተቖጻጻሪ ኣብ ባዶ ፓርኪንግ በይንኻ ክትለማመድ ትኽእል ዲኻ?", "እወ፣ እቲ ቦታ እንተተዓጽዩ", "ኣይፋል", "እወ፣ ካብ 30 km/h ቀስ እንተተዘዊርካ", "ልምምድ ምዝዋር ነቲ ጠለብ ክምልእ ኣለዎ፣ ፍቓድ መማረኽን ዝተረጋገጸ ተቖጻጻሪን ሓዊሱ። ባዶ ቦታ ነዚ ኣየቕንሶን።"],
    ar: ["هل تتدرّب على القيادة وحدك في موقف فارغ بلا رخصة أو مشرف؟", "نعم إذا كانت المنطقة مغلقة", "لا", "نعم إذا قدت أبطأ من 30 كم/س", "التدريب يتطلب استيفاء الشروط، ومنها تصريح التعلّم ومشرف معتمد. المكان الفارغ لا يغيّر ذلك."],
  }),
  ...extraPracticeQuestions,
];
