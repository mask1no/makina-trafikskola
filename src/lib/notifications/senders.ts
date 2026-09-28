import { sendSmsMessage } from "@/lib/sms/client";

export async function sendSms(to: string, text: string) {
  await sendSmsMessage({ to, message: text });
}
