import { permanentRedirect } from "next/navigation";
import { isLocale } from "@/i18n/routing";

export default async function TeacherDetailPage(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) permanentRedirect("/sv/larare");
  permanentRedirect(`/${params.locale}/larare`);
}
