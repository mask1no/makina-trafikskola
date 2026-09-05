import { Resend } from "resend";

type Message = {
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(to: string, message: Message) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
    }
    return;
  }

  const result = await new Resend(apiKey).emails.send({
    from,
    to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  if (result.error) {
    throw new Error("EMAIL_DELIVERY_FAILED");
  }
}

export async function sendSms(to: string, text: string) {
  const username = process.env.ELKS_API_USERNAME;
  const password = process.env.ELKS_API_PASSWORD;

  if (!username || !password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMS_PROVIDER_NOT_CONFIGURED");
    }
    return;
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
      message: text,
    }),
  });

  if (!response.ok) {
    throw new Error("SMS_DELIVERY_FAILED");
  }
}
