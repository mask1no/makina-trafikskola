import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

function templateKey(template: string) {
  switch (template) {
    case "booking_confirmed":
      return "bookingConfirmed" as const;
    case "booking_cancelled_by_student":
      return "bookingCancelledByStudent" as const;
    case "booking_cancelled_by_teacher":
      return "bookingCancelledByTeacher" as const;
    case "booking_reminder_24h":
      return "bookingReminder" as const;
    case "order_receipt":
      return "paymentReceipt" as const;
    case "payment_failed":
      return "paymentFailed" as const;
    case "lesson_payment_needs_rebooking":
      return "lessonPaymentNeedsRebooking" as const;
    case "course_payment_needs_rebooking":
      return "coursePaymentNeedsRebooking" as const;
    default:
      return "generic" as const;
  }
}

export default async function MessagesPage(
  props: { params: Promise<{ locale: string }> },
) {
  const { locale } = await props.params;
  const session = await auth();
  const [t, notifications] = await Promise.all([
    getTranslations("student.messages"),
    db.notification.findMany({
      where: { userId: session!.user.id },
      orderBy: [{ sendAfter: "desc" }, { id: "desc" }],
      take: 50,
      select: {
        id: true,
        template: true,
        channel: true,
        sendAfter: true,
        sentAt: true,
      },
    }),
  ]);
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Stockholm",
  });

  return (
    <section>
      <h1 className="text-3xl font-black">{t("title")}</h1>
      <p className="mt-2 text-ink-muted">{t("description")}</p>
      {notifications.length ? (
        <ul className="mt-6 grid gap-3">
          {notifications.map((notification) => (
            <li key={notification.id} className="rounded-md border border-border bg-card p-5">
              {(() => {
                const key = templateKey(notification.template);
                return (
                  <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-bold">
                  {t(`templates.${key}`)}
                </p>
                <span className="rounded-full bg-page px-3 py-1 text-xs font-semibold">
                  {t(`channels.${notification.channel}`)}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                {formatter.format(notification.sentAt ?? notification.sendAfter)}
                {" · "}
                {notification.sentAt ? t("sent") : t("scheduled")}
              </p>
                    {key === "lessonPaymentNeedsRebooking" ||
                    key === "coursePaymentNeedsRebooking" ? (
                      <p className="mt-2 text-sm">
                        {t(`bodies.${key}`)}
                      </p>
                    ) : null}
                  </>
                );
              })()}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-md border border-border bg-card p-6 text-ink-muted">
          {t("empty")}
        </p>
      )}
      {notifications.length === 50 ? (
        <p className="mt-4 text-sm text-ink-muted">{t("limited")}</p>
      ) : null}
    </section>
  );
}
