import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/PageHeader";
import { getAvailableCreditBalance } from "@/lib/credits/ledger";
import { db } from "@/lib/db";

import { requireStudent } from "../_lib";
import { ProfileSettings } from "./ProfileSettings";

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
        passwordHash: true,
        googleSub: true,
      },
    }),
  ]);
  if (!student) return null;

  const credits = await getAvailableCreditBalance(db, studentId, new Date());

  return (
    <section>
      <PageHeader title={t("title")} description={t("settingsDescription")} />
      <ProfileSettings
        initial={{
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          localePref: student.localePref,
          hasPassword: Boolean(student.passwordHash),
          googleLinked: Boolean(student.googleSub),
          unusedLessonCredits: credits.balance,
        }}
      />
    </section>
  );
}
