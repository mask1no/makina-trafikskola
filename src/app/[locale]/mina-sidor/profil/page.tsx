import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";

import { requireStudent } from "../_lib";
import { AccountPrivacyControls } from "./AccountPrivacyControls";

export const dynamic = "force-dynamic";

export default async function ProfilePage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const studentId = await requireStudent(params.locale);
  const [t, student] = await Promise.all([
    getTranslations("student.profile"),
    db.user.findUnique({
      where: { id: studentId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        localePref: true,
        studentProfile: {
          select: {
            korkortstillstand: true,
            preferredLanguages: true,
            preferredTransmission: true,
            defaultPickupAddress: true,
          },
        },
      },
    }),
  ]);
  if (!student) return null;

  const fields = [
    [t("name"), `${student.firstName} ${student.lastName}`],
    [t("email"), student.email ?? t("missing")],
    [t("phone"), student.phone ?? t("missing")],
    [t("language"), student.localePref.toUpperCase()],
    [
      t("permit"),
      t(`permitStatuses.${student.studentProfile?.korkortstillstand ?? "UNKNOWN"}`),
    ],
    [
      t("transmission"),
      student.studentProfile?.preferredTransmission
        ? t(`transmissions.${student.studentProfile.preferredTransmission}`)
        : t("missing"),
    ],
    [
      t("pickup"),
      student.studentProfile?.defaultPickupAddress ?? t("missing"),
    ],
  ];

  return (
    <section>
      <PageHeader title={t("title")} />
      <dl className="mt-6 divide-y divide-border rounded-md border border-border bg-card px-5">
        {fields.map(([label, value]) => (
          <div className="grid gap-1 py-4 sm:grid-cols-3" key={label}>
            <dt className="text-sm font-bold text-ink-muted">{label}</dt>
            <dd className="sm:col-span-2">{value}</dd>
          </div>
        ))}
      </dl>
      <AccountPrivacyControls locale={params.locale} />
    </section>
  );
}
