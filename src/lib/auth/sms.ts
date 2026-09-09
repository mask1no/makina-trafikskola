type SendOtpSmsInput = {
  phone: string;
  code: string;
};

/**
 * Sends an OTP SMS via 46elks.
 * @returns true when a message was accepted by the provider;
 *          false when delivery was intentionally skipped (local/dev without credentials).
 */
export async function sendOtpSms({
  phone,
  code,
}: SendOtpSmsInput): Promise<boolean> {
  const username = process.env.ELKS_API_USERNAME;
  const password = process.env.ELKS_API_PASSWORD;

  if (!username || !password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMS_PROVIDER_NOT_CONFIGURED");
    }
    return false;
  }

  const body = new URLSearchParams({
    from: "Makina",
    to: phone,
    message: `Makina: ${code}`,
  });

  const response = await fetch("https://api.46elks.com/a1/sms", {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error("SMS_DELIVERY_FAILED");
  }

  return true;
}
