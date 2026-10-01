import { z } from "zod";

import { formatPrice } from "../lib/pricing/format";

const receiptItemSchema = z
  .object({
    productName: z.string().trim().min(1).max(500),
    quantity: z.number().int().min(1).max(100),
  })
  .strict();

export const orderReceiptPayloadSchema = z
  .object({
    orderId: z.string().cuid(),
    items: z.array(receiptItemSchema).min(1).max(100),
    totalOre: z.number().int().nonnegative(),
    vatOre: z.number().int().nonnegative(),
    statusUrl: z.string().url().optional(),
  })
  .strict();

export const paymentFailedPayloadSchema = z
  .object({
    orderId: z.string().cuid(),
    resumeUrl: z.string().url(),
  })
  .strict();

export const courseRebookingPayloadSchema = z
  .object({
    orderId: z.string().cuid(),
    coursesUrl: z.string().url(),
  })
  .strict();

export const lessonRebookingPayloadSchema = z
  .object({
    orderId: z.string().cuid(),
    bookingUrl: z.string().url(),
  })
  .strict();

export type OrderReceiptPayload = z.infer<
  typeof orderReceiptPayloadSchema
>;
export type PaymentFailedPayload = z.infer<
  typeof paymentFailedPayloadSchema
>;

type SupportedLocale = "sv" | "en" | "ti" | "ar" | "so";

type PaymentCopy = {
  receiptSubject: string;
  receiptTitle: string;
  quantity: (quantity: number) => string;
  total: string;
  vat: string;
  viewOrder: string;
  failedSubject: string;
  failedTitle: string;
  failedBody: string;
  resume: string;
  lessonRebookingSubject: string;
  lessonRebookingTitle: string;
  lessonRebookingBody: string;
  chooseLesson: string;
  courseRebookingSubject: string;
  courseRebookingTitle: string;
  courseRebookingBody: string;
  chooseCourse: string;
};

const copy: Record<SupportedLocale, PaymentCopy> = {
  sv: {
    receiptSubject: "Kvitto från Makina Trafikskola",
    receiptTitle: "Tack för ditt köp",
    quantity: (quantity) => `Antal: ${quantity}`,
    total: "Totalt",
    vat: "Varav moms",
    viewOrder: "Visa beställningen",
    failedSubject: "Betalningen kunde inte genomföras",
    failedTitle: "Betalningen misslyckades",
    failedBody:
      "Din beställning väntar fortfarande. Öppna länken för att försöka betala igen.",
    resume: "Fortsätt till betalningen",
    lessonRebookingSubject: "Välj en ny tid för din körlektion",
    lessonRebookingTitle: "Betalningen lyckades – välj en ny tid",
    lessonRebookingBody:
      "Din 15-minutersreservation hann löpa ut innan betalningen blev klar. Lektionen finns kvar som en oanvänd kredit exakt en gång. Den gamla tiden har inte återtagits.",
    chooseLesson: "Boka en ny lektionstid",
    courseRebookingSubject: "Välj ett nytt kurstillfälle",
    courseRebookingTitle: "Betalningen lyckades – välj ett nytt kurstillfälle",
    courseRebookingBody:
      "Din 15-minutersreservation hann löpa ut innan betalningen blev klar. Köpet finns kvar som en oanvänd kursrättighet exakt en gång. Den gamla platsen har inte återtagits.",
    chooseCourse: "Välj ett nytt kurstillfälle",
  },
  en: {
    receiptSubject: "Receipt from Makina Trafikskola",
    receiptTitle: "Thank you for your purchase",
    quantity: (quantity) => `Quantity: ${quantity}`,
    total: "Total",
    vat: "Including VAT",
    viewOrder: "View order",
    failedSubject: "Your payment could not be completed",
    failedTitle: "Payment failed",
    failedBody:
      "Your order is still pending. Open the link to try the payment again.",
    resume: "Continue to payment",
    lessonRebookingSubject: "Choose a new driving lesson time",
    lessonRebookingTitle: "Payment succeeded – choose a new time",
    lessonRebookingBody:
      "Your 15-minute reservation expired before payment completed. The lesson remains available exactly once as an unused credit. The old time was not reclaimed.",
    chooseLesson: "Book a new lesson time",
    courseRebookingSubject: "Choose another course occasion",
    courseRebookingTitle: "Payment succeeded – choose another course occasion",
    courseRebookingBody:
      "Your 15-minute reservation expired before payment completed. The purchase remains available exactly once as an unused course entitlement. The old seat was not reclaimed.",
    chooseCourse: "Choose another course occasion",
  },
  ti: {
    receiptSubject: "ካብ Makina Trafikskola ቅብሊት",
    receiptTitle: "ንዕድጊኻ የቐንየልና",
    quantity: (quantity) => `ብዝሒ፦ ${quantity}`,
    total: "ጠቕላላ",
    vat: "ካብዚ ተወሳኺ እሴት ግብሪ",
    viewOrder: "ትእዛዝ ርአ",
    failedSubject: "ክፍሊትካ ክዛዘም ኣይከኣለን",
    failedTitle: "ክፍሊት ኣይተዓወተን",
    failedBody:
      "ትእዛዝካ ገና ይጽበ ኣሎ። ክፍሊት እንደገና ንምፍታን ነቲ መራኸቢ ክፈት።",
    resume: "ናብ ክፍሊት ቀጽል",
    lessonRebookingSubject: "ንመምሃሪ ምዝዋር ሓድሽ ግዜ ምረጽ",
    lessonRebookingTitle: "ክፍሊት ተዓዊቱ – ሓድሽ ግዜ ምረጽ",
    lessonRebookingBody:
      "እቲ ናይ 15 ደቒቕ ቦታ ምሓዝ ክፍሊት ቅድሚ ምዝዛሙ ግዜኡ ሓሊፉ። እታ ትምህርቲ ከም ዘይተጠቐምካላ ክረዲት ሓንሳብ ጥራይ ትቕጽል። እቲ ናይ ቀደም ግዜ ኣይተመልሰን።",
    chooseLesson: "ሓድሽ ናይ ትምህርቲ ግዜ ሓዝ",
    courseRebookingSubject: "ካልእ ናይ ኮርስ ግዜ ምረጽ",
    courseRebookingTitle: "ክፍሊት ተዓዊቱ – ካልእ ናይ ኮርስ ግዜ ምረጽ",
    courseRebookingBody:
      "እቲ ናይ 15 ደቒቕ ቦታ ምሓዝ ክፍሊት ቅድሚ ምዝዛሙ ግዜኡ ሓሊፉ። ዕድጊኻ ከም ዘይተጠቐምካሉ መሰል ኮርስ ሓንሳብ ጥራይ ይቕጽል። እቲ ናይ ቀደም ቦታ ኣይተመልሰን።",
    chooseCourse: "ካልእ ኮርስ ምረጽ",
  },
  ar: {
    receiptSubject: "إيصال من مدرسة ماكينا لتعليم القيادة",
    receiptTitle: "شكرًا لشرائك",
    quantity: (quantity) => `الكمية: ${quantity}`,
    total: "الإجمالي",
    vat: "منها ضريبة القيمة المضافة",
    viewOrder: "عرض الطلب",
    failedSubject: "تعذر إتمام عملية الدفع",
    failedTitle: "فشلت عملية الدفع",
    failedBody:
      "لا يزال طلبك قيد الانتظار. افتح الرابط لمحاولة الدفع مرة أخرى.",
    resume: "المتابعة إلى الدفع",
    lessonRebookingSubject: "اختر موعدًا جديدًا لدرس القيادة",
    lessonRebookingTitle: "نجح الدفع – اختر موعدًا جديدًا",
    lessonRebookingBody:
      "انتهت مهلة الحجز البالغة 15 دقيقة قبل اكتمال الدفع. بقي الدرس متاحًا مرة واحدة بالضبط كرصيد غير مستخدم. لم نستعد الموعد القديم.",
    chooseLesson: "احجز موعد درس جديدًا",
    courseRebookingSubject: "اختر موعد دورة آخر",
    courseRebookingTitle: "نجح الدفع – اختر موعد دورة آخر",
    courseRebookingBody:
      "انتهت مهلة الحجز البالغة 15 دقيقة قبل اكتمال الدفع. بقي الشراء متاحًا مرة واحدة بالضبط كاستحقاق دورة غير مستخدم. لم نستعد المقعد القديم.",
    chooseCourse: "اختر موعد دورة آخر",
  },
  so: {
    receiptSubject: "Rasiid ka yimid Makina Trafikskola",
    receiptTitle: "Waad ku mahadsan tahay iibsigaaga",
    quantity: (quantity) => `Tirada: ${quantity}`,
    total: "Wadarta",
    vat: "Waxaa ku jira VAT",
    viewOrder: "Eeg dalabka",
    failedSubject: "Lacag-bixinta lama dhammaystiri karin",
    failedTitle: "Lacag-bixintu way fashilantay",
    failedBody:
      "Dalabkaagu weli wuu sugayaa. Fur xiriirinta si aad mar kale lacag u bixiso.",
    resume: "Sii wad lacag-bixinta",
    lessonRebookingSubject: "Dooro waqti cusub oo casharka wadista ah",
    lessonRebookingTitle: "Lacag-bixintu way guulaysatay – dooro waqti cusub",
    lessonRebookingBody:
      "Qabsashadii 15-ka daqiiqo ahayd way dhacday ka hor inta lacag-bixintu dhammaan. Casharku wuxuu kuu ahaanayaa hal mar oo keliya deyn aan la isticmaalin. Waqtigii hore dib looma qabsan.",
    chooseLesson: "Qabso waqti cashar cusub",
    courseRebookingSubject: "Dooro waqti koorso kale",
    courseRebookingTitle: "Lacag-bixintu way guulaysatay – dooro koorso kale",
    courseRebookingBody:
      "Qabsashadii 15-ka daqiiqo ahayd way dhacday ka hor inta lacag-bixintu dhammaan. Iibsigu wuxuu kuu ahaanayaa hal mar oo keliya xaq koorso oo aan la isticmaalin. Kursigii hore dib looma qabsan.",
    chooseCourse: "Dooro waqti koorso kale",
  },
};

function supportedLocale(locale: string): SupportedLocale {
  return locale in copy ? (locale as SupportedLocale) : "sv";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wrapHtml(locale: SupportedLocale, body: string) {
  return `<div dir="${locale === "ar" ? "rtl" : "ltr"}">${body}</div>`;
}

export function renderOrderReceipt(input: {
  locale: string;
  payload: OrderReceiptPayload;
}) {
  const locale = supportedLocale(input.locale);
  const payload = orderReceiptPayloadSchema.parse(input.payload);
  const message = copy[locale];
  const itemLines = payload.items.map(
    (item) => `${item.productName} — ${message.quantity(item.quantity)}`,
  );
  const total = formatPrice(payload.totalOre, locale);
  const vat = formatPrice(payload.vatOre, locale);
  const text = [
    message.receiptTitle,
    "",
    ...itemLines,
    "",
    `${message.total}: ${total}`,
    `${message.vat}: ${vat}`,
    ...(payload.statusUrl
      ? ["", `${message.viewOrder}: ${payload.statusUrl}`]
      : []),
  ].join("\n");
  const itemsHtml = payload.items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.productName)}</strong><br>${escapeHtml(message.quantity(item.quantity))}</li>`,
    )
    .join("");

  return {
    subject: message.receiptSubject,
    text,
    html: wrapHtml(
      locale,
      `<h1>${escapeHtml(message.receiptTitle)}</h1><ul>${itemsHtml}</ul><p><strong>${escapeHtml(message.total)}:</strong> ${escapeHtml(total)}</p><p><strong>${escapeHtml(message.vat)}:</strong> ${escapeHtml(vat)}</p>${payload.statusUrl ? `<p><a href="${escapeHtml(payload.statusUrl)}">${escapeHtml(message.viewOrder)}</a></p>` : ""}`,
    ),
  };
}

export function renderPaymentFailed(input: {
  locale: string;
  payload: PaymentFailedPayload;
}) {
  const locale = supportedLocale(input.locale);
  const payload = paymentFailedPayloadSchema.parse(input.payload);
  const message = copy[locale];
  const text = [
    message.failedTitle,
    "",
    message.failedBody,
    "",
    `${message.resume}: ${payload.resumeUrl}`,
  ].join("\n");

  return {
    subject: message.failedSubject,
    text,
    html: wrapHtml(
      locale,
      `<h1>${escapeHtml(message.failedTitle)}</h1><p>${escapeHtml(message.failedBody)}</p><p><a href="${escapeHtml(payload.resumeUrl)}">${escapeHtml(message.resume)}</a></p>`,
    ),
  };
}

export function renderCourseRebooking(input: {
  locale: string;
  payload: z.infer<typeof courseRebookingPayloadSchema>;
}) {
  const locale = supportedLocale(input.locale);
  const payload = courseRebookingPayloadSchema.parse(input.payload);
  const message = copy[locale];
  return {
    subject: message.courseRebookingSubject,
    text: [
      message.courseRebookingTitle,
      "",
      message.courseRebookingBody,
      "",
      `${message.chooseCourse}: ${payload.coursesUrl}`,
    ].join("\n"),
    html: wrapHtml(
      locale,
      `<h1>${escapeHtml(message.courseRebookingTitle)}</h1><p>${escapeHtml(message.courseRebookingBody)}</p><p><a href="${escapeHtml(payload.coursesUrl)}">${escapeHtml(message.chooseCourse)}</a></p>`,
    ),
  };
}

export function renderLessonRebooking(input: {
  locale: string;
  payload: z.infer<typeof lessonRebookingPayloadSchema>;
}) {
  const locale = supportedLocale(input.locale);
  const payload = lessonRebookingPayloadSchema.parse(input.payload);
  const message = copy[locale];
  return {
    subject: message.lessonRebookingSubject,
    text: [
      message.lessonRebookingTitle,
      "",
      message.lessonRebookingBody,
      "",
      `${message.chooseLesson}: ${payload.bookingUrl}`,
    ].join("\n"),
    html: wrapHtml(
      locale,
      `<h1>${escapeHtml(message.lessonRebookingTitle)}</h1><p>${escapeHtml(message.lessonRebookingBody)}</p><p><a href="${escapeHtml(payload.bookingUrl)}">${escapeHtml(message.chooseLesson)}</a></p>`,
    ),
  };
}
