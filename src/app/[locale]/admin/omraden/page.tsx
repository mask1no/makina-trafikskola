import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";

import { AreasEditor } from "./AreasEditor";

export const dynamic = "force-dynamic";

export default async function AreasPage() {
  const [t, areas] = await Promise.all([
    getTranslations("admin.editor"),
    db.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader title={t("areasTitle")} />
      <AreasEditor
        areas={areas.map((area) => ({
          id: area.id,
          name: area.name,
          status: area.status,
          officeAddress: area.officeAddress ?? "",
          boundary: JSON.stringify(area.boundary ?? { type: "Polygon", coordinates: [] }, null, 2),
        }))}
      />
    </div>
  );
}
