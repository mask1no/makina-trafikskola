import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";

import { QuestionsBlock } from "@/components/QuestionsBlock";

import { auth } from "@/auth";
import { googleSignInEnabled } from "@/lib/auth/google";
import { googleMapsBrowserConfig } from "@/lib/maps/config";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/pricing/format";
import { bookingEnabled } from "@/lib/launch";
import { notFound } from "next/navigation";
import { orderedTeacherIds } from "@/lib/teachers/query";

import { BookingFlow } from "./BookingFlow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function configuredCancellationHours() {
  const value = Number(process.env.CANCELLATION_WINDOW_HOURS ?? "24");
  return Number.isFinite(value) && value >= 0 ? value : 24;
}

export default async function BookingPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ teacher?: string }>;
  }
) {
  await connection();
  const searchParams = await props.searchParams;
  const params = await props.params;
  const mapsConfig = googleMapsBrowserConfig();
  if (!isLocale(params.locale)) notFound();
  if (!bookingEnabled()) notFound();
  const shell = await getTranslations({ locale: params.locale, namespace: "shell" });
  const company = await getTranslations({ locale: params.locale, namespace: "company" });

  const session = await auth();
  const preferredLanguages =
    session?.user?.role === "STUDENT"
      ? (
          await db.studentProfile.findUnique({
            where: { userId: session.user.id },
            select: { preferredLanguages: true },
          })
        )?.preferredLanguages
      : undefined;
  const [products, locations, orderedIds] = await Promise.all([
    db.product.findMany({
      where: { active: true, kind: { in: ["SINGLE_LESSON", "PACKAGE"] } },
      orderBy: { sortOrder: "asc" },
      include: { translations: true },
    }),
    db.location.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        status: true,
        officeAddress: true,
        lat: true,
        lng: true,
        boundary: true,
      },
    }),
    orderedTeacherIds({ languages: preferredLanguages }),
  ]);
  const unorderedTeachers = orderedIds.length
    ? await db.teacherProfile.findMany({
      where: { id: { in: orderedIds.map(({ id }) => id) } },
      select: {
        id: true,
        languages: true,
        transmissions: true,
        user: { select: { firstName: true, lastName: true } },
        locations: { select: { locationId: true } },
      },
    })
    : [];
  const teacherById = new Map(unorderedTeachers.map((teacher) => [teacher.id, teacher]));
  const teachers = orderedIds.flatMap(({ id }) => {
    const teacher = teacherById.get(id);
    return teacher ? [teacher] : [];
  });

  const localized = products.flatMap((product) => {
    const translation =
      product.translations.find((item) => item.locale === params.locale) ??
      product.translations.find((item) => item.locale === "sv") ??
      product.translations[0];
    if (!translation) return [];
    return [{ product, name: translation.name }];
  });
  const localizedProducts = localized
    .filter((item) => item.product.kind === "SINGLE_LESSON")
    .map((item) => ({
      id: item.product.id,
      kind: "SINGLE_LESSON" as const,
      active: item.product.active,
      lessonMinutes: item.product.lessonMinutes,
      name: item.name,
      priceLabel: formatPrice(item.product.priceOre, params.locale),
    }));
  const packages = localized
    .filter((item) => item.product.kind === "PACKAGE")
    .map((item) => ({
      name: item.name,
      priceLabel: formatPrice(item.product.priceOre, params.locale),
      href: `/${params.locale}/paket/${item.product.slug}`,
    }));
  const initialTeacherId = teachers.some(
    (teacher) => teacher.id === searchParams.teacher,
  )
    ? searchParams.teacher
    : undefined;

  return (
    <div className="site-container max-w-5xl overflow-x-clip py-4 md:py-12">
      <BookingFlow
        locale={params.locale}
        products={localizedProducts}
        packages={packages}
        locations={locations.map((location) => ({
          ...location,
          status: location.status,
          boundary: location.boundary,
        }))}
        teachers={teachers.map((teacher) => ({
          id: teacher.id,
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          languages: teacher.languages,
          transmissions: teacher.transmissions,
          locationIds: teacher.locations.map((item) => item.locationId),
          markers: teacher.locations.map(({ locationId }) => {
            const location = locations.find((item) => item.id === locationId);
            return location
              ? { lat: location.lat, lng: location.lng }
              : null;
          }).filter((marker): marker is { lat: number; lng: number } => Boolean(marker)),
        }))}
        initialTeacherId={initialTeacherId}
        googleEnabled={googleSignInEnabled()}
        initiallyAuthenticated={
          session?.user?.role === "STUDENT" && Boolean(session.user.id)
        }
        cancellationWindowHours={configuredCancellationHours()}
        mapApiKey={mapsConfig.apiKey}
      />
      <QuestionsBlock
        title={shell("questions")}
        callLabel={shell("callUs")}
        phone={company("phone")}
        email={company("email")}
      />
    </div>
  );
}
