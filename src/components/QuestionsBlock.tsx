import { Card } from "@/components/Card";
import { displayPhone, telHref } from "@/lib/format/phone";

export function QuestionsBlock({
  title,
  callLabel,
  phone,
  email,
}: {
  title: string;
  callLabel: string;
  phone: string;
  email: string;
}) {
  return (
    <Card className="mt-8">
      <p className="font-black">{title}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a
          href={telHref(phone)}
          className="inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-5 text-small font-bold text-accent-ink"
        >
          {callLabel}{" "}
          <bdi dir="ltr" className="numbers-ltr">
            {displayPhone(phone)}
          </bdi>
        </a>
        <a
          href={`mailto:${email}`}
          className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border px-5 text-small font-bold"
        >
          <bdi dir="ltr">{email}</bdi>
        </a>
      </div>
    </Card>
  );
}
