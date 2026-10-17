import { redirect } from "next/navigation";

export default async function KorlektionerRedirect(
  props: { params: Promise<{ locale: string }> },
) {
  const { locale } = await props.params;
  redirect(`/${locale}/priser#single`);
}
