import { Card } from "@/components/Card";
import { CallButton, MailButton } from "@/components/ContactButtons";

export function QuestionsBlock({
  title,
  callLabel,
  mailLabel,
  phone,
  email,
}: {
  title: string;
  callLabel: string;
  mailLabel: string;
  phone: string;
  email: string;
}) {
  return (
    <Card className="mt-8">
      <p className="font-black">{title}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <CallButton phone={phone}>{callLabel}</CallButton>
        <MailButton email={email}>{mailLabel}</MailButton>
      </div>
    </Card>
  );
}
