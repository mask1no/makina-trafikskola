import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { formatPrice } from "@/lib/pricing/format";

import { requireStudent } from "../../_lib";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  locale: z.string().min(2).max(5),
  orderId: z.string().cuid(),
});

export default async function PaymentStatusPage(
  props: {
    params: Promise<{ locale: string; orderId: string }>;
  }
) {
  const params = await props.params;
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) notFound();

  const studentId = await requireStudent(parsed.data.locale);
  const [t, order] = await Promise.all([
    getTranslations("student.payments"),
    db.order.findFirst({
      where: {
        id: parsed.data.orderId,
        studentId,
      },
      include: {
        payment: true,
        items: {
          select: {
            id: true,
            productNameSnapshot: true,
            quantity: true,
            unitPriceOre: true,
          },
        },
      },
    }),
  ]);
  if (!order) notFound();

  const latePaymentNotice =
    order.status === "PAID" &&
    order.payment?.status === "SUCCEEDED" &&
    order.payment.refundedOre === 0
      ? await db.notification.findFirst({
          where: {
            userId: studentId,
            template: {
              in: [
                "lesson_payment_needs_rebooking",
                "course_payment_needs_rebooking",
              ],
            },
            payload: {
              path: ["orderId"],
              equals: order.id,
            },
          },
          select: { template: true },
        })
      : null;
  const rebookingKind =
    latePaymentNotice?.template === "lesson_payment_needs_rebooking"
      ? "lesson"
      : latePaymentNotice?.template ===
          "course_payment_needs_rebooking"
        ? "course"
        : null;

  const canRetry =
    order.status === "PENDING" &&
    Boolean(order.payment?.stripePaymentIntentId) &&
    order.payment?.status !== "SUCCEEDED";

  return (
    <section>
      <p className="text-sm font-bold text-ink-muted">{t("eyebrow")}</p>
      <h1 className="mt-2 text-3xl font-black">{t("title")}</h1>
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="font-bold">
          {t("orderStatus", {
            status: t(`statuses.${order.status}`),
          })}
        </p>
        <ul className="mt-6 grid gap-4">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4"
            >
              <div>
                <p className="font-bold">{item.productNameSnapshot}</p>
                <p className="text-sm text-ink-muted">
                  {t("quantity", { quantity: item.quantity })}
                </p>
              </div>
              <span dir="ltr">
                {formatPrice(
                  item.unitPriceOre * item.quantity,
                  parsed.data.locale,
                )}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 grid gap-2">
          <div className="flex justify-between gap-4">
            <dt>{t("total")}</dt>
            <dd className="font-black" dir="ltr">
              {formatPrice(order.totalOre, parsed.data.locale)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-sm text-ink-muted">
            <dt>{t("vat")}</dt>
            <dd dir="ltr">
              {formatPrice(order.vatOre, parsed.data.locale)}
            </dd>
          </div>
        </dl>
      </div>
      {rebookingKind ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-accent bg-card p-5"
        >
          <h2 className="text-xl font-black">
            {t(`late.${rebookingKind}.title`)}
          </h2>
          <p className="mt-2 text-ink-muted">
            {t(`late.${rebookingKind}.description`)}
          </p>
          <Link
            href={`/${parsed.data.locale}/${rebookingKind === "lesson" ? "boka" : "kurser"}`}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-accent px-5 font-bold text-accent-ink"
          >
            {t(`late.${rebookingKind}.action`)}
          </Link>
        </div>
      ) : null}
      {canRetry ? (
        <div className="mt-6 rounded-xl border border-border bg-page p-5">
          <p>{t("retryDescription")}</p>
          <Link
            href={`/${parsed.data.locale}/checkout/${order.id}`}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-accent px-5 font-bold text-accent-ink"
          >
            {t("retry")}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
