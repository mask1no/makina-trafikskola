import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { formatStockholm } from "@/lib/format/datetime";
import { db } from "@/lib/db";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

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
    case "booking_moved":
      return "bookingMoved" as const;
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
      where: { userId: session!.user.id, channel: "INAPP" },
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
  const formatSent = (date: Date) =>
    formatStockholm(date, locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <section>
      <PageHeader title={t("title")} description={t("description")} />
      {notifications.length ? (
        <ul className="mt-6 overflow-hidden rounded-md border border-border bg-card shadow-soft">
          {notifications.map((notification) => (
            <li key={notification.id} className="border-b border-border p-5 last:border-b-0">
              {(() => {
                const key = templateKey(notification.template);
                return (
                  <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-bold">
                  {t(`templates.${key}`)}
                </p>
                <Badge tone={notification.sentAt ? "success" : "neutral"}>
                  {t(`channels.${notification.channel}`)}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                {formatSent(notification.sentAt ?? notification.sendAfter)}
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
        <div className="mt-6"><EmptyState title={t("empty")} description={t("description")} /></div>
      )}
      {notifications.length === 50 ? (
        <p className="mt-4 text-sm text-ink-muted">{t("limited")}</p>
      ) : null}
    </section>
  );
}
