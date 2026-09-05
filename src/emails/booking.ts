export type BookingTemplate =
  | "booking_confirmed"
  | "booking_cancelled_by_student"
  | "booking_cancelled_by_teacher"
  | "booking_reminder_24h";

type SupportedLocale = "sv" | "en" | "ti" | "ar" | "so";

type BookingMessage = {
  subject: string;
  text: (lessonTime: string, cancellationDeadline?: string) => string;
};

const messages: Record<
  SupportedLocale,
  Record<BookingTemplate, BookingMessage>
> = {
  sv: {
    booking_confirmed: {
      subject: "Din körlektion är bokad",
      text: (time, deadline) =>
        `Din körlektion är bokad ${time}. Kan avbokas fram till ${deadline}.`,
    },
    booking_cancelled_by_student: {
      subject: "Din körlektion är avbokad",
      text: (time) => `Din körlektion ${time} har avbokats.`,
    },
    booking_cancelled_by_teacher: {
      subject: "Trafikskolan har avbokat din körlektion",
      text: (time) =>
        `Trafikskolan har avbokat din körlektion ${time}. Din kredit har återbetalats.`,
    },
    booking_reminder_24h: {
      subject: "Påminnelse om din körlektion",
      text: (time) => `Påminnelse: din körlektion börjar ${time}.`,
    },
  },
  en: {
    booking_confirmed: {
      subject: "Your driving lesson is booked",
      text: (time, deadline) =>
        `Your driving lesson is booked for ${time}. You can cancel until ${deadline}.`,
    },
    booking_cancelled_by_student: {
      subject: "Your driving lesson is cancelled",
      text: (time) => `Your driving lesson at ${time} has been cancelled.`,
    },
    booking_cancelled_by_teacher: {
      subject: "The driving school cancelled your lesson",
      text: (time) =>
        `The driving school cancelled your lesson at ${time}. Your credit has been refunded.`,
    },
    booking_reminder_24h: {
      subject: "Driving lesson reminder",
      text: (time) => `Reminder: your driving lesson starts at ${time}.`,
    },
  },
  ti: {
    booking_confirmed: {
      subject: "ናይ ምዝዋር ትምህርትኻ ተመዝጊቡ",
      text: (time, deadline) =>
        `ናይ ምዝዋር ትምህርትኻ ${time} ተመዝጊቡ። ክሳብ ${deadline} ክትስርዞ ትኽእል።`,
    },
    booking_cancelled_by_student: {
      subject: "ናይ ምዝዋር ትምህርትኻ ተሰሪዙ",
      text: (time) => `ናይ ${time} ምዝዋር ትምህርትኻ ተሰሪዙ።`,
    },
    booking_cancelled_by_teacher: {
      subject: "ቤት ትምህርቲ ምዝዋር ትምህርትኻ ሰሪዝዎ",
      text: (time) =>
        `ቤት ትምህርቲ ናይ ${time} ትምህርትኻ ሰሪዝዎ። ክሬዲትካ ተመሊሱ።`,
    },
    booking_reminder_24h: {
      subject: "መዘኻኸሪ ናይ ምዝዋር ትምህርቲ",
      text: (time) => `መዘኻኸሪ፦ ናይ ምዝዋር ትምህርትኻ ${time} ይጅምር።`,
    },
  },
  ar: {
    booking_confirmed: {
      subject: "تم حجز درس القيادة",
      text: (time, deadline) =>
        `تم حجز درس القيادة في ${time}. يمكنك الإلغاء حتى ${deadline}.`,
    },
    booking_cancelled_by_student: {
      subject: "تم إلغاء درس القيادة",
      text: (time) => `تم إلغاء درس القيادة في ${time}.`,
    },
    booking_cancelled_by_teacher: {
      subject: "ألغت مدرسة القيادة الدرس",
      text: (time) =>
        `ألغت مدرسة القيادة الدرس في ${time}. تمت إعادة الرصيد إليك.`,
    },
    booking_reminder_24h: {
      subject: "تذكير بدرس القيادة",
      text: (time) => `تذكير: يبدأ درس القيادة في ${time}.`,
    },
  },
  so: {
    booking_confirmed: {
      subject: "Casharka wadista waa la qabtay",
      text: (time, deadline) =>
        `Casharka wadista waxaa la qabtay ${time}. Waad baajin kartaa ilaa ${deadline}.`,
    },
    booking_cancelled_by_student: {
      subject: "Casharka wadista waa la baajiyay",
      text: (time) => `Casharka wadista ee ${time} waa la baajiyay.`,
    },
    booking_cancelled_by_teacher: {
      subject: "Dugsiga wadista ayaa baajiyay casharka",
      text: (time) =>
        `Dugsiga wadista ayaa baajiyay casharka ${time}. Dhibcahaaga waa laguu celiyay.`,
    },
    booking_reminder_24h: {
      subject: "Xusuusin casharka wadista",
      text: (time) => `Xusuusin: casharka wadista wuxuu bilaabmaa ${time}.`,
    },
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
  return locale in messages ? (locale as SupportedLocale) : "sv";
}

function formatLessonTime(date: Date, locale: SupportedLocale) {
  return new Intl.DateTimeFormat(localeTags[locale], {
    timeZone: "Europe/Stockholm",
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
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
}) {
  const locale = supportedLocale(input.locale);
  const template = messages[locale][input.template];
  const time = formatLessonTime(input.startsAt, locale);
  const deadline = input.cancellationDeadline
    ? formatLessonTime(input.cancellationDeadline, locale)
    : undefined;
  const text = template.text(time, deadline);

  return {
    subject: template.subject,
    text,
    html: `<p dir="${locale === "ar" ? "rtl" : "ltr"}">${escapeHtml(text)}</p>`,
  };
}
