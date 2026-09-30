import type { Metadata } from "next";
import { connection } from "next/server";

import { auth } from "@/auth";
import { googleSignInEnabled } from "@/lib/auth/google";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
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
  if (!isLocale(params.locale)) notFound();
  if (!bookingEnabled()) notFound();

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
      where: { kind: { in: ["SINGLE_LESSON", "TEST_LESSON"] } },
      orderBy: { sortOrder: "asc" },
      include: { translations: true },
    }),
    db.location.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
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

  const localizedProducts = products.flatMap((product) => {
    const translation =
      product.translations.find((item) => item.locale === params.locale) ??
      product.translations.find((item) => item.locale === "sv") ??
      product.translations[0];
    if (!translation) return [];
    return [
      {
        id: product.id,
        kind: product.kind as "SINGLE_LESSON" | "TEST_LESSON",
        active: product.active,
        lessonMinutes: product.lessonMinutes,
        name: translation.name,
      },
    ];
  });
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
        locations={locations}
        teachers={teachers.map((teacher) => ({
          id: teacher.id,
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          languages: teacher.languages,
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
        mapApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}
      />
    </div>
  );
}
