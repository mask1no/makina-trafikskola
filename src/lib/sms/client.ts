import * as Sentry from "@sentry/nextjs";

type SmsMessage = {
  to: string;
  message: string;
};

export async function sendSmsMessage({
  to,
  message,
}: SmsMessage): Promise<boolean> {
  const username = process.env.ELKS_API_USERNAME;
  const password = process.env.ELKS_API_PASSWORD;

  if (!username || !password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMS_PROVIDER_NOT_CONFIGURED");
    }
    return false;
  }

  const response = await fetch("https://api.46elks.com/a1/sms", {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      from: "Makina",
      to,
      message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    Sentry.captureMessage("46elks SMS failed", {
      level: "error",
      extra: { status: response.status, error: errorText.slice(0, 300) },
    });
    throw new Error("SMS_DELIVERY_FAILED");
  }

  return true;
}
