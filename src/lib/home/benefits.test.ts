import { describe, expect, it } from "vitest";

import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import sv from "../../../messages/sv.json";
import ti from "../../../messages/ti.json";

import {
  formatLanguageList,
  offeredTeachingLanguages,
} from "@/lib/company/staff";
import { benefitItems } from "./benefits";

const lesson = {
  active: true,
  kind: "SINGLE_LESSON",
  priceOre: 49900,
  includesRisk1: false,
  includesRisk2: false,
};

describe("benefitItems", () => {
  it("returns the core benefit set without optional service cards", () => {
    expect(benefitItems({ bookingEnabled: false, products: [lesson] }).map((item) => item.id)).toEqual([
      "language",
      "lesson",
      "payment",
      "cancel",
      "validity",
      "reminder",
    ]);
  });

  it("adds pickup and risk when those services are available", () => {
    const items = benefitItems({
      bookingEnabled: true,
      hasPickupArea: true,
      hasRiskCourse: true,
      products: [
        lesson,
        { active: false, kind: "TEST_LESSON", priceOre: 50000, includesRisk1: false, includesRisk2: false },
        { active: true, kind: "PACKAGE", priceOre: 1, includesRisk1: true, includesRisk2: false },
        { active: true, kind: "GUARANTEE", priceOre: 2, includesRisk1: false, includesRisk2: false },
      ],
    });
    expect(items.map((item) => item.id).join(" ")).not.toContain("testLesson");
    expect(items.map((item) => item.id).join(" ")).not.toContain("guarantee");
    expect(items.map((item) => item.id)).toEqual([
      "language",
      "pickup",
      "lesson",
      "payment",
      "cancel",
      "validity",
      "risk",
      "reminder",
    ]);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(items).toHaveLength(8);
  });

  it("does not advertise risk when no risk product exists", () => {
    const items = benefitItems({
      bookingEnabled: false,
      products: [
        lesson,
        { active: false, kind: "GUARANTEE", priceOre: 2, includesRisk1: true, includesRisk2: true },
      ],
    });
    expect(items.map((item) => item.id)).not.toContain("risk");
  });

  it("uses the confirmed Swedish benefit and pickup copy", () => {
    expect(sv.home.benefits.pickup).toEqual({
      title: "Gratis upphämtning",
      body: "Farsta & Upplands Väsby",
    });
    expect(sv.home.benefits.risk).toEqual({
      title: "Riskettan hos oss",
      body: "Teoretisk riskutbildning hos oss",
    });
    expect(sv.home.benefits.validity).toEqual({
      title: "Gäller i 12 månader",
      body: "Körlektioner och paket gäller i 12 månader från köpet.",
    });
    expect(sv.home.benefits.payment.title).toBe("Kort, Swish och Klarna");
    expect(sv.home.benefits.payment.titleSwishSoon).toBe("Kort och Klarna (Swish kommer snart)");
    expect(sv.home.benefits.reminder.title).toBe("Sms-påminnelse dagen före");
    expect(sv.home.benefits.cancel.title).toBe("Avboka senast 24 h före");
    expect(sv.home.pickup.description.toLowerCase()).toContain("gratis");
    expect(sv.home.faq.pickup.answer.toLowerCase()).toContain("gratis");
    expect(sv.booking.step.pickup.free.toLowerCase()).toContain("gratis");
    expect(sv.booking.step.pickup.free.toLowerCase()).toContain(
      "ingen tid från din lektion",
    );
  });

  it("derives teaching claims from translated language names", () => {
    const catalogues = { sv, en, ti, ar } as const;
    for (const locale of Object.keys(catalogues) as (keyof typeof catalogues)[]) {
      const messages = catalogues[locale];
      const languageName = (code: keyof typeof messages.language) =>
        messages.language[code];
      const offered = formatLanguageList(
        offeredTeachingLanguages(),
        locale,
        languageName,
      );
      expect(offered).not.toContain(languageName("ar"));
      expect(messages.home.benefits.language.body).toContain("{languages}");
      expect(messages.home.faq.languages.answer).toContain("{languages}");
      expect(messages.theory.teaser.features.languages).toContain("{languages}");
      expect(messages.contact.languagesBody).toContain("{languages}");
      expect(messages.shell.languageHelpDescription).toContain("{languages}");
    }
  });

  it("states the 24-hour cancellation rule", () => {
    expect(sv.home.benefits.cancel.body).toContain("senast 24 timmar före lektionen");
    expect(sv.home.benefits.cancel.body).toContain("fullt pris");
    expect(sv.home.faq.late.question).toBe("Vad händer om jag kommer sent?");
    expect(sv.home.faq.late.answer).toBe("Lektionen avslutas på ordinarie sluttid.");
  });
});
