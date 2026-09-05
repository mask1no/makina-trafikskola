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
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <p className="text-sm font-bold text-ink-muted">{t("eyebrow")}</p>
      <h1 className="mt-2 text-3xl font-black">{t("title")}</h1>
      <div className="mt-6 rounded-md border border-border bg-card p-6">
        <dl className="mb-6 grid gap-2 border-b border-border pb-5">
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
      <Link
        href={statusPath}
        className="mt-5 inline-flex min-h-11 items-center font-bold underline"
      >
        {t("viewStatus")}
      </Link>
    </main>
  );
}
