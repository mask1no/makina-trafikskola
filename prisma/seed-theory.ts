/**
 * Placeholder theory questions pending the client's licensed bank.
 * Written from general Swedish road-rule knowledge. Do not copy from
 * Trafikverket or any commercial question bank (BUILD_SPEC §11.2).
 */
import type { PrismaClient } from "@prisma/client";

const LOCALES = ["sv", "en", "ti", "ar", "so"] as const;
type Locale = (typeof LOCALES)[number];

function L(sv: string, en: string, ti: string, ar: string, so: string): Record<Locale, string> {
  return { sv, en, ti, ar, so };
}

type SeedAnswer = { correct: boolean; text: Record<Locale, string> };
type SeedQuestion = {
  difficulty: 1 | 2 | 3;
  isFree: boolean;
  text: Record<Locale, string>;
  explanation: Record<Locale, string>;
  answers: [SeedAnswer, SeedAnswer, SeedAnswer, SeedAnswer];
};
type SeedCategory = {
  slug: string;
  name: Record<Locale, string>;
  questions: SeedQuestion[];
};

function a(
  correct: boolean,
  sv: string,
  en: string,
  ti: string,
  ar: string,
  so: string,
): SeedAnswer {
  return { correct, text: L(sv, en, ti, ar, so) };
}

function q(
  difficulty: 1 | 2 | 3,
  isFree: boolean,
  text: Record<Locale, string>,
  explanation: Record<Locale, string>,
  answers: [SeedAnswer, SeedAnswer, SeedAnswer, SeedAnswer],
): SeedQuestion {
  return { difficulty, isFree, text, explanation, answers };
}

const CATEGORIES: SeedCategory[] = [
  {
    slug: "vagmarken",
    name: L("Vägmärken", "Road signs", "ናይ መንገዲ ምልክታት", "إشارات الطريق", "Calaamadaha waddada"),
    questions: [
      q(1, true, L("Vad betyder ett rött åttakantigt märke med ordet STOPP?", "What does a red octagonal sign with the word STOP mean?", "ቀይሕ ሾሞንተ ኩርናዕ ዘለዎ ምልክት ምስ ቃል STOPP እንታይ ማለት እዩ?", "ماذا تعني إشارة حمراء ثمانية مع كلمة STOPP؟", "Maxay tahay calaamad cas oo siddeed gees leh oo leh erayga STOPP?"),
        L("Du måste stanna helt och se till att vägen är fri innan du kör vidare.", "You must come to a complete stop and check that the way is clear before you continue.", "ምሉእ ብምሉእ ክትዕጽው ኣለካ እሞ መንገዲ ቕድሚ ምቕጻልካ ንጹር ምዃኑ ክትርኢ ኣለካ።", "يجب أن تتوقف تماماً وتتأكد أن الطريق خالٍ قبل المتابعة.", "Waa inaad gebi ahaan istaagtaa oo aad hubisaa in waddadu ay bannaan tahay ka hor intaadan sii wadnin."),
        [a(true, "Stanna helt, sedan kör när det är fritt.", "Stop fully, then go when it is clear.", "ምሉእ ብምሉእ ዕጸው፣ ድሕሪኡ ምስ ተናጽፈ ቕጽል።", "توقف تماماً ثم سر عندما يكون الطريق خالياً.", "Gebi ahaan istaag, kadib soco marka ay bannaan tahay."), a(false, "Sakta ner om någon kommer.", "Slow down if someone is coming.", "ሓደ ሰብ እንተመጺኡ ፍጥነት ኣጉድል።", "خفّف إن كان أحد قادماً.", "Gaabi haddii qof imanayo."), a(false, "Stanna bara nattetid.", "Stop only at night.", "ጸልማት ጥራይ ዕጸው።", "توقف ليلاً فقط.", "Istaag habeennimo keliya."), a(false, "Kör om du har huvudled.", "Go if you are on a priority road.", "ቀንዲ መንገዲ እንተለካ ቕጽል።", "سر إن كنت على طريق رئيسي.", "Soco haddii aad ku jirto waddada mudnaanta.")]),
      q(1, true, L("Ett nedåtvänt rött-vitt triangelmärke betyder…", "A downward-pointing red-and-white triangle means…", "ንታሕቲ ዝጠውየ ቀይሕ-ጻዕዳ ስሉስ ኩርናዕ ማለት…", "المثلث الأحمر والأبيض المتجه للأسفل يعني…", "Saddex-xagal cas-caddaan oo hoos u jeeda waxay ka dhigan tahay…"),
        L("Du har väjningsplikt och ska släppa fram korsande trafik.", "You have a duty to give way and must let crossing traffic go first.", "ግዴታ ምሃብ መንገዲ ኣለካ እሞ ነቲ ዝሰግር ትራፊክ ክትሓድግ ኣለካ።", "عليك واجب إفساح المجال وترك حركة العبور تمر أولاً.", "Waxaa kaa saaran waajibka u-gudbinta oo waa inaad u ogolaataa taraafikada isgoyska inay horay u dhaafto."),
        [a(true, "Väjningsplikt.", "Give way.", "ግዴታ ምሃብ መንገዲ።", "واجب إفساح المجال.", "Waajibka u-gudbinta."), a(false, "Förbud mot infart.", "No entry.", "ምእታው ክልኩል።", "ممنوع الدخول.", "Gelitaan mamnuuc."), a(false, "Stopplikt.", "Stop obligation.", "ግዴታ ምዕጻው።", "واجب التوقف.", "Waajibka joogsiga."), a(false, "Rekommenderad hastighet.", "Recommended speed.", "ዝምከር ፍጥነት።", "سرعة موصى بها.", "Xawaare la taliyey.")]),
      q(2, false, L("Ett gult ruter-märke i körriktningen betyder vanligtvis…", "A yellow diamond sign in your direction of travel usually means…", "ኣብ ኣንፈት ምዝዋርካ ብጫ ራምቡስ ምልክት መብዛሕቱ…", "العلامة الصفراء المعينية في اتجاه سيرك تعني عادةً…", "Calaamad huruud ah oo dhejis ah oo jihadaada socodka ah waxay caadi ahaan ka dhigan tahay…"),
        L("Du kör på en huvudled. Trafik från sidovägar ska väja.", "You are on a priority road. Traffic from side roads must give way.", "ኣብ ቀንዲ መንገዲ ኢኻ ትዝውር። ትራፊክ ካብ ጎናዊ መንገድታት ክትሓድግ ኣለዎ።", "أنت على طريق رئيسي. يجب أن تتراجع حركة الطرق الجانبية.", "Waxaad ku jirtaa waddada mudnaanta. Taraafikada waddooyinka dhinaca waa inay u gudbiso."),
        [a(true, "Huvudled.", "Priority road.", "ቀንዲ መንገዲ።", "طريق رئيسي.", "Waddada mudnaanta."), a(false, "Varning för halka.", "Warning for slipperiness.", "ናይ ምንሸራተት መጠንቀቕታ።", "تحذير من الانزلاق.", "Digniin simbiriirixasho."), a(false, "Gågata.", "Pedestrian street.", "ናይ እግረኛ መንገዲ።", "شارع للمشاة.", "Waddada dadka lugaynaya."), a(false, "Slut på motorväg.", "End of motorway.", "መወዳእታ ሞተርዌይ።", "نهاية الطريق السريع.", "Dhamaadka waddada weyn.")]),
      q(2, false, L("Ett blått runt märke med en vit pil åt höger betyder…", "A blue circular sign with a white arrow to the right means…", "ሰማያዊ ዙርያ ምልክት ምስ ጻዕዳ ንየማን ፍላጻ ማለት…", "إشارة زرقاء دائرية مع سهم أبيض إلى اليمين تعني…", "Calaamad buluug wareeg ah oo leh fallaadho cad oo midig ah waxay ka dhigan tahay…"),
        L("Påbjuden körriktning: du måste svänga höger.", "Mandatory direction: you must turn right.", "ግዴታዊ ኣንፈት፦ ንየማን ክትጠውይ ኣለካ።", "اتجاه إلزامي: يجب أن تنعطف يميناً.", "Jihada waajibka ah: waa inaad midig u leexataa."),
        [a(true, "Påbjuden högersväng.", "Mandatory right turn.", "ግዴታዊ ናብ የማን ምጥዋይ።", "انعطاف يمين إلزامي.", "Leexasho midig oo waajib ah."), a(false, "Höger fil rekommenderas.", "Right lane is recommended.", "የማናይ መስመር ይምከር።", "يُنصح بالمسار الأيمن.", "Haadka midig ayaa la taliyaa."), a(false, "Infart förbjuden från höger.", "No entry from the right.", "ካብ የማን ምእታው ክልኩል።", "ممنوع الدخول من اليمين.", "Laga soo gelin karo midigta."), a(false, "Parkering till höger.", "Parking to the right.", "ንየማን ምዕጻው።", "ركن إلى اليمين.", "Parking dhanka midig.")]),
      q(3, false, L("Ett rött runt märke utan siffra, bara röd ring, betyder…", "A round red-ringed sign with no number means…", "ቀይሕ ዙርያ ምልክት ቁጽሪ ዘይብሉ፣ ቀይሕ ቀለበት ጥራይ፣ ማለት…", "إشارة دائرية بإطار أحمر بلا رقم تعني…", "Calaamad wareeg cas oo aan lahayn nambar waxay ka dhigan tahay…"),
        L("Förbud mot trafik med fordon, om inte en tilläggstavla säger något annat.", "No vehicle traffic, unless a supplementary plate says otherwise.", "ብመካይን ትራፊክ ክልኩል እዩ፣ ተወሳኺ ሰሌዳ ካልእ እንተዘይበለ።", "ممنوع مرور المركبات ما لم تذكر لوحة إضافية غير ذلك.", "Taraafikada baabuurta waa mamnuuc, haddii calaamad dheeraad ah aysan wax kale sheegin."),
        [a(true, "Förbud mot fordon.", "No vehicles.", "መካይን ክልኩል።", "ممنوع المركبات.", "Baabuur mamnuuc."), a(false, "Cirkulationsplats.", "Roundabout.", "ዙርያ መንገዲ።", "دوّار.", "Wareeg."), a(false, "Minsta hastighet.", "Minimum speed.", "ዝወሓደ ፍጥነት።", "أدنى سرعة.", "Xawaaraha ugu yar."), a(false, "Tvingande stopp för buss.", "Mandatory stop for buses.", "ኣውቶቡስ ግዴታዊ ምዕጻው።", "توقف إلزامي للحافلات.", "Joogsi waajib ah oo bas ah.")]),
      q(2, false, L("Ett grönt märke med motorvägsymbol visar…", "A green sign with a motorway symbol shows…", "ቀጠልያ ምልክት ምስ ምልክት ሞተርዌይ የርኢ…", "إشارة خضراء برمز الطريق السريع تبيّن…", "Calaamad cagaaran oo leh astaan waddada weyn waxay muujinaysaa…"),
        L("Att du närmar dig eller befinner dig på en motorväg.", "That you are approaching or are on a motorway.", "ንሞተርዌይ ከምእትቐርብ ወይ ከምእትርከብ የርኢ።", "أنك تقترب من طريق سريع أو تسير عليه.", "Inaad ku soo dhowaanayso ama aad ku jirto waddada weyn."),
        [a(true, "Motorväg.", "Motorway.", "ሞተርዌይ።", "طريق سريع.", "Waddada weyn."), a(false, "Gångfartsområde.", "Walking-speed zone.", "ናይ እግሪ ፍጥነት ዞባ።", "منطقة بسرعة المشي.", "Aag xawaare lugayn."), a(false, "Tunnlar framför.", "Tunnels ahead.", "ኣብ ቅድሚኻ ዋሕዚ።", "أنفاق أمامك.", "Tunnellooyin horay."), a(false, "Farthinder.", "Speed bump.", "ናይ ፍጥነት ዕንቅፋት።", "مطب سرعة.", "Caqabada xawaaraha.")]),
    ],
  },
  {
    slug: "trafikregler",
    name: L("Trafikregler", "Traffic rules", "ሕግታት ትራፊክ", "قواعد المرور", "Xeerarka taraafikada"),
    questions: [
      q(1, true, L("Vad innebär högerregeln i en korsning utan märken?", "What does the right-hand rule mean at an unsigned junction?", "ኣብ ምልክት ዘይብሉ መራኸቢ መንገዲ ሕጊ የማን እንታይ ማለት እዩ?", "ماذا تعني قاعدة اليمين في تقاطع بلا إشارات؟", "Maxay tahay xeerka midig ee isgoys aan calaamad lahayn?"),
        L("Du ska lämna företräde åt fordon som kommer från höger.", "You must give way to vehicles coming from the right.", "ካብ የማን ዝመጽእ ተሽከርካሪ ክትሓድግ ኣለካ።", "يجب أن تترك الأولوية للمركبات القادمة من اليمين.", "Waa inaad u dhaafiso baabuurta ka imanaya dhanka midig."),
        [a(true, "Fordon från höger går först.", "Vehicles from the right go first.", "ካብ የማን ዝመጽእ ተሽከርካሪ ቕድሚ ይኸይድ።", "المركبات من اليمين تمر أولاً.", "Baabuurta midigta ka imanayaa horay u dhaafaan."), a(false, "Den som kör fortast går först.", "The fastest vehicle goes first.", "ዝቐልጠፈ ተሽከርካሪ ቕድሚ ይኸይድ።", "الأسرع يمر أولاً.", "Kan ugu dheereeyaa horay u dhaafaa."), a(false, "Den som blinkar går först.", "Whoever indicates goes first.", "ዝጠውየ ተሽከርካሪ ቕድሚ ይኸይድ።", "من يشغّل الإشارة يمر أولاً.", "Kan tilmaamayaa horay u dhaafaa."), a(false, "Du har alltid företräde.", "You always have priority.", "ኩሉ ግዜ ቕድሚት ኣለካ።", "لك الأولوية دائماً.", "Adiga ayaa had iyo jeer mudnaanta leh.")]),
      q(1, true, L("När du kör in i en cirkulationsplats ska du…", "When you enter a roundabout you should…", "ኣብ ዙርያ መንገዲ ምስ እትኣቱ ክትገብር ዘለካ…", "عندما تدخل دوّاراً ينبغي أن…", "Markaad gasho wareeg waa inaad…"),
        L("Väja för dem som redan kör i cirkulationen.", "Give way to those already circulating.", "ንኣብ ውሽጢ ዙርያ ዘለዉ ክትሓድግ ኣለካ።", "تفسح المجال لمن يدورون أصلاً.", "U gudbi kuwa horay ugu jira wareegga."),
        [a(true, "Väja för trafiken i rondellen.", "Give way to traffic in the roundabout.", "ንኣብ ራውንድኣባውት ዘሎ ትራፊክ ሓድግ።", "أفسح لمجال الحركة داخل الدوّار.", "U gudbi taraafikada wareegga."), a(false, "Tutahorna och köra in.", "Honk and drive in.", "ፎክ ብምጭራሕ እተ።", "أطلق البوق وادخل.", "Honk samee oo gal."), a(false, "Stanna alltid helt.", "Always stop fully.", "ኩሉ ግዜ ምሉእ ብምሉእ ዕጸው።", "توقف تماماً دائماً.", "Had iyo jeer gebi ahaan istaag."), a(false, "Köra om till vänster i cirkulationen.", "Overtake to the left inside.", "ኣብ ውሽጢ ንጸጋም ሕለፍ።", "تجاوز إلى اليسار داخل الدوّار.", "Dhaaf dhinaca bidix gudaha.")]),
      q(2, false, L("Högsta tillåtna hastighet i tätort om inget annat anges är…", "The default speed limit in a built-up area if nothing else is posted is…", "ኣብ ከተማ ግዝኣት ካልእ እንተዘይተጠቕሰ እቲ ዝለዓለ ፍቑድ ፍጥነት…", "الحد الأقصى للسرعة داخل المدينة إن لم يُذكر غيره هو…", "Xadka xawaaraha ugu sarreeya ee magaalada haddii aan wax kale la dhigin waa…"),
        L("50 km/h om inget annat vägmärke gäller.", "50 km/h unless another sign applies.", "ካልእ ምልክት እንተዘይሃልዩ 50 km/h እዩ።", "50 كم/س ما لم تنطبق إشارة أخرى.", "50 km/h haddii calaamad kale aysan jirin."),
        [a(true, "50 km/h.", "50 km/h.", "50 km/h።", "50 كم/س.", "50 km/h."), a(false, "30 km/h.", "30 km/h.", "30 km/h።", "30 كم/س.", "30 km/h."), a(false, "70 km/h.", "70 km/h.", "70 km/h።", "70 كم/س.", "70 km/h."), a(false, "90 km/h.", "90 km/h.", "90 km/h።", "90 كم/س.", "90 km/h.")]),
      q(2, false, L("Du får som huvudregel köra om…", "As a main rule you may overtake…", "ከም ቀንዲ ሕጊ ክትሕልፍ ትኽእል…", "كقاعدة أساسية يجوز التجاوز…", "Sida xeerka ugu weyn waxaad dhaafi kartaa…"),
        L("Till vänster, när sikten är fri och omkörningen kan göras utan fara.", "To the left, when the view is clear and the manoeuvre is safe.", "ንጸጋም፣ ምርኢት ንጹር ምስ ዝኸውንን ምሕላፍ ብዘይ ሓደጋ ምስ ዝከኣልን።", "إلى اليسار عندما يكون النظر واضحاً والمناورة آمنة.", "Dhanka bidix, marka araggu cad yahay oo dhaafitaanku khatar la'aan yahay."),
        [a(true, "Till vänster när det är säkert.", "To the left when it is safe.", "ንጸጋም ምስ ዝውሕስ።", "إلى اليسار عندما يكون آمناً.", "Dhanka bidix marka ay nabadgelyo tahay."), a(false, "Alltid till höger i tätort.", "Always to the right in town.", "ኣብ ከተማ ኩሉ ግዜ ንየማን።", "دائماً إلى اليمين في المدينة.", "Had iyo jeer midig magaalada."), a(false, "När du tutar två gånger.", "When you honk twice.", "ክልተ ግዜ ምስ ትጭርሕ።", "عندما تطلق البوق مرتين.", "Markaad laba jeer honk samayso."), a(false, "Bara på motorväg.", "Only on a motorway.", "ኣብ ሞተርዌይ ጥራይ።", "على الطريق السريع فقط.", "Waddada weyn keliya.")]),
      q(3, false, L("Ett utryckningsfordon med siren och blåljus kommer bakifrån. Du ska…", "An emergency vehicle with siren and blue lights approaches from behind. You should…", "ድሕሪኻ ሳይረንን ሰማያዊ ብርሃንን ዘለዎ ናይ ህጹጽ ተሽከርካሪ ይመጽእ። ክትገብር ዘለካ…", "مركبة طوارئ بصافرة وأضواء زرقاء تقترب من الخلف. ينبغي أن…", "Gaadhi degdeg ah oo seereno iyo nalal buluug leh ayaa gadaal ka imanaya. Waa inaad…"),
        L("Lämna plats så fort det är säkert, utan att bromsa hårt mitt i körfältet.", "Make room as soon as it is safe, without hard braking in the lane.", "ብዘይ ጽኑዕ ምዕጻው ኣብ መስመር፣ ምስ ዝውሕስ ቦታ ሃብ።", "أفسح مكاناً فور أن يكون ذلك آمناً دون فرملة قوية في المسار.", "Baneey meel sida ugu dhakhsaha badan ee nabadgelyada ah, adigoon biriiko adag ku samayn haadka dhexdiisa."),
        [a(true, "Lämna plats när det är säkert.", "Make room when it is safe.", "ምስ ዝውሕስ ቦታ ሃብ።", "أفسح مكاناً عندما يكون آمناً.", "Baneey meel marka ay nabadgelyo tahay."), a(false, "Stanna mitt i körfältet.", "Stop in the middle of the lane.", "ኣብ ማእከል መስመር ዕጸው።", "توقف وسط المسار.", "Istaag haadka dhexdiisa."), a(false, "Höja farten för att hinna undan.", "Speed up to get away.", "ንምህዳም ፍጥነት ወስኽ።", "زد السرعة للهروب.", "Kordhi xawaaraha si aad uga baxsato."), a(false, "Följa tätt efter utryckningen.", "Follow closely behind.", "ድሕሪኡ ተኸተል።", "اتبع المركبة عن قرب.", "Si dhow uga daba soco.")]),
      q(2, false, L("Du närmar dig ett övergångsställe där fotgängare väntar. Du ska…", "You approach a crossing where pedestrians are waiting. You should…", "እግረኛታት ዝጽበዩሉ ምሕላፍ መንገዲ ትቀርብ። ክትገብር ዘለካ…", "تقترب من ممر مشاة ينتظر عنده مشاة. ينبغي أن…", "Waxaad ku soo dhowaanaysaa isgoys lugaynayaal sugayaan. Waa inaad…"),
        L("Sänka farten och stanna om någon ska gå över.", "Slow down and stop if someone is about to cross.", "ፍጥነት ኣጉድል እሞ ሓደ ክሰግር እንተሃለወ ዕጸው።", "خفّف وتوقف إن كان أحد سيقطع.", "Hoos u dhig xawaaraha oo istaag haddii qof uu gudbayo."),
        [a(true, "Sakta in och släpp över dem.", "Slow down and let them cross.", "ፍጥነት ኣጉድል እሞ ንኽሰግሩ ሓድግ።", "خفّف ودعهم يقطعون.", "Gaabi oo u oggolow inay gudbaan."), a(false, "Tutahorna så de väntar.", "Honk so they wait.", "ፎክ ጭረሕ ምእንቲ ክጽበዩ።", "أطلق البوق حتى ينتظروا.", "Honk samee si ay u sugaan."), a(false, "Hålla farten om ljuset är grönt för dig.", "Keep speed if your light is green.", "ናትካ ብርሃን ቀጠልያ እንተኾይኑ ፍጥነት ሓዝ።", "حافظ على السرعة إن كان ضوؤك أخضر.", "Sii wad xawaaraha haddii nalkaagu cagaaran yahay."), a(false, "Köra om bilar som stannat.", "Overtake cars that have stopped.", "ዝዓጸዉ መካይን ሕለፍ።", "تجاوز السيارات المتوقفة.", "Dhaaf baabuurta istaagay.")]),
    ],
  },
  {
    slug: "fordonskannedom",
    name: L("Fordonskännedom", "Vehicle knowledge", "ፍልጠት ተሽከርካሪ", "معرفة المركبة", "Aqoonta gaadhiga"),
    questions: [
      q(1, true, L("Minsta mönsterdjup på sommaräck i Sverige är…", "The minimum tread depth on summer tyres in Sweden is…", "ኣብ ሽወደን ናይ ክረምቲ ጎማታት ዝወሓደ ዕምቈት ስእሊ…", "أقل عمق نقش لإطارات الصيف في السويد هو…", "Qoto dheerida ugu yar ee taayirrada xagaaga ee Iswiidhan waa…"),
        L("1,6 mm. Mindre än så ger sämre grepp, särskilt på våt väg.", "1.6 mm. Less than that gives worse grip, especially on wet roads.", "1,6 mm። ካብኡ ዝወሓደ፣ ብፍላይ ኣብ ረጥቢ መንገዲ፣ ድኹም ምትሕዝዝ የምጽእ።", "1.6 مم. أقل من ذلك يضعف التماسك خصوصاً على الطريق المبلل.", "1.6 mm. Ka yar taas waxay siisaa qabasho liidata, gaar ahaan waddo qoyan."),
        [a(true, "1,6 mm.", "1.6 mm.", "1,6 mm።", "1.6 مم.", "1.6 mm."), a(false, "0,5 mm.", "0.5 mm.", "0,5 mm።", "0.5 مم.", "0.5 mm."), a(false, "4 mm.", "4 mm.", "4 mm።", "4 مم.", "4 mm."), a(false, "8 mm.", "8 mm.", "8 mm።", "8 مم.", "8 mm.")]),
      q(1, true, L("När ska du använda halvljus dagtid?", "When should you use dipped headlights in daytime?", "መዓልቲ መኣዝ ቕጽበታዊ ብርሃን ክትጥቀም?", "متى تستخدم الضوء الخافت نهاراً؟", "Goorma ayaad isticmaashaa iftiinka hoose maalintii?"),
        L("Alltid när du kör. Halvljus eller varselljus ska vara tänt.", "Whenever you drive. Dipped or daytime running lights must be on.", "ኩሉ ግዜ ምስ እትዝውር። ቕጽበታዊ ወይ ናይ መዓልቲ ብርሃን ክበርህ ኣለዎ።", "كلما قدت. يجب أن يكون الضوء الخافت أو ضوء النهار مشتعلًا.", "Mar kasta oo aad waddo. Iftiinka hoose ama iftiinka maalinta waa inuu shidan yahay."),
        [a(true, "Alltid under körning.", "Whenever you are driving.", "ኩሉ ግዜ ኣብ ምዝዋር።", "دائماً أثناء القيادة.", "Mar kasta oo aad waddo."), a(false, "Bara i dimma.", "Only in fog.", "ኣብ ጉዕ ንፋስ ጥራይ።", "في الضباب فقط.", "Ceeryaamo keliya."), a(false, "Bara i tunnlar.", "Only in tunnels.", "ኣብ ዋሕዚ ጥራይ።", "في الأنفاق فقط.", "Tunnellooyin keliya."), a(false, "Aldrig dagtid.", "Never in daytime.", "መዓልቲ ፈጺምካ።", "أبداً نهاراً.", "Marnaba maalintii.")]),
      q(2, false, L("ABS-bromsar hjälper främst till att…", "ABS brakes mainly help you to…", "ABS ምዕጻው ቀንዲ ሓገዝኡ…", "فرامل ABS تساعدك أساساً على…", "Biriikada ABS waxay ugu horrayn kaa caawisaa…"),
        L("Styra medan du bromsar hårt, eftersom hjulen inte låser sig.", "Steer while braking hard, because the wheels do not lock.", "ኣብ ጽኑዕ ምዕጻው ከለኻ ክትመርሕ፣ ጎማታት ስለዘይተዓጽዉ።", "التوجيه أثناء الفرملة القوية لأن العجلات لا تُقفل.", "Inaad isteeriso adigoo biriiko adag samaynaya, maxaa yeelay taayirradu ma xirmaan."),
        [a(true, "Styra under hård inbromsning.", "Steer during hard braking.", "ኣብ ጽኑዕ ምዕጻው ምምራሕ።", "التوجيه أثناء فرملة قوية.", "Isteerinta biriiko adag."), a(false, "Korta bromssträckan på is alltid.", "Always shorten stopping distance on ice.", "ኣብ በረድ ኩሉ ግዜ መስመር ምዕጻው የሕጽር።", "تقصّر مسافة التوقف على الجليد دائماً.", "Had iyo jeer soo gaabi fogaanta joogsiga barafka."), a(false, "Byta växel automatiskt.", "Change gear automatically.", "ማርሻ ብባዕሉ ይቕይር።", "تغيّر السرعة تلقائياً.", "Si otomaatik ah u beddeshaa gear-ka."), a(false, "Tända varningsblinkers.", "Turn on hazard lights.", "ናይ መጠንቀቕታ ብርሃን የብርህ።", "تشغّل أضواء التحذير.", "Shiddaa nalalka digniinta.")]),
      q(2, false, L("Ett rött oljelampor i instrumenteringen betyder oftast…", "A red oil warning light on the dashboard usually means…", "ቀይሕ ናይ ዘይቲ መጠንቀቕታ ብርሃን ኣብ ሰሌዳ መብዛሕቱ ማለት…", "ضوء زيت أحمر في لوحة القيادة يعني عادةً…", "Nal casaanka saliidda ee dashboard-ka wuxuu caadi ahaan ka dhigan yahay…"),
        L("Oljetrycket är för lågt. Stanna så snart det är säkert och stäng av motorn.", "Oil pressure is too low. Stop as soon as it is safe and switch the engine off.", "ጸቕጢ ዘይቲ ትሑት እዩ። ምስ ዝውሕስ ዕጸው እሞ ሞተር ምፍታሕ።", "ضغط الزيت منخفض جداً. توقف فور أن يكون آمناً وأطفئ المحرك.", "Cadaadiska saliiddu aad buu u hooseeyaa. Istaag sida ugu dhakhsaha badan ee nabadgelyada ah oo dami matoorka."),
        [a(true, "Stanna och stäng av motorn.", "Stop and switch the engine off.", "ዕጸው እሞ ሞተር ምፍታሕ።", "توقف وأطفئ المحرك.", "Istaag oo dami matoorka."), a(false, "Du behöver bara spolarvätska.", "You only need washer fluid.", "ማይ ምጽረግ ጥራይ የድሊ።", "تحتاج سائل المساحات فقط.", "Waxaad u baahan tahay dareeraha muraayadda keliya."), a(false, "Däcktrycket är högt.", "Tyre pressure is high.", "ጸቕጢ ጎማ ልዑል እዩ።", "ضغط الإطار مرتفع.", "Cadaadiska taayirku sarreeyaa."), a(false, "Batteriet laddas extra.", "The battery is charging extra.", "ባትሪ ተወሳኺ ይሕረድ።", "البطارية تشحن زيادة.", "Batterigu wuu sii dallacayaa.")]),
      q(3, false, L("Hur ska du sitta bakom ratten?", "How should you sit behind the wheel?", "ድሕሪ መሪሕ መንእሰይ ከመይ ጌርካ ክትቕመጥ?", "كيف تجلس خلف المقود؟", "Sidee baad u fadhiisanaysaa isteerinka gadaashiisa?"),
        L("Så att du når pedaler och ratt med böjda armar och kan se speglarna.", "So you reach pedals and wheel with slightly bent arms and can see the mirrors.", "ፔዳላትን መሪሕ መንእሰይን ብዝተጠውየ ኢድ ከተበጽሕ እሞ መስትያት ክትርኢ።", "بحيث تصل إلى الدواسات والمقود بذراعين مثنيتين قليلاً وترى المرايا.", "Si aad ugu gaarto badhamada iyo isteerinka gacmo waxyar foorarsan oo aad muraayadaha aragto."),
        [a(true, "Nå pedaler och ratt med böjda armar.", "Reach pedals and wheel with bent arms.", "ፔዳላትን መሪሕ መንእሰይን ብዝተጠውየ ኢድ ኣብጽሕ።", "صل إلى الدواسات والمقود بذراعين مثنيتين.", "Gaar badhamada iyo isteerinka gacmo foorarsan."), a(false, "Så nära att bröstet nuddar ratten.", "So close that your chest touches the wheel.", "እንሶምካ መሪሕ መንእሰይ ክትንክፍ።", "قريباً حتى يلمس الصدر المقود.", "Si u dhow oo laabtaadu isteerinka taabato."), a(false, "Med stolen längst bak alltid.", "With the seat always fully back.", "መንበር ኩሉ ግዜ ኣብ ዝረሓቐ።", "المقعد دائماً في أقصى الخلف.", "Kursiga had iyo jeer ugu danbeeya."), a(false, "Utan nackstöd för bättre sikt.", "Without a headrest for better view.", "ንዝበለጸ ምርኢት ብዘይ መደጎሚ ክሳድ።", "بلا مسند رأس لرؤية أفضل.", "Iyada oo madax-taageero la'aan si araggu u fiicnaado.")]),
      q(2, false, L("Varför ska däcken ha rätt lufttryck?", "Why should tyres have the correct air pressure?", "ጎማታት ቅኑዕ ኣየር ጸቕጢ ክህልዎም ስለምንታይ?", "لماذا يجب أن يكون ضغط الهواء في الإطارات صحيحاً؟", "Maxay taayirradu u baahan yihiin cadaadis hawo sax ah?"),
        L("Rätt tryck ger grepp, kortare bromssträcka och lägre bränsleförbrukning.", "Correct pressure gives grip, shorter stopping distance and lower fuel use.", "ቅኑዕ ጸቕጢ ምትሕዝዝ፣ ሓጺር መስመር ምዕጻውን ዝወሓደ ነዳዲን የምጽእ።", "الضغط الصحيح يعطي تماسكاً ومسافة توقف أقصر واستهلاكاً أقل للوقود.", "Cadaadiska saxda ah wuxuu siiyaa qabasho, fogaanta joogsiga oo gaaban iyo shidaal yar."),
        [a(true, "Bättre grepp och lägre förbrukning.", "Better grip and lower consumption.", "ዝበለጸ ምትሕዝዝን ዝወሓደ ምጥቃም ነዳዲን።", "تماسك أفضل واستهلاك أقل.", "Qabasho wanaagsan iyo isticmaal hoose."), a(false, "Bilen går tystare bara i stad.", "The car is quieter only in town.", "ኣብ ከተማ ጥራይ መኪና ህዱእት ትኸውን።", "السيارة أهدى في المدينة فقط.", "Gaadhigu waa aamusan magaalada keliya."), a(false, "ABS slutar då fungera.", "ABS then stops working.", "ABS ስዒቡ ኣይሰርሕን።", "يتوقف ABS عن العمل.", "ABS markaas wuu shaqayn waayaa."), a(false, "Du får köra fortare lagligt.", "You may then drive faster legally.", "ሕጋዊ ብዝያዳ ፍጥነት ክትዝውር ትኽእል።", "يجوز عندها القيادة أسرع قانوناً.", "Markaas waxaad si sharci ah ugu wadi kartaa si ka dhaqso badan.")]),
    ],
  },
  {
    slug: "miljo",
    name: L("Miljö", "Environment", "ኣከባቢ", "البيئة", "Deegaanka"),
    questions: [
      q(1, true, L("Vad är ett enkelt sätt att köra mer bränslesnålt?", "What is a simple way to drive using less fuel?", "ነዳዲ ንምቑጣብ ቀሊል መንገዲ እንታይ እዩ?", "ما طريقة بسيطة للقيادة باستهلاك أقل؟", "Waa maxay hab fudud oo lagu wado shidaal yar?"),
        L("Titta långt fram, släpp gasen i tid och använd motorbroms.", "Look far ahead, ease off the accelerator early and use engine braking.", "ንቅድሚት ርኣይ፣ ጋዝ ኣብ ግዜ ሕደግ እሞ ምዕጻው ሞተር ተጠቐም።", "انظر بعيداً، ارفع القدم عن الدواسة مبكراً واستعمل فرملة المحرك.", "Fog hore eeg, gaaska goor hore ka qaad oo isticmaal biriikada matoorka."),
        [a(true, "Planera och motorbromsa.", "Plan and engine-brake.", "ውጥን ግበር እሞ ሞተር ኣዕጽው።", "خطّط واستعمل فرملة المحرك.", "Qorshee oo matoorka ku biriikee."), a(false, "Hålla högvarv i stan.", "Keep high revs in town.", "ኣብ ከተማ ልዑል ምዝዋር ሞተር ሓዝ።", "أبقِ دورات عالية في المدينة.", "Ku hay wareegyo sare magaalada."), a(false, "Köra med halvljuset av.", "Drive with dipped lights off.", "ቕጽበታዊ ብርሃን ዘይበርሀ ቕጽል።", "قد بدون الضوء الخافت.", "Ku wad iftiinka hoose damacsanaan."), a(false, "Ha extra last på taket alltid.", "Always carry extra roof load.", "ኩሉ ግዜ ኣብ ናሕሲ ተወሳኺ ጽዕነት ሸኽን።", "احمل دائماً حملاً إضافياً على السقف.", "Had iyo jeer saami dheeraad ah saar saqafka.")]),
      q(1, true, L("Varför ska du inte låta motorn gå på tomgång i onödan?", "Why should you not leave the engine idling without need?", "ስለምንታይ ሞተር ብዘይ ድሌት ከይሰርሕ ክትገድፎ የብልካን?", "لماذا لا تترك المحرك يعمل بلا داع؟", "Maxaad ugu dayn weydaa matoorka inuu shaqeeyo si aan loo baahnayn?"),
        L("Tomgång släpper ut avgaser och slösar bränsle utan att du kommer någonstans.", "Idling emits exhaust and wastes fuel without moving you.", "ሞተር ከይተዘዋወረ ጭስ የውጽእ እሞ ነዳዲ የባኽን።", "التشغيل دون حركة يطلق عوادم ويضيع وقوداً دون أن تتقدم.", "Shaqada fadhi ayaa qiiq sii daysa oo shidaal lumisa adigoon dhaqaaqin."),
        [a(true, "Onödiga utsläpp och slöseri.", "Needless emissions and waste.", "ዘይድለ ጭስን ምባኽን።", "انبعاثات وإهدار بلا داع.", "Qiiq iyo lumis aan loo baahnayn."), a(false, "ABS slutar fungera.", "ABS stops working.", "ABS ምስርሑ ይቋረጽ።", "يتوقف ABS.", "ABS wuu istaagaa."), a(false, "Däcken slits bara då.", "Tyres only wear then.", "ጎማታት ሽዑ ጥራይ ይበልዩ።", "الإطارات تتآكل عندها فقط.", "Taayirradu markaas keliya ayay xidhmaan."), a(false, "Batteriet tar slut direkt.", "The battery dies at once.", "ባትሪ ብኡንብኡ ይውዳእ።", "البطارية تفرغ فوراً.", "Batterigu isla markiiba wuu dhamaadaa.")]),
      q(2, false, L("Högt däcktryck inom tillåtet intervall kan…", "Higher tyre pressure within the allowed range can…", "ኣብ ፍቑድ ገደብ ልዑል ጸቕጢ ጎማ ክገብር ዝኽእል…", "ضغط إطار أعلى ضمن المدى المسموح يمكن أن…", "Cadaadis taayir oo sarreeya gudaha xadka la oggol yahay wuxuu…"),
        L("Minska rullmotståndet och därmed bränsleförbrukningen.", "Reduce rolling resistance and therefore fuel use.", "ምንቅስቓስ ተቓውሞ የንእስ እሞ ነዳዲ የቕንስ።", "يقلّل مقاومة التدحرج وبالتالي استهلاك الوقود.", "Yareeyaa iska caabbinta duubista sidaasna shidaalka."),
        [a(true, "Sänka förbrukningen något.", "Lower consumption a little.", "ምጥቃም ነዳዲ ቁሩብ የንእስ።", "يخفض الاستهلاك قليلاً.", "Yareeyaa isticmaalka in yar."), a(false, "Öka buller lagligt över gränsen.", "Legally increase noise above the limit.", "ድምጺ ልዕሊ ገደብ ሕጋዊ የውስኽ።", "يزيد الضجيج فوق الحد قانوناً.", "Si sharci ah u kordhiyaa buuqa xadka ka sarreeya."), a(false, "Stänga av krockkudden.", "Switch the airbag off.", "ናይ ሓደጋ ኩዕሶ የጥፍእ።", "يطفئ الوسادة الهوائية.", "Damiyaa barkinta hawada."), a(false, "Ta bort krav på vinterdäck.", "Remove the winter-tyre rule.", "ናይ ክረምቲ ጎማ ግዴታ የእልይ።", "يلغي شرط إطارات الشتاء.", "Ka saaraa xeerka taayirrada jiilaalka.")]),
      q(2, false, L("Katalysatorn i avgasystemet…", "The catalytic converter in the exhaust system…", "ኣብ ስርዓተ ጭስ ዘሎ ካታሊዘር…", "المحول الحفاز في منظومة العادم…", "Beddelaha catalytic ee nidaamka qiiqa…"),
        L("Minskar skadliga ämnen i avgaserna när motorn är varm.", "Reduces harmful substances in the exhaust when the engine is warm.", "ሞተር ምስ ዝውዕይ ጎዳእቲ ንጥረ ነገራት ኣብ ጭስ የንእስ።", "يقلّل المواد الضارة في العادم عندما يسخن المحرك.", "Wuxuu yareeyaa walxaha waxyeellada leh ee qiiqa marka matoorku diiranaado."),
        [a(true, "Rensar avgaserna när den är varm.", "Cleans exhaust when warm.", "ምስ ዝውዕይ ጭስ የጽርይ።", "ينظّف العادم عندما يسخن.", "Nadiifiyaa qiiqa marka uu diiranaado."), a(false, "Ökar motoreffekten i kyla.", "Increases engine power in cold.", "ኣብ ቑሪ ሓይሊ ሞተር የውስኽ።", "يزيد قدرة المحرك في البرد.", "Kordhiyaa awoodda matoorka qabowga."), a(false, "Ersätter ljuddämparen.", "Replaces the silencer.", "ናይ ድምጺ መቕንኣይ ይትክእ።", "يستبدل كاتم الصوت.", "Beddelaa aamusiyaha."), a(false, "Tar bort behovet av bensin.", "Removes the need for petrol.", "ድሌት በንዚን የእልይ።", "يلغي الحاجة إلى البنزين.", "Ka saaraa baahida shidaalka.")]),
      q(3, false, L("Att samåka eller välja kollektivtrafik när det går…", "Car-sharing or using public transport when you can…", "ምስ ካልኦት ምዝዋር ወይ ኣብ ዝከኣለ ሕቡራዊ መጓዓዝያ ምምራጽ…", "مشاركة السيارة أو اختيار النقل العام عندما يمكن…", "Wadashaqeynta baabuurka ama doorashada gaadiidka dadweynaha marka ay suurtogal tahay…"),
        L("Minskar antalet bilar och därmed utsläpp per person.", "Cuts the number of cars and therefore emissions per person.", "ብዝሒ መካይን የንእስ እሞ ጭስ ንነፍሲ ወከፍ ሰብ የቕንስ።", "يقلّل عدد السيارات وبالتالي الانبعاثات لكل شخص.", "Yareeyaa tirada baabuurta sidaasna qiiqa qofkiiba."),
        [a(true, "Färre bilar, lägre utsläpp per person.", "Fewer cars, lower emissions per person.", "ውሑዳት መካይን፣ ዝወሓደ ጭስ ንነፍሲ ወከፍ።", "سيارات أقل وانبعاثات أقل لكل شخص.", "Baabuur yar, qiiq hoose qofkiiba."), a(false, "Är förbjudet i rusning.", "Is forbidden in rush hour.", "ኣብ ዝተጸናናዐ ግዜ ክልኩል እዩ።", "ممنوع في ساعة الذروة.", "Waa mamnuuc saacadaha ciribtirka."), a(false, "Kräver extra körkort.", "Needs an extra licence.", "ተወሳኺ ፍቓድ የድሊ።", "يتطلب رخصة إضافية.", "Wuxuu u baahan yahay laysan dheeraad ah."), a(false, "Ökar alltid restiden lagligt.", "Always legally increases travel time.", "ኩሉ ግዜ ሕጋዊ ግዜ ጉዕዞ የውስኽ።", "يزيد زمن الرحلة قانوناً دائماً.", "Had iyo jeer si sharci ah u kordhiyaa wakhtiga safarka.")]),
      q(2, false, L("Onödigt hög hastighet påverkar miljön genom att…", "Unnecessarily high speed affects the environment by…", "ዘይድለ ልዑል ፍጥነት ንኣከባቢ ብኸመይ ይጸልዎ…", "السرعة العالية بلا داع تؤثر في البيئة عبر…", "Xawaare sare oo aan loo baahnayn wuxuu deegaanka u saameeyaa iyadoo…"),
        L("Luftmotståndet stiger snabbt och du gör av med mer bränsle.", "Air resistance rises quickly and you use more fuel.", "ተቓውሞ ኣየር ብቕልጡፍ ይውስኽ እሞ ዝያዳ ነዳዲ ትጥቀም።", "مقاومة الهواء ترتفع بسرعة فتصرف وقوداً أكثر.", "Iska caabbinta hawadu si degdeg ah ayay u kacdaa oo shidaal badan ayaad isticmaashaa."),
        [a(true, "Högre luftmotstånd och mer bränsle.", "Higher air resistance and more fuel.", "ዝለዓለ ተቓውሞ ኣየርን ዝያዳ ነዳዲን።", "مقاومة هواء أعلى ووقود أكثر.", "Iska caabbinta hawo sare iyo shidaal badan."), a(false, "Däcken blir tjockare.", "Tyres become thicker.", "ጎማታት ይሓጽኑ።", "الإطارات تصبح أسمك.", "Taayirradu way dhumuc weynaadaan."), a(false, "Katalysatorn stängs av.", "The catalytic converter switches off.", "ካታሊዘር ይጠፍእ።", "ينطفئ المحول الحفاز.", "Beddelaha catalytic wuu damaan."), a(false, "Växellådan låses i ettan.", "The gearbox locks in first gear.", "ሳንዱቕ ማርሻ ኣብ ቀዳማይ ይተዓጽው።", "تُقفل العلبة على السرعة الأولى.", "Sanduuqa gears-ku wuxuu ku xirmaa kan koowaad.")]),
    ],
  },
  {
    slug: "manniskan-i-trafiken",
    name: L("Människan i trafiken", "The human in traffic", "ሰብ ኣብ ትራፊክ", "الإنسان في المرور", "Qofka taraafikada dhexdeeda"),
    questions: [
      q(1, true, L("Alkohol i blodet gör att du…", "Alcohol in the blood makes you…", "ኣልኮል ኣብ ደም የገብረካ…", "الكحول في الدم يجعلك…", "Khamriga dhiigga ku jira wuxuu kaa dhigaa…"),
        L("Reagerar långsammare och bedömer avstånd sämre, även vid låg halt.", "React more slowly and judge distance worse, even at a low level.", "ዝሓሸ ግዜ ትምልስ እሞ ርሕቀት ትገምግም፣ ብውሑድ መጠን እውን።", "تتفاعل أبطأ وتقدّر المسافة بأسوأ حتى عند نسبة منخفضة.", "Si ka gaabis ah u falcelisaa oo fogaanta si liidata u qiimeysaa, xitaa heer hoose."),
        [a(true, "Reagerar långsammare.", "React more slowly.", "ዝሓሸ ትምልስ።", "تتفاعل أبطأ.", "Si gaabis ah u falcelisaa."), a(false, "Ser skarpare i mörker.", "See sharper in the dark.", "ኣብ ጸልማት ዝበለጸ ትርኢ።", "ترى أوضح في الظلام.", "Habeenkii si cad u aragtaa."), a(false, "Får kortare bromssträcka.", "Get a shorter stopping distance.", "ሓጺር መስመር ምዕጻው ትረክብ።", "تحصل على مسافة توقف أقصر.", "Waxaad helaysaa fogaanta joogsiga oo gaaban."), a(false, "Blir immun mot trötthet.", "Become immune to fatigue.", "ካብ ድኻም ዕቁብ ትኸውን።", "تصبح محصناً ضد التعب.", "Waxaad noqotaa mid daal u adkaysata.")]),
      q(1, true, L("Trötthet bakom ratten är farligt för att du…", "Fatigue behind the wheel is dangerous because you…", "ድሕሪ መሪሕ መንእሰይ ድኻም ሓደገኛ እዩ ምኽንያቱ…", "الإرهاق خلف المقود خطر لأنك…", "Daalka isteerinka gadaashiisa waa khatar maxaa yeelay adigu…"),
        L("Kan somna för en sekund utan att märka det, mikrosömn.", "Can fall asleep for a second without noticing, microsleep.", "ንሓንቲ ካልኢት ከይተሰማዕካ ክትድቅስ ትኽእል፣ ንእሽቶ ድቃስ።", "قد تغفو ثانية دون أن تشعر، وهو النوم المصغّر.", "Waxaad seexan kartaa ilbiriqsi adigoon dareemin, hurdo yar."),
        [a(true, "Kan somna utan att märka det.", "Can fall asleep without noticing.", "ከይተሰማዕካ ክትድቅስ ትኽእል።", "قد تغفو دون أن تشعر.", "Waad seexan kartaa adigoon dareemin."), a(false, "Får bättre nattseende.", "Get better night vision.", "ዝበለጸ ናይ ለይቲ ራእይ ትረክብ።", "تحصل على رؤية ليلية أفضل.", "Waxaad helaysaa aragga habeenka oo wanaagsan."), a(false, "Reagerar snabbare.", "React faster.", "ቀልጢፍካ ትምልስ።", "تتفاعل أسرع.", "Si degdeg ah ayaad u falcelisaa."), a(false, "Behöver mindre avstånd.", "Need less distance.", "ዝወሓደ ርሕቀት የድልየካ።", "تحتاج مسافة أقل.", "Waxaad u baahan tahay fogaanta ka yar.")]),
      q(2, false, L("Att använda mobilen i handen medan du kör…", "Using a handheld phone while driving…", "ኣብ ምዝዋር ከለኻ ሞባይል ብኢድ ምጥቃም…", "استعمال الهاتف باليد أثناء القيادة…", "Isticmaalka telefoonka gacanta adigoo wada…"),
        L("Tar blicken och tankarna från vägen och är förbjudet.", "Takes your eyes and mind off the road and is forbidden.", "ኣይንን ኣእምሮን ካብ መንገዲ የውጽእ እሞ ክልኩል እዩ።", "يُبعد النظر والذهن عن الطريق وهو ممنوع.", "Indhaha iyo maskaxda ayay waddada ka qaaddaa waana mamnuuc."),
        [a(true, "Är förbjudet och farligt.", "Is forbidden and dangerous.", "ክልኩልን ሓደገኛን እዩ።", "ممنوع وخطر.", "Waa mamnuuc oo khatar ah."), a(false, "Är tillåtet under 30 km/h.", "Is allowed under 30 km/h.", "ትሕቲ 30 km/h ፍቑድ እዩ።", "مسموح تحت 30 كم/س.", "Waa oggol 30 km/h ka hooseeya."), a(false, "Gäller bara lastbil.", "Applies only to trucks.", "ንናይ ጽዕነት መኪና ጥራይ እዩ።", "ينطبق على الشاحنات فقط.", "Wuxuu khuseeyaa baabuurta xamuulka keliya."), a(false, "Är okej med högtalare i handen.", "Is fine with the speaker in your hand.", "ስፒከር ብኢድ ሒዝካ ጽቡቕ እዩ።", "جائز والمكبّر في اليد.", "Waa ok haddii speekarka gacanta ku jiro.")]),
      q(2, false, L("Vissa läkemedel kan påverka körningen genom att…", "Some medicines can affect driving by…", "ገለ መድሃኒታት ንምዝዋር ክጸልዉ ይኽእሉ ብምግባር…", "بعض الأدوية تؤثر في القيادة عبر…", "Dawooyin qaarkood waxay saameyn karaan wadista iyagoo…"),
        L("Ge trötthet, yrsel eller långsammare reaktion. Läs varningen på förpackningen.", "Causing tiredness, dizziness or slower reactions. Read the warning on the pack.", "ድኻም፣ ምዝንባል ወይ ዝሓሸ ምላሽ ክህቡ። ኣብ እሽጋ መጠንቀቕታ ኣንብብ።", "تسبب تعباً أو دوخة أو تفاعلاً أبطأ. اقرأ التحذير على العلبة.", "Keena daal, wareer ama falcelin gaabis. Akhri digniinta xirmada."),
        [a(true, "Trötthet eller långsammare reaktion.", "Tiredness or slower reaction.", "ድኻም ወይ ዝሓሸ ምላሽ።", "تعب أو تفاعل أبطأ.", "Daal ama falcelin gaabis."), a(false, "De gör alltid körningen säkrare.", "They always make driving safer.", "ኩሉ ግዜ ምዝዋር ዝውሕስ የገብርዎ።", "تجعل القيادة أكثر أماناً دائماً.", "Had iyo jeer wadista way ka nabadgeliyaan."), a(false, "De tar bort alkohol ur blodet.", "They remove alcohol from the blood.", "ኣልኮል ካብ ደም የእልይዎ።", "تزيل الكحول من الدم.", "Khamriga dhiigga ayay ka saaraan."), a(false, "De höjer den lagliga hastigheten.", "They raise the legal speed.", "ሕጋዊ ፍጥነት የውስኹ።", "ترفع السرعة القانونية.", "Xawaaraha sharciga ah ayay kordhiyaan.")]),
      q(3, false, L("Stress i trafiken hanterar du bäst genom att…", "You handle stress in traffic best by…", "ጭንቀት ኣብ ትራፊክ ብዝበለጸ ከመይ ጌርካ ተኣላልዮ…", "تتعامل مع التوتر في المرور بأفضل شكل عبر…", "Cadaadiska taraafikada ugu fiican waxaad u maamushaa adigoo…"),
        L("Sänka ambitionen att hinna, andas och ta en paus om du blir arg.", "Dropping the rush, breathing and taking a break if you get angry.", "ምብጻሕ ድሌት ኣጉድል፣ ትንፋስ ውሰድ እሞ እንተተሓርቂኻ ዕረፍቲ ውሰድ።", "تخفّض العجلة، تتنفّس وتأخذ استراحة إن غضبت.", "Yaree degdegga, neefso oo naso haddii aad xanaaqdo."),
        [a(true, "Sakta ner och ta en paus vid behov.", "Slow down and pause if needed.", "ፍጥነት ኣጉድል እሞ እንተድለየ ዕረፍቲ ውሰድ።", "خفّف وخذ استراحة عند الحاجة.", "Gaabi oo naso haddii loo baahdo."), a(false, "Köra om alla som stör.", "Overtake everyone who bothers you.", "ኩሎም ዘሕርቑኻ ሕለፍ።", "تجاوز كل من يزعجك.", "Dhaaf qof kasta oo kaa dhibaya."), a(false, "Tutahorna länge.", "Honk for a long time.", "ነዊሕ ፎክ ጭረሕ።", "أطلق البوق طويلاً.", "Honk dheer samee."), a(false, "Följa tätt bakom framförvarande.", "Tailgate the car in front.", "ነቲ ኣብ ቅድሚኻ ዘሎ ብቐረባ ተኸተል።", "لاصق السيارة الأمامية.", "Si dhow uga daba soco kan hore.")]),
      q(2, false, L("Passagerare som pratar högt och stör…", "Passengers who talk loudly and distract you…", "ድምጺ ብምልዓል ዝዕንቅፉ ተሳፈርቲ…", "الركاب الذين يتحدثون بصوت عالٍ ويشتّتونك…", "Rakaabka si weyn u hadlaya ee kaa leexinaya…"),
        L("Ska du be tystna. Föraren ansvarar för att uppmärksamheten räcker till vägen.", "Should be asked to quieten down. The driver is responsible for keeping attention on the road.", "ክዕጾ ክትብሎም ኣለካ። መራሒ መኪና ንኣተኩሮ መንገዲ ሓላፍነት ኣለዎ።", "اطلب منهم الهدوء. السائق مسؤول عن إبقاء الانتباه على الطريق.", "Waa inaad ka codsataa inay aamusaan. Darawalku wuxuu mas'uul ka yahay in fiiro waddada ku jirto."),
        [a(true, "Be dem tystna, du kör.", "Ask them to be quiet, you are driving.", "ክዕጾ በሎም፣ ንስኻ ትዝውር ኢኻ።", "اطلب الهدوء، أنت تقود.", "Weydiiso inay aamusaan, adiga ayaa wada."), a(false, "Måste du ignorera, det är deras rätt.", "You must ignore them, it is their right.", "ክትዘንግዖም ኣለካ፣ መሰሎም እዩ።", "يجب تجاهلهم، هذا حقهم.", "Waa inaad iska indho-tirtaa, waa xaqqooda."), a(false, "Får de hålla ratten.", "They may hold the wheel.", "መሪሕ መንእሰይ ክሓዙ ይኽእሉ።", "يجوز أن يمسكوا المقود.", "Waa inay isteerinka qabtaan."), a(false, "Ska du höja musiken mer.", "You should raise the music more.", "ሙዚቃ ዝያዳ ኣልዕል።", "ارفع الموسيقى أكثر.", "Waa inaad muusigga kordhisaa.")]),
    ],
  },
  {
    slug: "sakerhet",
    name: L("Säkerhet", "Safety", "ድሕንነት", "السلامة", "Nabadgelyada"),
    questions: [
      q(1, true, L("Säkerhetsbältet ska användas…", "The seatbelt should be used…", "ቀጽሪ ድሕንነት ክትጥቀመሉ ዘለካ…", "حزام الأمان يُستعمل…", "Suunka nabadgelyada waa in la isticmaalo…"),
        L("Av alla i bilen, varje resa, fram och bak.", "By everyone in the car, every trip, front and back.", "ብኹሎም ኣብ መኪና ዘለዉ፣ ነፍሲ ወከፍ ጉዕዞ፣ ቅድሚትን ድሕሪትን።", "من الجميع في السيارة في كل رحلة، أماماً وخلفاً.", "Qof kasta oo gaadhiga ku jira, safar kasta, hore iyo dambena."),
        [a(true, "Alltid, av alla i bilen.", "Always, by everyone in the car.", "ኩሉ ግዜ፣ ብኹሎም ኣብ መኪና።", "دائماً من الجميع في السيارة.", "Had iyo jeer, qof kasta oo gaadhiga ku jira."), a(false, "Bara i framsätet.", "Only in the front seats.", "ኣብ ቅድሚት መንበር ጥራይ።", "في المقاعد الأمامية فقط.", "Kuraasta hore keliya."), a(false, "Bara utanför tätort.", "Only outside built-up areas.", "ካብ ከተማ ወጻኢ ጥራይ።", "خارج المدينة فقط.", "Magaalada dibadda keliya."), a(false, "Bara om du kör fortare än 70.", "Only if you drive faster than 70.", "ካብ 70 ብዝያዳ እንተዘዋሪርካ ጥራይ።", "فقط إن قدت أسرع من 70.", "Keliya haddii aad ka dhaqso badan 70.")]),
      q(1, true, L("Ett litet barn i bilen ska sitta…", "A small child in the car should sit…", "ንእሽቶ ቈልዓ ኣብ መኪና ክቕመጥ ዘለዎ…", "طفل صغير في السيارة يجب أن يجلس…", "Ilmo yar oo gaadhiga ku jira waa inuu fadhiistaa…"),
        L("I godkänd bilbarnstol som passar barnets längd och vikt.", "In an approved child seat that fits the child's height and weight.", "ንንውሓትን ክብደትን ቈልዓ ዝሰማማዕ ዝተፈቕደ ናይ ቈልዓ መንበር።", "في مقعد أطفال معتمد يناسب طول الطفل ووزنه.", "Kursiga ilmo ee la ansixiyey ee ku habboon dhererka iyo miisaanka ilmaha."),
        [a(true, "I godkänd bilbarnstol.", "In an approved child seat.", "ኣብ ዝተፈቕደ ናይ ቈልዓ መንበር።", "في مقعد أطفال معتمد.", "Kursiga ilmo ee la ansixiyey."), a(false, "I knät på en vuxen.", "On an adult's lap.", "ኣብ ሕቝፊ ዓቢ ሰብ።", "في حضن شخص بالغ.", "Dhabta qof weyn."), a(false, "Löst i baksätet med bälte över halsen.", "Loose in the back with the belt on the neck.", "ኣብ ድሕሪት መንበር ቀጽሪ ኣብ ክሳድ።", "طليقاً في الخلف والحزام على العنق.", "Dhabarka oo suunku qoorta ku yaal."), a(false, "Framåtvänd från nyfödd.", "Forward-facing from newborn.", "ካብ ሓድሽ ልደት ንቕድሚት ገጹ።", "مواجهاً للأمام منذ الولادة.", "Wajiga hore laga bilaabo dhalashada.")]),
      q(2, false, L("Nackstödet skyddar mest om det sitter…", "The headrest protects best if it sits…", "መደጎሚ ክሳድ ብዝበለጸ ይከላኸል እንተተቐሚጡ…", "مسند الرأس يحمي بأفضل شكل إن وُضع…", "Taageeraha madaxu wuxuu ugu fiican u ilaaliyaa haddii uu fadhiisto…"),
        L("I höjd med hjässan, tätt bakom huvudet.", "Level with the top of the head, close behind it.", "ምስ ርእሲ ርእሲ ማዕሪ፣ ብቐረባ ድሕሪ ርእሲ።", "بمستوى أعلى الرأس وقريباً خلفه.", "La siman dusha madaxa, si dhow gadaashiisa."),
        [a(true, "I höjd med hjässan, tätt bakom.", "Level with the crown, close behind.", "ምስ ርእሲ ማዕሪ፣ ብቐረባ ድሕሪኡ።", "بمستوى أعلى الرأس وقريباً خلفه.", "La siman dusha, si dhow gadaal."), a(false, "Så lågt som möjligt.", "As low as possible.", "ከም ዝከኣለ ትሑት።", "منخفضاً قدر الإمكان.", "Sida ugu hooseysa."), a(false, "Borttaget i baksätet.", "Removed in the back seat.", "ኣብ ድሕሪት መንበር ተኣልዩ።", "مُزالاً في المقعد الخلفي.", "Laga saaray kursiga danbe."), a(false, "Lutat långt bakåt från nacken.", "Tilted far back from the neck.", "ካብ ክሳድ ንርሑቕ ድሕሪት ተጠውዩ።", "مائلاً بعيداً عن الرقبة.", "Si fog uga foorarsan qoorta.")]),
      q(2, false, L("Airbag och ratt ska ha avstånd så att…", "Airbag and steering wheel need distance so that…", "ናይ ሓደጋ ኩዕሶን መሪሕ መንእሰይን ርሕቀት ክህልዎም…", "الوسادة الهوائية والمقود يحتاجان مسافة حتى…", "Barkinta hawada iyo isteerinku waxay u baahan yihiin fogaanta si…"),
        L("Kudden kan blåsas upp utan att slå dig för nära i ansiktet.", "The bag can inflate without hitting your face too close.", "ኩዕሶ ብዘይ ብቐረባ ገጽካ ምህራም ክትንፍሕ።", "تنتفخ الوسادة دون أن تضرب وجهك من مسافة قريبة جداً.", "Barkintu way buuxsamaysaa iyada oo aan wajigaaga aad ugu dhowayn."),
        [a(true, "Kudden hinner öppna med avstånd.", "The bag can open with space.", "ኩዕሶ ብርሕቀት ክትኽፈት ትኽእል።", "الوسادة تتسع مع مسافة.", "Barkintu way furmi kartaa fogaanta."), a(false, "Du kan luta huvudet på ratten.", "You can rest your head on the wheel.", "ርእሲኻ ኣብ መሪሕ መንእሰይ ክትደግፍ ትኽእል።", "يمكنك إراحة الرأس على المقود.", "Madaxa isteerinka ku seexin kartaa."), a(false, "Bältet blir onödigt.", "The belt becomes unnecessary.", "ቀጽሪ ዘይድለ ኮይኑ።", "يصبح الحزام غير لازم.", "Suunku wuxuu noqdaa mid aan loo baahnayn."), a(false, "ABS fungerar bättre.", "ABS works better.", "ABS ዝበለጸ ይሰርሕ።", "يعمل ABS بشكل أفضل.", "ABS si ka wanaagsan ayuu u shaqeeyaa.")]),
      q(3, false, L("Reflex eller lampa när du går ur bilen i mörker på landsväg…", "A reflector or light when you leave the car in the dark on a rural road…", "ጸልማት ኣብ ገጠራዊ ጽርግያ ካብ መኪና ምስ እትወጽእ ሪፍለክስ ወይ ብርሃን…", "عاكس أو ضوء عندما تنزل من السيارة ليلاً على طريق ريفي…", "Iftiin ama milicsiga markaad gaadhiga ka degto habeennimo waddada miyiga…"),
        L("Gör att andra ser dig tidigare. Stanna så långt åt sidan som det går.", "Lets others see you earlier. Stop as far to the side as you can.", "ኻልኦት ቕድሚት ክርእዩኻ የኽእል። ከም ዝከኣለ ንጎኒ ዕጸው።", "يجعل الآخرين يرونك أبكر. توقف أقصى الجانب الممكن.", "Waxay dadka kale kuu oggolaataa inay ku arkaan goor hore. Istaag dhinaca ugu fog ee suurtogalka ah."),
        [a(true, "Gör dig synlig, stanna långt ut.", "Makes you visible, stop far out.", "ክትረአ የገብረካ፣ ንጎኒ ዕጸው።", "يجعلك مرئياً، توقف بعيداً.", "Waa ku muujiyaa, istaag meel fog."), a(false, "Är bara råd för cyklister.", "Is advice for cyclists only.", "ንሳይክል ነድቲ ጥራይ ምኽሪ እዩ።", "نصيحة للدراجين فقط.", "Waa talo baaskiilleyda keliya."), a(false, "Ersätter varningsblinkers.", "Replaces hazard lights.", "ናይ መጠንቀቕታ ብርሃን ይትክእ።", "يستبدل أضواء التحذير.", "Wuxuu beddelaa nalalka digniinta."), a(false, "Är förbjudet vid motorstopp.", "Is forbidden at engine stop.", "ሞተር ምስ ደው በለ ክልኩል እዩ።", "ممنوع عند توقف المحرك.", "Waa mamnuuc marka matoorku istaago.")]),
      q(2, false, L("Varför ska last vara surrad i kupé och bagage?", "Why should cargo be secured in cabin and boot?", "ጽዕነት ኣብ ውሽጢ መኪናን ባጋጅን ስለምንታይ ክእሰር?", "لماذا يُثبَّت الحمل في المقصورة والصندوق؟", "Maxaa xamuulka loogu xidhaa qolka iyo sanduuqa?"),
        L("Lös last flyger framåt vid en inbromsning och kan skada er.", "Loose cargo flies forward in a braking and can injure you.", "ዘይተኣሰረ ጽዕነት ኣብ ምዕጻው ንቕድሚት ይነፍር እሞ ክጎድእ ይኽእል።", "الحمل غير المثبت يندفع إلى الأمام عند الفرملة وقد يؤذيكم.", "Xamuulka xarrigan wuxuu hore ugu duulaa biriikada wuuna dhaawici karaa."),
        [a(true, "Lös last kan skada er vid inbromsning.", "Loose cargo can injure you when you brake.", "ዘይተኣሰረ ጽዕነት ኣብ ምዕጻው ክጎድእ ይኽእል።", "الحمل السائب قد يؤذيكم عند الفرملة.", "Xamuulka xarrigan wuu idin dhaawici karaa marka la biriikeeyo."), a(false, "Polisen kräver det bara för lastbil.", "Police require it only for trucks.", "ፖሊስ ንናይ ጽዕነት መኪና ጥራይ የዕዝዞ።", "الشرطة تطلبه للشاحنات فقط.", "Boolisku waxay u baahan yihiin baabuurta xamuulka keliya."), a(false, "Det sänker försäkringen automatiskt.", "It automatically lowers insurance.", "ኢንሹራንስ ብባዕሉ የንእስ።", "يخفّض التأمين تلقائياً.", "Si otomaatik ah ayay u hoos u dhigtaa caymiska."), a(false, "Det tar bort bälteskravet.", "It removes the belt requirement.", "ግዴታ ቀጽሪ የእልይ።", "يلغي شرط الحزام.", "Wuxuu ka saaraa waajibka suunka.")]),
    ],
  },
  {
    slug: "motorvag-och-landsvag",
    name: L("Motorväg och landsväg", "Motorway and rural road", "ሞተርዌይን ገጠራዊ ጽርግያን", "الطريق السريع والريفي", "Waddada weyn iyo miyiga"),
    questions: [
      q(1, true, L("Vägrenen på en motorväg är främst till för…", "The hard shoulder on a motorway is mainly for…", "ኣብ ሞተርዌይ ጎናዊ መንገዲ ቀንዲ ን…", "كتف الطريق على الطريق السريع أساساً لـ…", "Garka waddada weyn ugu horrayn waa loogu talagalay…"),
        L("Nödstopp, inte för vanlig körning eller omkörning.", "Emergency stops, not ordinary driving or overtaking.", "ናይ ህጹጽ ምዕጻው፣ ንልሙድ ምዝዋር ወይ ምሕላፍ ኣይኮነን።", "التوقف الطارئ لا للقيادة العادية أو التجاوز.", "Joogsi degdeg ah, ma aha wadis caadi ah ama dhaafitaan."),
        [a(true, "Nödstopp, inte vanlig körning.", "Emergency stop, not ordinary driving.", "ናይ ህጹጽ ምዕጻው፣ ልሙድ ምዝዋር ኣይኮነን።", "توقف طارئ لا قيادة عادية.", "Joogsi degdeg, maaha wadis caadi."), a(false, "Omkörning i rusning.", "Overtaking in rush hour.", "ኣብ ዝተጸናናዐ ግዜ ምሕላፍ።", "تجاوز في الذروة.", "Dhaafitaan saacadaha ciribtirka."), a(false, "Parkering i två timmar.", "Parking for two hours.", "ንክልተ ሰዓት ምዕጻው።", "ركن لساعتين.", "Parking laba saacadood."), a(false, "Cykeltrafik.", "Bicycle traffic.", "ናይ ሳይክል ትራፊክ።", "مرور الدراجات.", "Taraafikada baaskiilka.")]),
      q(1, true, L("På motorväg kör du om…", "On a motorway you overtake…", "ኣብ ሞተርዌይ ትሕልፍ…", "على الطريق السريع تتجاوز…", "Waddada weyn waxaad ku dhaaftaa…"),
        L("Till vänster. Gå tillbaka till höger fil när omkörningen är klar.", "To the left. Return to the right lane when the pass is done.", "ንጸጋም። ምሕላፍ ምስ ተዛዘመ ናብ የማናይ መስመር ተመለስ።", "إلى اليسار. عُد إلى المسار الأيمن بعد انتهاء التجاوز.", "Dhanka bidix. Ku noqo haadka midig marka dhaafitaanku dhammaado."),
        [a(true, "Till vänster, sedan tillbaka höger.", "To the left, then back right.", "ንጸጋም፣ ድሕሪኡ ናብ የማን ተመለስ።", "إلى اليسار ثم ارجع يميناً.", "Bidix, kadib ku noqo midig."), a(false, "Till höger om lastbilar.", "To the right of trucks.", "ንየማን ናይ ጽዕነት መካይን።", "إلى يمين الشاحنات.", "Dhanka midig ee xamuulka."), a(false, "På vägrenen om det är tätt.", "On the shoulder if it is dense.", "ትራፊክ እንተተጸናናዐ ኣብ ጎናዊ መንገዲ።", "على الكتف إن كانت الحركة كثيفة.", "Garka haddii ay cufan tahay."), a(false, "Mitt emellan filerna.", "Between the lanes.", "ኣብ ማእከል መስመራት።", "بين المسارات.", "Haadaha dhexdooda.")]),
      q(2, false, L("Om du får motorstopp på motorvägen ska du…", "If the engine stops on the motorway you should…", "ኣብ ሞተርዌይ ሞተር እንተደው በለ ክትገብር ዘለካ…", "إن توقف المحرك على الطريق السريع ينبغي أن…", "Haddii matoorku istaago waddada weyn waa inaad…"),
        L("Försöka nå vägrenen, tända varningsblinkers och lämna bilen mot räcket.", "Try to reach the shoulder, put on hazards and leave the car towards the barrier.", "ጎናዊ መንገዲ ክትበጽሕ ፈትን፣ መጠንቀቕታ ብርሃን ኣብርህ እሞ ናብ ድልዱል ወጻኢ ውጻእ።", "حاول بلوغ الكتف، شغّل أضواء التحذير وانزل نحو الحاجز.", "Isku day inaad garka gaarto, shid nalalka digniinta oo gaadhiga uga bax xagga xayndaabka."),
        [a(true, "Nå vägrenen, varna, gå mot räcket.", "Reach the shoulder, warn, go to the barrier.", "ጎናዊ መንገዲ በጽሕ፣ ኣጠንቅቕ፣ ናብ ድልዱል ኪድ።", "ابلغ الكتف، حذّر، امشِ نحو الحاجز.", "Gaar garka, digniin, u soco xayndaabka."), a(false, "Stanna i vänster fil och vänta.", "Stop in the left lane and wait.", "ኣብ ጸጋማይ መስመር ዕጸው እሞ ጽበ።", "توقف في المسار الأيسر وانتظر.", "Istaag haadka bidix oo sug."), a(false, "Backa mot närmaste avfart.", "Reverse towards the nearest exit.", "ናብ ዝቀረበ መውጽኢ ድሕሪት ኪድ።", "ارجع للخلف نحو أقرب مخرج.", "Dib ugu noqo ka-bixitaanka ugu dhow."), a(false, "Gå mitt i filen och vinka.", "Walk in the lane and wave.", "ኣብ ማእከል መስመር ኪድ እሞ ኣወዛዝዕ።", "امشِ وسط المسار ولوّح.", "Ku soco haadka dhexdiisa oo gacan haadin.")]),
      q(2, false, L("På smal landsväg med mötande trafik ska du…", "On a narrow rural road with oncoming traffic you should…", "ኣብ ገጠራዊ ጽርግያ ምስ ዝመጽእ ትራፊክ ክትገብር ዘለካ…", "على طريق ريفي ضيق مع حركة قادمة ينبغي أن…", "Waddo miyi oo cidhiidhi ah oo taraafiko ka soo horjeeda waa inaad…"),
        L("Sänka farten, hålla till höger och vara beredd att stanna.", "Slow down, keep right and be ready to stop.", "ፍጥነት ኣጉድል፣ ንየማን ሓዝ እሞ ንምዕጻው ድሉው ኩን።", "خفّف، الزم اليمين وكن مستعداً للتوقف.", "Gaabi, midig ku dhowow oo diyaar u noqo inaad istaagto."),
        [a(true, "Sakta in och håll höger.", "Slow down and keep right.", "ፍጥነት ኣጉድል እሞ የማን ሓዝ።", "خفّف والزم اليمين.", "Gaabi oo midig hayso."), a(false, "Hålla mittlinjen för att synas.", "Hold the centre line to be seen.", "ንክትረአ ማእከላይ መስመር ሓዝ።", "الزم الخط الأوسط لتُرى.", "Hayso xariiqda dhexe si lagu arko."), a(false, "Tutahorna och hålla farten.", "Honk and keep speed.", "ፎክ ጭረሕ እሞ ፍጥነት ሓዝ።", "أطلق البوق وحافظ على السرعة.", "Honk samee oo xawaaraha hayso."), a(false, "Blända upp helljuset hela tiden.", "Keep main beam on the whole time.", "ሙሉእ ብርሃን ኩሉ ግዜ ሓዝ።", "أبقِ الضوء العالي طوال الوقت.", "Iftiinka sare ku hay mar walba.")]),
      q(3, false, L("Vilda djur är vanligast i skymning. Då ska du…", "Wild animals are most common at dusk. Then you should…", "ኣራዊት ብዙሕ ግዜ ኣብ ምድንጋር እዮም። ሽዑ ክትገብር ዘለካ…", "الحيوانات البرية أكثر شيوعاً عند الغسق. عندها ينبغي أن…", "Xayawaanka duurjoogta ah waxay ku badan yihiin fiidkii. Markaas waa inaad…"),
        L("Sänka farten, speja längs kanterna och vara beredd att bromsa.", "Slow down, scan the edges and be ready to brake.", "ፍጥነት ኣጉድል፣ ጫፋት ርኣይ እሞ ንምዕጻው ድሉው ኩን።", "خفّف، راقب الحواف وكن مستعداً للفرملة.", "Gaabi, geesaha baadh oo diyaar u noqo inaad biriikayso."),
        [a(true, "Sakta in och speja längs vägkanten.", "Slow down and scan the roadside.", "ፍጥነት ኣጉድል እሞ ጎናዊ መንገዲ ርኣይ።", "خفّف وراقب جانب الطريق.", "Gaabi oo geesaha waddada baadh."), a(false, "Köra fortare för att passera området snabbt.", "Drive faster to leave the area quickly.", "ነታ ዞባ ብቕልጡፍ ንምሕላፍ ፍጥነት ወስኽ።", "قد أسرع لمغادرة المنطقة سريعاً.", "Si degdeg ah uga gudub aagga."), a(false, "Stänga av halvljuset.", "Switch off dipped lights.", "ቕጽበታዊ ብርሃን ምፍታሕ።", "أطفئ الضوء الخافت.", "Dami iftiinka hoose."), a(false, "Tutahorna hela tiden.", "Honk the whole time.", "ኩሉ ግዜ ፎክ ጭረሕ።", "أطلق البوق طوال الوقت.", "Honk samee mar walba.")]),
      q(2, false, L("På avfart från motorväg ska du…", "On a motorway exit you should…", "ካብ ሞተርዌይ ኣብ መውጽኢ ክትገብር ዘለካ…", "على مخرج الطريق السريع ينبغي أن…", "Ka-bixitaanka waddada weyn waa inaad…"),
        L("Anpassa farten i avfartsfilen, inte bromsa hårt kvar på motorvägen.", "Adjust speed in the exit lane, not brake hard while still on the motorway.", "ኣብ መውጽኢ መስመር ፍጥነት ምዕራይ፣ ኣብ ሞተርዌይ ከለኻ ጽኑዕ ምዕጻው ኣይትግበር።", "اضبط السرعة في مسار الخروج ولا تفرمل بقوة وأنت لا تزال على الطريق السريع.", "Xawaaraha ku hagaaji haadka ka-bixitaanka, ha biriiko adag samayn intaad weli waddada weyn ku jirto."),
        [a(true, "Sänka farten i avfartsfilen.", "Reduce speed in the exit lane.", "ኣብ መውጽኢ መስመር ፍጥነት ኣጉድል።", "خفّض السرعة في مسار الخروج.", "Hoos u dhig xawaaraha haadka ka-bixitaanka."), a(false, "Stanna på motorvägen före avfarten.", "Stop on the motorway before the exit.", "ቅድሚ መውጽኢ ኣብ ሞተርዌይ ዕጸው።", "توقف على الطريق السريع قبل المخرج.", "Istaag waddada weyn ka hor ka-bixitaanka."), a(false, "Byta till vänster fil.", "Move to the left lane.", "ናብ ጸጋማይ መስመር ኺድ።", "انتقل إلى المسار الأيسر.", "U wareeg haadka bidix."), a(false, "Hålla motorvägsfart hela avfarten.", "Keep motorway speed through the exit.", "ኣብ መውጽኢ ፍጥነት ሞተርዌይ ሓዝ።", "حافظ على سرعة الطريق السريع طوال الخروج.", "Ku hay xawaaraha waddada weyn ka-bixitaanka oo dhan.")]),
    ],
  },
  {
    slug: "parkering",
    name: L("Parkering", "Parking", "ምዕጻው መኪና", "الركن", "Parking-ka"),
    questions: [
      q(1, true, L("Hur nära ett övergångsställe får du parkera?", "How close to a pedestrian crossing may you park?", "ናብ ምሕላፍ እግረኛ ክንደይ ቀረባ ክትዕጽው ትኽእል?", "ما أقرب مسافة لممر مشاة يجوز الركن عندها؟", "Immisa ayaad ugu dhowaan kartaa isgoyska lugaynayaasha parking?"),
        L("Inte inom 10 meter före övergångsstället i din färdriktning.", "Not within 10 metres before the crossing in your direction of travel.", "ኣብ ኣንፈት ምዝዋርካ ቅድሚ ምሕላፍ ኣብ ውሽጢ 10 ሜተር ኣይትዕጽው።", "ليس ضمن 10 أمتار قبل الممر في اتجاه سيرك.", "Ha parking-garin 10 mitir ka hor isgoyska jihadaada socodka."),
        [a(true, "Inte inom 10 meter före.", "Not within 10 metres before.", "ቅድሚኡ ኣብ ውሽጢ 10 ሜተር ኣይኮነን።", "ليس ضمن 10 أمتار قبله.", "Ma aha 10 mitir ka hor."), a(false, "Direkt på zebra-linjerna.", "Directly on the zebra lines.", "ቀጥታ ኣብ ስመር መስመራት።", "مباشرة على خطوط الحمار الوحشي.", "Si toos ah xariiqyada zebra."), a(false, "1 meter före är alltid okej.", "1 metre before is always fine.", "1 ሜተር ቅድሚኡ ኩሉ ግዜ ጽቡቕ እዩ።", "متر واحد قبله جائز دائماً.", "1 mitir ka hor had iyo jeer waa ok."), a(false, "Bara bussar har en gräns.", "Only buses have a limit.", "ኣውቶቡሳት ጥራይ ገደብ ኣለዎም።", "الحافلات وحدها لها حد.", "Basaska keliya ayaa xad leh.")]),
      q(1, true, L("Datumparkering betyder att du…", "Date parking means that you…", "ብዕለት ምዕጻው ማለት ንስኻ…", "الركن حسب التاريخ يعني أنك…", "Parking-ka taariikhda waxay ka dhigan tahay inaad…"),
        L("Inte får stå på den sida där husnumren har samma udda/jämna dag som datumet.", "May not stand on the side where house numbers match the odd/even date.", "ኣብታ ወገን ቁጽሪ ገዛውቲ ምስ ዕለት ዝሰማማዕ ኣይትዕጽውን።", "لا تقف في الجانب الذي تطابق أرقام بيوته اليوم الفردي/الزوجي.", "Ma istaagi kartid dhinaca lambarrada guryuhu ku habboon yihiin maalinta aan-labalaabka/labalaabka ah."),
        [a(true, "Byter sida efter udda och jämna datum.", "Switch sides by odd and even dates.", "ብዘይመጣጠንን ዝመጣጠንን ዕለት ወገን ትቕይር።", "تبدّل الجانب حسب الأيام الفردية والزوجية.", "Dhinac beddel sidii taariikhaha aan-labalaabka iyo labalaabka."), a(false, "Får stå hur länge du vill.", "May stay as long as you like.", "ክንደይ ዘድሊ ክትጸንሕ ትኽእል።", "يجوز البقاء ما شئت.", "Waxaad joogi kartaa intaad rabto."), a(false, "Måste betala per minut.", "Must pay per minute.", "ብደቒቕ ክትኸፍል ኣለካ።", "يجب الدفع بالدقيقة.", "Waa inaad daqiiqad bixisaa."), a(false, "Gäller bara lastbilar.", "Applies only to trucks.", "ንናይ ጽዕነት መኪና ጥራይ እዩ።", "ينطبق على الشاحنات فقط.", "Wuxuu khuseeyaa xamuulka keliya.")]),
      q(2, false, L("En plats med rullstolssymbol är till för…", "A bay with a wheelchair symbol is for…", "ምልክት ሳንቡእ ቦታ ን…", "موقف برمز كرسي متحرك مخصّص لـ…", "Booska calaamadda kursiga curyaanka waa loogu talagalay…"),
        L("Fordon med giltigt parkeringstillstånd för rörelsehindrade.", "Vehicles with a valid disabled parking permit.", "ንዘይንቀሳቐሱ ዝኸውን ዝሰርሕ ናይ ምዕጻው ፍቓድ ዘለዎም መካይን።", "مركبات لديها تصريح ركن ساري لذوي الإعاقة الحركية.", "Baabuurta haysata oggolaanshaha parking-ka naafada ee shaqeeya."),
        [a(true, "Bilar med giltigt tillstånd.", "Cars with a valid permit.", "ዝሰርሕ ፍቓድ ዘለወን መካይን።", "سيارات بتصريح سارٍ.", "Baabuurta oggolaanshaha shaqeeya."), a(false, "Alla som stannar under fem minuter.", "Anyone stopping under five minutes.", "ትሕቲ ሓሙሽተ ደቒቕ ዝዕጽዉ ኩሎም።", "كل من يتوقف أقل من خمس دقائق.", "Qof kasta oo joogsada shan daqiiqo ka yar."), a(false, "Bara elbil.", "Electric cars only.", "ኤሌክትሪክ መኪና ጥራይ።", "السيارات الكهربائية فقط.", "Baabuurta korontada keliya."), a(false, "Mc och moped.", "Motorcycles and mopeds.", "ሞተርሳይክልን ሞፔድን።", "الدراجات النارية والموبيدات.", "Mootooyinka iyo moped-yada.")]),
      q(2, false, L("Du får inte parkera så att du…", "You may not park so that you…", "ከምዚ ጌርካ ክትዕጽው የብልካን…", "لا يجوز الركن بحيث…", "Ma parking-garin kartid si aad…"),
        L("Hindrar andra, skymmer skyltar eller blockerar en utfart.", "Obstruct others, hide signs or block an exit.", "ኻልኦት ከተዕንቅፍ፣ ምልክታት ከተጽልምት ወይ መውጽኢ ከተዕጽው።", "تعيق الآخرين أو تحجب الإشارات أو تسد مخرجاً.", "Hor-istaagto kuwa kale, qarisato calaamadaha ama xirto ka-bixitaan."),
        [a(true, "Hindrar andra eller skymmer skyltar.", "Obstruct others or hide signs.", "ኻልኦት ከተዕንቅፍ ወይ ምልክታት ከተጽልምት።", "تعيق الآخرين أو تحجب الإشارات.", "Hor-istaagto kuwa kale ama qarisato calaamadaha."), a(false, "Står mer än 20 cm från trottoarkanten.", "Stand more than 20 cm from the kerb.", "ካብ ጫፍ መንገዲ እግረኛ ልዕሊ 20 cm ትርከብ።", "تقف على بعد أكثر من 20 سم من الرصيف.", "Ka fog tahay 20 cm geeska laamiga."), a(false, "Har tända parkeringsljus.", "Have parking lights on.", "ናይ ምዕጻው ብርሃን በሪሁ ኣሎ።", "أضواء الركن مشتعلة.", "Nalalka parking-ku shidan yihiin."), a(false, "Har passagerare kvar i bilen.", "Have passengers left in the car.", "ተሳፈርቲ ኣብ መኪና ተሪፎም።", "بقي ركاب في السيارة.", "Rakaab ayaa gaadhiga ku haray.")]),
      q(3, false, L("En lastzon med tidsangivelse betyder att du…", "A loading bay with a time window means that you…", "ግዜ ዘለዎ ናይ ምጽዓን ዞባ ማለት ንስኻ…", "منطقة تحميل بوقت محدد تعني أنك…", "Aagga rarista oo wakhti leh waxay ka dhigan tahay inaad…"),
        L("Får stanna för lastning under den tiden, inte parkera och lämna bilen länge.", "May stop to load during that time, not park and leave the car for long.", "ኣብቲ ግዜ ንምጽዓን ክትዕጽው ትኽእል፣ መኪና ሓዲግካ ነዊሕ ኣይትጸንሕ።", "يجوز التوقف للتحميل في ذلك الوقت لا ترك السيارة طويلاً.", "Waxaad joogsan kartaa rarista wakhtigaas, ma aha inaad parking-garato oo gaadhiga kaga tagto wakhti dheer."),
        [a(true, "Får lasta under angiven tid, inte långparkera.", "May load in the stated time, not long-park.", "ኣብቲ ግዜ ክትጽዕን ትኽእል፣ ነዊሕ ኣይትዕጽው።", "يجوز التحميل في الوقت المذكور لا الركن الطويل.", "Waad rarikartaa wakhtiga la sheegay, parking dheer maaha."), a(false, "Får sova i bilen fritt.", "May sleep in the car freely.", "ኣብ መኪና ብናጽነት ክትድቅስ ትኽእል።", "يجوز النوم في السيارة بحرية.", "Waad ku seexan kartaa gaadhiga si xor ah."), a(false, "Måste betala trängselskatt extra.", "Must pay extra congestion tax.", "ተወሳኺ ናይ ምጽናን ግብሪ ክትኸፍል ኣለካ።", "يجب دفع ضريبة ازدحام إضافية.", "Waa inaad bixisaa canshuur ciriiri dheeraad ah."), a(false, "Gäller bara på helger.", "Applies only at weekends.", "ኣብ ሰንበት ጥራይ እዩ።", "ينطبق في عطلة الأسبوع فقط.", "Wuxuu khuseeyaa toddobaadka dhammaadkiisa keliya.")]),
      q(2, false, L("Vintertid kan nattparkeringsförbud införas för att…", "In winter a night parking ban can be introduced to…", "ኣብ ክረምቲ ናይ ለይቲ ምዕጻው ክልኩል ክግበር ይኽእል ምእንቲ…", "في الشتاء يمكن فرض حظر ركن ليلي لـ…", "Jiilaalka mamnuucida parking-ka habeenkii waa la soo saari karaa si…"),
        L("Plogbilen ska kunna röja snö. Följ de lokala skyltarna.", "The plough can clear snow. Follow the local signs.", "ናይ በረድ መኪና በረድ ክትእልይ። ናይ ከባቢ ምልክታት ስዓብ።", "لتتمكن جرافة الثلج من الكنس. اتبع الإشارات المحلية.", "Si baabuurka barafku u nadiifiyo. Raac calaamadaha deegaanka."),
        [a(true, "Snöröjning ska kunna köras.", "Snow clearing must be able to run.", "ምእላይ በረድ ክስራሕ።", "يجب أن تتم إزالة الثلج.", "Nadiifinta barafku waa inay shaqeysaa."), a(false, "Däcken ska vila.", "Tyres should rest.", "ጎማታት ክዕረፉ።", "الإطارات تحتاج راحة.", "Taayirradu ha nastaan."), a(false, "Elbilar ska ladda bara då.", "EVs should charge only then.", "ኤሌክትሪክ መኪናታት ሽዑ ጥራይ ክሕረዳ።", "السيارات الكهربائية تشحن عندها فقط.", "Baabuurta korontadu markaas keliya ha dallacaan."), a(false, "Bussfiler ska bli parkeringsplatser.", "Bus lanes should become parking.", "ናይ ኣውቶቡስ መስመር ናይ ምዕጻው ክኸውን።", "مسارات الحافلات تصبح مواقف.", "Haadka basasku ha noqdaan parking.")]),
    ],
  },
];

export async function seedTheory(db: PrismaClient) {
  for (const [categoryIndex, category] of CATEGORIES.entries()) {
    const row = await db.theoryCategory.upsert({
      where: { slug: category.slug },
      update: { order: (categoryIndex + 1) * 10 },
      create: {
        id: `seed-cat-${category.slug}`,
        slug: category.slug,
        order: (categoryIndex + 1) * 10,
      },
    });
    for (const locale of LOCALES) {
      await db.theoryCategoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: row.id, locale } },
        update: { name: category.name[locale] },
        create: {
          categoryId: row.id,
          locale,
          name: category.name[locale],
        },
      });
    }

    for (const [questionIndex, question] of category.questions.entries()) {
      const questionId = `seed-q-${category.slug}-${questionIndex + 1}`;
      await db.theoryQuestion.upsert({
        where: { id: questionId },
        update: {
          categoryId: row.id,
          isFree: question.isFree,
          difficulty: question.difficulty,
          active: true,
        },
        create: {
          id: questionId,
          categoryId: row.id,
          isFree: question.isFree,
          difficulty: question.difficulty,
          active: true,
        },
      });
      for (const locale of LOCALES) {
        await db.theoryQuestionTranslation.upsert({
          where: { questionId_locale: { questionId, locale } },
          update: {
            text: question.text[locale],
            explanation: question.explanation[locale],
          },
          create: {
            questionId,
            locale,
            text: question.text[locale],
            explanation: question.explanation[locale],
          },
        });
      }
      for (const [answerIndex, answer] of question.answers.entries()) {
        const answerId = `${questionId}-a${answerIndex}`;
        await db.theoryAnswer.upsert({
          where: { id: answerId },
          update: {
            questionId,
            isCorrect: answer.correct,
            order: answerIndex,
          },
          create: {
            id: answerId,
            questionId,
            isCorrect: answer.correct,
            order: answerIndex,
          },
        });
        for (const locale of LOCALES) {
          await db.theoryAnswerTranslation.upsert({
            where: { answerId_locale: { answerId, locale } },
            update: { text: answer.text[locale] },
            create: {
              answerId,
              locale,
              text: answer.text[locale],
            },
          });
        }
      }
    }
  }
}
