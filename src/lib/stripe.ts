import Stripe from "stripe";

let stripe: Stripe | undefined;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
  }

  stripe ??= new Stripe(secretKey, {
    typescript: true,
  });
  return stripe;
}

export function stripeIsConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_SECRET_KEY !== "sk_test_local_only",
  );
}
