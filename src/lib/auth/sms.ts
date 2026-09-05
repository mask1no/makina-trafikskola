type SendOtpSmsInput = {
  phone: string;
  code: string;
};

export async function sendOtpSms({ phone, code }: SendOtpSmsInput) {
  const username = process.env.ELKS_API_USERNAME;
  const password = process.env.ELKS_API_PASSWORD;

  if (!username || !password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMS_PROVIDER_NOT_CONFIGURED");
    }
    return;
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
}
