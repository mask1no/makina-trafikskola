import { redirect } from "next/navigation";

export default async function KurserRedirect(
  props: { params: Promise<{ locale: string }> },
) {
  const { locale } = await props.params;
  redirect(`/${locale}/priser#courses`);
}
