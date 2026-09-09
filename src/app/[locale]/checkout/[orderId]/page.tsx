import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/pricing/format";
import { getStripe, stripeIsConfigured } from "@/lib/stripe";

import { StripePaymentElement } from "./StripePaymentElement";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  locale: z.enum(["sv", "en", "ti", "ar", "so"]),
  orderId: z.string().cuid(),
});

function absoluteStatusUrl(locale: string, orderId: string) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let origin = "http://localhost:3000";
  try {
    origin = new URL(configured).origin;
  } catch {
    // Local fallback is intentional; production configuration is checked below.
  }
  return new URL(
    `/${encodeURIComponent(locale)}/mina-sidor/betalningar/${encodeURIComponent(orderId)}`,
    origin,
  ).toString();
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/${parsed.data.locale}/logga-in?callbackUrl=${encodeURIComponent(`/${parsed.data.locale}/checkout/${parsed.data.orderId}`)}`,
    );
  }
  if (session.user.role !== "STUDENT") redirect(`/${parsed.data.locale}`);

  const [t, order] = await Promise.all([
    getTranslations("checkout"),
    db.order.findFirst({
      where: {
        id: parsed.data.orderId,
        studentId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        totalOre: true,
        vatOre: true,
        payment: {
          select: {
            status: true,
            amountOre: true,
            stripePaymentIntentId: true,
          },
        },
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
  if (!order?.payment) notFound();

  const statusPath = `/${parsed.data.locale}/mina-sidor/betalningar/${order.id}`;
  const production = process.env.NODE_ENV === "production";
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const configured = stripeIsConfigured() && Boolean(publishableKey);
  let clientSecret: string | null = null;
  let unavailable = false;

  if (
    configured &&
    order.status === "PENDING" &&
    order.payment.status !== "SUCCEEDED" &&
    order.payment.stripePaymentIntentId
  ) {
    try {
      const intent = await getStripe().paymentIntents.retrieve(
        order.payment.stripePaymentIntentId,
      );
      if (
        intent.metadata.orderId !== order.id ||
        intent.amount !== order.totalOre ||
        order.payment.amountOre !== order.totalOre
      ) {
        unavailable = true;
      } else {
        clientSecret = intent.client_secret;
      }
    } catch {
      unavailable = true;
    }
  } else if (production) {
    unavailable = true;
  }

  const mock =
    !production &&
    (!configured || !order.payment.stripePaymentIntentId);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink-muted">{t("eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 leading-7 text-ink-muted">{t("description")}</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-lg border border-border bg-card p-5 shadow-card sm:p-8" aria-labelledby="payment-title">
        <h2 id="payment-title" className="text-xl font-black">{t("paymentTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{t("secureDescription")}</p>
        <div className="mt-6 border-t border-border pt-6">
        {clientSecret ? (
          <StripePaymentElement
            clientSecret={clientSecret}
            returnUrl={absoluteStatusUrl(parsed.data.locale, order.id)}
          />
        ) : null}
        {mock ? (
          <div role="status" className="rounded-sm bg-page p-4">
            <p className="font-bold">{t("mockTitle")}</p>
            <p className="mt-2 text-sm text-ink-muted">
              {t("mockDescription")}
            </p>
          </div>
        ) : null}
        {unavailable ? (
          <p role="alert" className="rounded-sm border border-danger p-4 text-danger">
            {t("unavailable")}
          </p>
        ) : null}
        {order.status !== "PENDING" || order.payment.status === "SUCCEEDED" ? (
          <p role="status">{t("alreadyProcessed")}</p>
        ) : null}
        </div>
      </section>
      <aside className="border-s border-border ps-0 lg:sticky lg:top-24 lg:ps-8">
        <div className="p-0 sm:p-0">
        <h2 className="text-lg font-black">{t("summaryTitle")}</h2>
        <ul className="mt-4 grid gap-4 border-b border-border pb-5">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
              <span><strong className="block">{item.productNameSnapshot}</strong><span className="text-ink-muted">{t("quantity", { quantity: item.quantity })}</span></span>
              <span className="shrink-0 font-bold" dir="ltr">{formatPrice(item.unitPriceOre * item.quantity, parsed.data.locale)}</span>
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
        <p className="mt-5 border-t border-border pt-5 text-sm leading-6 text-ink-muted">{t("reassurance")}</p>
        </div>
      </aside>
      </div>
      <Link
        href={statusPath}
        className="mt-6 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
      >
        {t("viewStatus")}
      </Link>
    </main>
  );
}
