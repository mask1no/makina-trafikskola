import { getTranslations } from "next-intl/server";

import { LocationCards } from "@/app/[locale]/admin/LocationCards";
import { PageHeader } from "@/components/PageHeader";
import { locationSummaries } from "@/lib/admin/place-query";

export const dynamic = "force-dynamic";

export default async function AdminPlacesPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const [t, locations] = await Promise.all([
    getTranslations("admin.places"),
    locationSummaries(),
  ]);

  return (
    <section>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <div className="mt-6">
        <LocationCards
          locale={params.locale}
          locations={locations}
          teachersLabel={(count) => t("teachers", { count })}
          bookingsLabel={(count) => t("bookings", { count })}
          detailsLabel={t("viewDetails")}
        />
      </div>
    </section>
  );
}
