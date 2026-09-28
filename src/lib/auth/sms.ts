import { sendSmsMessage } from "@/lib/sms/client";

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
  return sendSmsMessage({
    to: phone,
    message: `Makina: ${code}`,
  });
}
