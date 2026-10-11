import { existsSync } from "node:fs";
import { join } from "node:path";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { isLocale, type Locale } from "@/i18n/routing";
import {
  bookingEnabled,
  instructorsEnabled,
  theoryMode,
  theoryNavVisible,
  theorySalesOpen,
} from "@/lib/launch";
import {
  formatLanguageList,
  offeredTeachingLanguagesFrom,
} from "@/lib/company/staff";
import { benefitItems } from "@/lib/home/benefits";
import { googleMapsBrowserConfig } from "@/lib/maps/config";
import { activeTeacherLanguages } from "@/lib/teachers/query";
import { nextFreeSlots } from "@/lib/bookings/availability";
import { formatLessonDateTime } from "@/lib/format/datetime";
import { formatPrice } from "@/lib/pricing/format";
import { freeTheoryQuestionCount } from "@/lib/theory/questions";

import { BenefitsSection } from "./_components/BenefitsSection";
import { FaqSection, type FaqItem } from "./_components/FaqSection";
import { HomeHero } from "./_components/HomeHero";
import { PickupSection } from "./_components/PickupSection";
import { QuickLinksSection } from "./_components/QuickLinksSection";
import { TeachersMapSection } from "./_components/TeachersMapSection";
import { TheoryTeaserSection } from "./_components/TheoryTeaserSection";
import { getLocations, getProducts, getTeachers } from "./_lib/data";

export const dynamic = "force-dynamic";

export default async function MarketingHome(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = params.locale;
  if (!isLocale(locale)) return null;
  setRequestLocale(locale);
  return (
    <>
      <HomeHero locale={locale} />
      <HomeBelow locale={locale} />
    </>
  );
}

async function HomeBelow({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const [products, teachers, locations, freeQuestions, activeLanguages] = await Promise.all([
    getProducts(locale),
    getTeachers(locale),
    getLocations(),
    freeTheoryQuestionCount(),
    activeTeacherLanguages(),
  ]);
  const nextFree = await nextFreeSlots(
    teachers.slice(0, 4).map((teacher) => teacher.id),
    new Date(),
  );
  const offeredLanguages = offeredTeachingLanguagesFrom(activeLanguages);
  const offeredLanguageNames = formatLanguageList(
    offeredLanguages,
    locale,
    (code) => t(`shell.languagePage.${code}`),
  );
  const theoryLanguageNames = new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  }).format(
    (["sv", "en", "ti", "ar"] as const).map((code) =>
      t(`shell.languagePage.${code}`),
    ),
  );
  const canBook = bookingEnabled();
  const showInstructors = instructorsEnabled() && teachers.length > 0;
  const activeProducts = products.filter((product) => product.active);
  const hasRisk1 = activeProducts.some((product) => product.includesRisk1);
  const hasRisk2 = activeProducts.some((product) => product.includesRisk2);
  const benefitCards = benefitItems({
    bookingEnabled: canBook,
    products,
    hasPickupArea: locations.some(
      (location) =>
        location.status === "ACTIVE" && Boolean(location.boundary),
    ),
    hasRiskCourse: hasRisk1 && hasRisk2,
  }).map((item) => ({
    id: item.id,
    size: item.size,
    title: t(`home.benefits.${item.id}.title`),
    body:
      item.id === "language"
        ? t("home.benefits.language.body", {
            languages: offeredLanguageNames,
          })
        : t(`home.benefits.${item.id}.body`),
  }));
  const theoryProduct = activeProducts.find((product) => product.slug === "korkortsteori");
  const singleLesson = activeProducts.find((product) => product.slug === "en-korlektion");
  const entryPackage = activeProducts
    .filter((product) => product.kind === "PACKAGE")
    .sort((a, b) => a.priceOre - b.priceOre)[0];
  const homeMapMarkers = teachers.flatMap((teacher) =>
    teacher.locations.map(({ location }, index) => ({
      id: `${teacher.id}-${index}`,
      teacherId: teacher.id,
      title: `${teacher.user.firstName} ${teacher.user.lastName}`,
      position: { lat: location.lat, lng: location.lng },
      photoUrl: teacher.photoUrl,
      languages: teacher.languages.map((language) => t(`shell.languagePage.${language}`)),
      transmission: teacher.transmissions
        .map((item) => t(`teacher.transmission.${item.toLowerCase()}`))
        .join(", "),
      locationName: location.name,
    })),
  );
  const homeMapCenter = homeMapMarkers[0]?.position ?? {
    lat: 59.3293,
    lng: 18.0686,
  };
  const mapsConfig = googleMapsBrowserConfig();
  const pickupImageExists = existsSync(join(process.cwd(), "public", "images", "pickup-feature.png"));
  const pickupAreas = locations
    .filter(
      (location) =>
        location.status === "ACTIVE" && Boolean(location.boundary),
    )
    .slice(0, 2)
    .map((location) => ({
      id: location.id,
      name: location.name,
      boundary: location.boundary,
      marker: { lat: location.lat, lng: location.lng },
    }));
  const faqItems: FaqItem[] = [
    ...(singleLesson && entryPackage
      ? [{
          question: t("home.faq.cost.question"),
          answer: t("home.faq.cost.answer", {
            singlePrice: formatPrice(singleLesson.priceOre, locale),
            packagePrice: formatPrice(entryPackage.priceOre, locale),
          }),
        }]
      : []),
    ...(["languages", "pickup", "cancel", "late", "risk", "validity"] as const).map((key) => {
      const answer =
        key === "cancel" && !canBook
          ? (t.raw("home.faq.cancel.answerPhone") as string)
          : key === "languages"
            ? t("home.faq.languages.answer", {
                languages: offeredLanguageNames,
              })
            : t(`home.faq.${key}.answer`);
      return {
        question: t(`home.faq.${key}.question`),
        answer,
        content:
          key === "cancel" && !canBook
            ? t("home.faq.cancel.answerPhone")
            : answer,
      };
    }),
  ];
  const teacherCards = teachers.slice(0, 4).map((teacher) => ({
    id: teacher.id,
    name: `${teacher.user.firstName} ${teacher.user.lastName}`,
    photoUrl: teacher.photoUrl,
    languages: teacher.languages.map((language) => t(`shell.languagePage.${language}`)),
    transmissions: teacher.transmissions.map((transmission) =>
      t(`teacher.transmission.${transmission.toLowerCase()}`),
    ),
    locationNames: teacher.locations.map(({ location }) => location.name),
    experienceLabel:
      teacher.yearsExperience > 0
        ? t("teacher.yearsExperience", {
            count: teacher.yearsExperience,
            n: String(teacher.yearsExperience),
          })
        : "",
    nextFreeTime: nextFree.get(teacher.id)
      ? formatLessonDateTime(nextFree.get(teacher.id)!, locale)
      : undefined,
    swedishOnly: teacher.swedishOnly,
  }));
  const theoryIsFree = theoryMode() === "free";
  const theorySalesAreOpen = theorySalesOpen();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <BenefitsSection label={t("home.benefits.label")} items={benefitCards} />
      <QuickLinksSection
        locale={locale}
        eyebrow={t("home.quick.eyebrow")}
        title={t("home.quick.title")}
        links={([
          ["lessons", "korlektioner"],
          ["courses", "kurser"],
          ...(showInstructors ? [["teachers", "larare"] as const] : []),
          ["contact", "kontakt"],
        ] as const).map(([key, href]) => ({
          key,
          href,
          label: t(`home.quick.${key}`),
        }))}
      />
      <PickupSection
        eyebrow={t("home.pickup.eyebrow")}
        title={t("home.pickup.title")}
        description={t("home.pickup.description")}
        areasLabel={t("home.pickup.areas")}
        imageAlt={t("home.pickup.imageAlt")}
        mapLabel={t("home.pickup.mapLabel")}
        imageExists={pickupImageExists}
        pickupAreas={pickupAreas}
      />
      {showInstructors ? (
        <TeachersMapSection
          locale={locale}
          canBook={canBook}
          eyebrow={t("home.teachers.eyebrow")}
          title={t("home.teachers.title")}
          description={t("home.teachers.description")}
          languageLabel={t("home.teachers.languageLabel")}
          offeredLanguages={offeredLanguages}
          languageNames={Object.fromEntries(
            offeredLanguages.map((language) => [
              language,
              t(`shell.languagePage.${language}`),
            ]),
          )}
          teachers={teacherCards}
          nextFreeLabel={t("teacher.nextFree")}
          swedishOnlyLabel={t("common.swedishOnly")}
          mapTitle={t("map.homeTeaserTitle")}
          mapDescription={t("map.homeTeaserDescription")}
          mapPrivacy={t("shell.mapPrivacy")}
          mapCta={t("map.homeTeaserCta")}
          mapLabel={t("map.interactiveLabel")}
          unavailableTitle={t("map.unavailableTitle")}
          unavailableDescription={t("map.unavailableDescription")}
          mapsConfig={mapsConfig}
          mapCenter={homeMapCenter}
          mapMarkers={homeMapMarkers}
        />
      ) : null}
      {theoryNavVisible() && freeQuestions > 0 ? (
        <TheoryTeaserSection
          locale={locale}
          eyebrow={t("theory.teaser.eyebrow")}
          title={t("theory.teaser.title")}
          description={
            theoryIsFree
              ? t("theory.teaser.freeDescription")
              : freeQuestions > 0
                ? t("theory.teaser.description")
                : t("home.theory.comingSoon")
          }
          features={(["categories", "practice", "languages"] as const)
            .filter((item) => freeQuestions > 0 || item !== "practice")
            .map((item) => ({
              id: item,
              label:
                item === "languages"
                  ? t("theory.teaser.features.languages", {
                      languages: theoryLanguageNames,
                    })
                  : t(`theory.teaser.features.${item}`),
            }))}
          tryFreeLabel={t("theory.teaser.tryFree")}
          buyLabel={t("theory.teaser.buy")}
          pendingLabel={t("theory.teaser.pending")}
          oneTimeLabel={t("theory.teaser.oneTime")}
          freeQuestions={freeQuestions}
          salesOpen={theorySalesAreOpen}
          freeMode={theoryIsFree}
          theoryProduct={
            theoryProduct
              ? {
                  active: theoryProduct.active,
                  formattedPrice: formatPrice(theoryProduct.priceOre, locale),
                }
              : undefined
          }
        />
      ) : null}
      <FaqSection
        eyebrow={t("home.faq.eyebrow")}
        title={t("home.faq.title")}
        items={faqItems}
      />
    </>
  );
}
