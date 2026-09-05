import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { formatPrice } from "@/lib/pricing/format";
import { LinkButton } from "@/components/LinkButton";
import { Notice } from "@/components/Notice";

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
  const statusTone =
    order.status === "PAID"
      ? "border-success bg-success-soft"
      : order.status === "FAILED"
        ? "border-danger bg-danger-soft"
        : order.status === "PENDING"
          ? "border-accent bg-accent-soft"
          : "border-border-strong bg-card-muted";

  return (
    <section className="mx-auto max-w-4xl">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink-muted">{t("eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
      <div className={`mt-6 rounded-lg border p-5 sm:p-6 ${statusTone}`} role="status">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-muted">{t("eyebrow")}</p>
        <p className="mt-1 text-2xl font-black">{t(`statuses.${order.status}`)}</p>
        <p className="mt-2 text-sm text-ink-muted">{t("orderStatus", { status: t(`statuses.${order.status}`) })}</p>
      </div>
      <div className="mt-6 rounded-lg border border-border bg-card p-5 shadow-card sm:p-8">
        <h2 className="text-xl font-black">{t("title")}</h2>
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
        <Notice className="mt-6" tone="success">
          <div>
          <h2 className="text-xl font-black">
            {t(`late.${rebookingKind}.title`)}
          </h2>
          <p className="mt-2 text-ink-muted">
            {t(`late.${rebookingKind}.description`)}
          </p>
          <LinkButton
            href={`/${parsed.data.locale}/${rebookingKind === "lesson" ? "boka" : "kurser"}`}
            className="mt-4"
          >
            {t(`late.${rebookingKind}.action`)}
          </LinkButton>
          </div>
        </Notice>
      ) : null}
      {canRetry ? (
        <Notice className="mt-6">
          <div>
          <p>{t("retryDescription")}</p>
          <LinkButton
            href={`/${parsed.data.locale}/checkout/${order.id}`}
            className="mt-4"
          >
            {t("retry")}
          </LinkButton>
          </div>
        </Notice>
      ) : null}
    </section>
  );
}
