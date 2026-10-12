import { sendSmsMessage } from "@/lib/sms/client";

type SendOtpSmsInput = {
  phone: string;
  code: string;
  locale?: string;
};

const OTP_MESSAGES: Record<string, (code: string) => string> = {
  sv: (code) => `Makina: din kod är ${code}`,
  en: (code) => `Makina: your code is ${code}`,
  ti: (code) => `Makina: ኮድካ ${code} እዩ`,
  ar: (code) => `Makina: رمزك هو ${code}`,
};

/**
 * Sends an OTP SMS via 46elks.
 * @returns true when a message was accepted by the provider;
 *          false when delivery was intentionally skipped (local/dev without credentials).
 */
export async function sendOtpSms({
  phone,
  code,
  locale = "sv",
}: SendOtpSmsInput): Promise<boolean> {
  const formatter = OTP_MESSAGES[locale] ?? OTP_MESSAGES.sv;
  return sendSmsMessage({
    to: phone,
    message: formatter(code),
  });
}
