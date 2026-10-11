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
  kind: "SINGLE_LESSON",
  priceOre: 79900,
  includesRisk1: false,
  includesRisk2: false,
};

describe("benefitItems", () => {
  it("always returns the eight confirmed public benefits", () => {
    expect(benefitItems({ bookingEnabled: false, products: [lesson] }).map((item) => item.id)).toEqual([
      "language",
      "pickup",
      "lesson",
      "risk",
      "guarantee",
      "payment",
      "reminder",
      "cancel",
    ]);
  });

  it("does not let catalogue contents change the confirmed benefits", () => {
    const items = benefitItems({
      bookingEnabled: true,
      hasRiskCourse: false,
      products: [
        lesson,
        { kind: "TEST_LESSON", priceOre: 50000, includesRisk1: false, includesRisk2: false },
        { kind: "PACKAGE", priceOre: 1, includesRisk1: true, includesRisk2: false },
        { kind: "GUARANTEE", priceOre: 2, includesRisk1: false, includesRisk2: false },
      ],
    });
    expect(items.map((item) => item.id).join(" ")).not.toContain("testLesson");
    expect(items.map((item) => item.id)).toContain("risk");
    expect(items.map((item) => item.id)).toContain("guarantee");
    expect(items).toHaveLength(8);
  });

  it("uses the confirmed Swedish benefit and pickup copy", () => {
    expect(sv.home.benefits.pickup).toEqual({
      title: "Gratis upphämtning",
      body: "Farsta & Upplands Väsby",
    });
    expect(sv.home.benefits.risk).toEqual({
      title: "Riskutbildning",
      body: "Båda riskutbildningarna hos oss",
    });
    expect(sv.home.benefits.guarantee).toEqual({
      title: "Körkortsgaranti",
      body: "Kör tills du klarar",
    });
    expect(sv.home.benefits.payment.title).toBe("Kort/Swish/Klarna");
    expect(sv.home.benefits.reminder.title).toBe("Sms-påminnelse dagen före");
    expect(sv.home.benefits.cancel.title).toBe("Avboka senast 24 h före");
    expect(sv.home.pickup.description).toContain("Gratis upphämtning");
    expect(sv.home.faq.pickup.answer).toContain("gratis upphämtning");
    expect(sv.booking.step.pickup.free).toContain("Gratis upphämtning");
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
