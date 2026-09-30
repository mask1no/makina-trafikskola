export type BookingTemplate =
  | "booking_confirmed"
  | "booking_cancelled_by_student"
  | "booking_cancelled_by_teacher"
  | "booking_reminder_24h"
  | "booking_moved"
  | "teacher_booking_new"
  | "teacher_booking_cancelled"
  | "teacher_booking_moved";

type SupportedLocale = "sv" | "en" | "ti" | "ar" | "so";

type BookingParts = {
  time: string;
  deadline?: string;
  previousTime?: string;
  student?: string;
  teacher?: string;
  place?: string;
  schoolPhone?: string;
  creditRefunded?: boolean;
};

const subjects: Record<SupportedLocale, Record<BookingTemplate, string>> = {
  sv: {
    booking_confirmed: "Din körlektion är bokad",
    booking_cancelled_by_student: "Din körlektion är avbokad",
    booking_cancelled_by_teacher: "Trafikskolan har avbokat din körlektion",
    booking_reminder_24h: "Påminnelse om din körlektion",
    booking_moved: "Din körlektion är flyttad",
    teacher_booking_new: "Ny lektion",
    teacher_booking_cancelled: "Avbokad lektion",
    teacher_booking_moved: "Ändrad lektion",
  },
  en: {
    booking_confirmed: "Your driving lesson is booked",
    booking_cancelled_by_student: "Your driving lesson is cancelled",
    booking_cancelled_by_teacher: "The driving school cancelled your lesson",
    booking_reminder_24h: "Driving lesson reminder",
    booking_moved: "Your driving lesson was moved",
    teacher_booking_new: "New lesson",
    teacher_booking_cancelled: "Cancelled lesson",
    teacher_booking_moved: "Changed lesson",
  },
  ti: {
    booking_confirmed: "ትምህርትኻ ተመዝጊቡ",
    booking_cancelled_by_student: "ትምህርትኻ ተሰሪዙ",
    booking_cancelled_by_teacher: "ቤት ትምህርቲ ሰሪዝዎ",
    booking_reminder_24h: "መዘኻኸሪ ትምህርቲ",
    booking_moved: "ትምህርትኻ ተቐይሩ",
    teacher_booking_new: "ሓድሽ ትምህርቲ",
    teacher_booking_cancelled: "ዝተሰረዘ ትምህርቲ",
    teacher_booking_moved: "ዝተቐየረ ትምህርቲ",
  },
  ar: {
    booking_confirmed: "تم حجز درس القيادة",
    booking_cancelled_by_student: "تم إلغاء درس القيادة",
    booking_cancelled_by_teacher: "ألغت المدرسة الدرس",
    booking_reminder_24h: "تذكير بدرس القيادة",
    booking_moved: "تم نقل درس القيادة",
    teacher_booking_new: "درس جديد",
    teacher_booking_cancelled: "درس ملغى",
    teacher_booking_moved: "درس معدّل",
  },
  so: {
    booking_confirmed: "Casharka waa la qabtay",
    booking_cancelled_by_student: "Casharka waa la baajiyay",
    booking_cancelled_by_teacher: "Dugsigu wuu baajiyay casharka",
    booking_reminder_24h: "Xusuusin cashar",
    booking_moved: "Casharka waa la raray",
    teacher_booking_new: "Cashar cusub",
    teacher_booking_cancelled: "Cashar la baajiyay",
    teacher_booking_moved: "Cashar la beddelay",
  },
};

const localeTags: Record<SupportedLocale, string> = {
  sv: "sv-SE",
  en: "en-SE",
  ti: "ti-ER",
  ar: "ar-SE",
  so: "so-SO",
};

function supportedLocale(locale: string): SupportedLocale {
  return locale in subjects ? (locale as SupportedLocale) : "sv";
}

function clean(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatLessonTime(date: Date, locale: SupportedLocale) {
  return new Intl.DateTimeFormat(localeTags[locale], {
    timeZone: "Europe/Stockholm",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    numberingSystem: "latn",
  }).format(date);
}

function teacherSuffix(locale: SupportedLocale, teacher?: string) {
  if (!teacher) return "";
  if (locale === "en") return ` with ${teacher}`;
  if (locale === "ar") return ` مع ${teacher}`;
  if (locale === "so") return ` macallin ${teacher}`;
  if (locale === "ti") return ` ምስ ${teacher}`;
  return ` med ${teacher}`;
}

function placeSuffix(place?: string) {
  return place ? `, ${place}` : "";
}

function bookingText(
  locale: SupportedLocale,
  template: BookingTemplate,
  parts: BookingParts,
) {
  const teacher = teacherSuffix(locale, parts.teacher);
  const place = placeSuffix(parts.place);
  const time = parts.time;

  if (template === "booking_confirmed") {
    const deadline = parts.deadline
      ? locale === "en"
        ? ` Cancel until ${parts.deadline}.`
        : locale === "ar"
          ? ` يمكن الإلغاء حتى ${parts.deadline}.`
          : locale === "so"
            ? ` Waad baajin kartaa ilaa ${parts.deadline}.`
            : locale === "ti"
              ? ` ክሳብ ${parts.deadline} ክትስርዝ ትኽእል።`
              : ` Kan avbokas fram till ${parts.deadline}.`
      : "";
    if (locale === "en") return `Your lesson is booked ${time}${teacher}${place}.${deadline}`;
    if (locale === "ar") return `درس القيادة محجوز ${time}${teacher}${place}.${deadline}`;
    if (locale === "so") return `Casharka waa la qabtay ${time}${teacher}${place}.${deadline}`;
    if (locale === "ti") return `ትምህርትኻ ተመዝጊቡ ${time}${teacher}${place}.${deadline}`;
    return `Din körlektion är bokad ${time}${teacher}${place}.${deadline}`;
  }

  if (template === "booking_reminder_24h") {
    const phone = parts.schoolPhone
      ? locale === "en"
        ? ` Questions? Call ${parts.schoolPhone}.`
        : locale === "ar"
          ? ` أسئلة؟ اتصل ${parts.schoolPhone}.`
          : locale === "so"
            ? ` Su'aalo? Wac ${parts.schoolPhone}.`
            : locale === "ti"
              ? ` ሕቶ? ደውል ${parts.schoolPhone}.`
              : ` Frågor? Ring ${parts.schoolPhone}.`
      : "";
    if (locale === "en") return `Reminder: lesson ${time}${teacher}${place}.${phone}`;
    if (locale === "ar") return `تذكير: درس ${time}${teacher}${place}.${phone}`;
    if (locale === "so") return `Xusuusin: cashar ${time}${teacher}${place}.${phone}`;
    if (locale === "ti") return `መዘኻኸሪ፦ ትምህርቲ ${time}${teacher}${place}.${phone}`;
    return `Påminnelse: körlektion ${time}${teacher}${place}.${phone}`;
  }

  if (template === "booking_moved") {
    if (locale === "en") return `Your lesson was moved to ${time}${teacher}${place}.`;
    if (locale === "ar") return `نُقل الدرس إلى ${time}${teacher}${place}.`;
    if (locale === "so") return `Casharka waxaa loo raray ${time}${teacher}${place}.`;
    if (locale === "ti") return `ትምህርትኻ ናብ ${time}${teacher}${place} ተቐይሩ።`;
    return `Din körlektion är flyttad till ${time}${teacher}${place}.`;
  }

  if (template === "booking_cancelled_by_student") {
    if (locale === "en") return `Your lesson ${time} was cancelled.`;
    if (locale === "ar") return `أُلغي الدرس ${time}.`;
    if (locale === "so") return `Casharka ${time} waa la baajiyay.`;
    if (locale === "ti") return `ትምህርቲ ${time} ተሰሪዙ።`;
    return `Din körlektion ${time} har avbokats.`;
  }

  if (template === "booking_cancelled_by_teacher") {
    const refund = parts.creditRefunded
      ? locale === "en"
        ? " Your credit has been refunded."
        : locale === "ar"
          ? " تمت إعادة رصيدك."
          : locale === "so"
            ? " Dhibcahaaga waa laguu celiyay."
            : locale === "ti"
              ? " ክሬዲትካ ተመሊሱ።"
              : " Din kredit har återbetalats."
      : "";
    if (locale === "en") return `The school cancelled your lesson ${time}.${refund}`;
    if (locale === "ar") return `ألغت المدرسة الدرس ${time}.${refund}`;
    if (locale === "so") return `Dugsigu wuu baajiyay casharka ${time}.${refund}`;
    if (locale === "ti") return `ቤት ትምህርቲ ትምህርቲ ${time} ሰሪዝዎ።${refund}`;
    return `Trafikskolan har avbokat din körlektion ${time}.${refund}`;
  }

  if (template === "teacher_booking_new") {
    const student = parts.student ?? "";
    if (locale === "en") return `New lesson ${time}: ${student}${place}. See the teacher portal.`;
    if (locale === "ar") return `درس جديد ${time}: ${student}${place}. انظر بوابة المعلم.`;
    if (locale === "so") return `Cashar cusub ${time}: ${student}${place}. Eeg albaabka macallinka.`;
    if (locale === "ti") return `ሓድሽ ትምህርቲ ${time}: ${student}${place}. ናይ መምህር ፖርታል ርአ።`;
    return `Ny lektion ${time}: ${student}${place}. Se lärarportalen.`;
  }

  if (template === "teacher_booking_cancelled") {
    const student = parts.student ?? "";
    if (locale === "en") return `Cancelled lesson ${time} with ${student}.`;
    if (locale === "ar") return `درس ملغى ${time} مع ${student}.`;
    if (locale === "so") return `Cashar la baajiyay ${time} oo leh ${student}.`;
    if (locale === "ti") return `ዝተሰረዘ ትምህርቲ ${time} ምስ ${student}።`;
    return `Avbokad lektion ${time} med ${student}.`;
  }

  const student = parts.student ?? "";
  const previous = parts.previousTime ? ` (${locale === "sv" ? "tidigare" : locale === "en" ? "was" : locale === "ar" ? "سابقًا" : locale === "so" ? "hore" : "ቅድሚ"} ${parts.previousTime})` : "";
  if (locale === "en") return `Changed lesson: ${student}, now ${time}${previous}${place}.`;
  if (locale === "ar") return `درس معدّل: ${student}، الآن ${time}${previous}${place}.`;
  if (locale === "so") return `Cashar la beddelay: ${student}, hadda ${time}${previous}${place}.`;
  if (locale === "ti") return `ዝተቐየረ ትምህርቲ፦ ${student}፣ ሕጂ ${time}${previous}${place}።`;
  return `Ändrad lektion: ${student}, nu ${time}${previous}${place}.`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderBookingMessage(input: {
  template: BookingTemplate;
  locale: string;
  startsAt: Date;
  cancellationDeadline?: Date;
  previousStartsAt?: Date;
  studentFirstName?: string;
  teacherFirstName?: string;
  placeLabel?: string;
  schoolPhone?: string;
  creditRefunded?: boolean;
}) {
  const locale = supportedLocale(input.locale);
  const text = bookingText(locale, input.template, {
    time: formatLessonTime(input.startsAt, locale),
    deadline: input.cancellationDeadline
      ? formatLessonTime(input.cancellationDeadline, locale)
      : undefined,
    previousTime: input.previousStartsAt
      ? formatLessonTime(input.previousStartsAt, locale)
      : undefined,
    student: clean(input.studentFirstName),
    teacher: clean(input.teacherFirstName),
    place: clean(input.placeLabel),
    schoolPhone: clean(input.schoolPhone),
    creditRefunded: input.creditRefunded,
  }).replace(/\s+/g, " ").replace(" .", ".").trim();

  return {
    subject: subjects[locale][input.template],
    text,
    html: `<p dir="${locale === "ar" ? "rtl" : "ltr"}">${escapeHtml(text)}</p>`,
  };
}
