import { getTranslations } from "next-intl/server";

import { Card } from "@/components/Card";
import { CallButton, MailButton } from "@/components/ContactButtons";
import { OpeningStatus } from "@/components/OpeningStatus";
import { displayPhone } from "@/lib/format/phone";

export async function QuestionsBlock({
  phone,
  email,
}: {
  phone: string;
  email: string;
}) {
  const [shell, contact] = await Promise.all([
    getTranslations("shell"),
    getTranslations("contact"),
  ]);
  const now = new Date().toISOString();

  return (
    <section className="mt-10">
      <h2 className="text-h3 font-black">{shell("questions")}</h2>
      <div className="mt-6 grid items-stretch gap-4 md:grid-cols-2">
        <Card className="flex h-full flex-col" padding="lg">
          <h3 className="text-h3 font-black">{shell("callUs")}</h3>
          <p className="mt-4 text-2xl font-black leading-tight">
            <bdi dir="ltr" className="numbers-ltr">
              {displayPhone(phone)}
            </bdi>
          </p>
          <div className="mt-5">
            <OpeningStatus initialNow={now} />
          </div>
          <CallButton phone={phone} size="hero" className="mt-auto w-full">
            {shell("callUs")}
          </CallButton>
        </Card>
        <Card className="flex h-full flex-col" padding="lg">
          <h3 className="text-h3 font-black">{contact("emailUs")}</h3>
          <p className="mt-4 break-all text-2xl font-black leading-tight">
            {email}
          </p>
          <p className="mt-4 max-w-[70ch] leading-7">{contact("replyLine")}</p>
          <MailButton email={email} size="hero" className="mt-auto w-full">
            {shell("mailUs")}
          </MailButton>
        </Card>
      </div>
    </section>
  );
}
