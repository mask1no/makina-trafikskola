import { describe, expect, it } from "vitest";

import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import so from "../../../messages/so.json";
import sv from "../../../messages/sv.json";
import ti from "../../../messages/ti.json";

import {
  COMING_SOON_TEACHING_LANGUAGES,
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
  it("always includes the standing facts and omits products that do not exist", () => {
    expect(benefitItems({ bookingEnabled: false, products: [lesson] }).map((item) => item.id)).toEqual([
      "language",
      "pickup",
    ]);
  });

  it("adds risk and guarantee only from real products and never a test lesson", () => {
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
    expect(items.at(-1)?.id).toBe("selfBook");
  });

  it("derives teaching claims from translated language names", () => {
    const catalogues = { sv, en, ti, ar, so } as const;
    for (const locale of Object.keys(catalogues) as (keyof typeof catalogues)[]) {
      const messages = catalogues[locale];
      const languageName = (code: keyof typeof messages.language) =>
        messages.language[code];
      const offered = formatLanguageList(
        offeredTeachingLanguages(),
        locale,
        languageName,
      );
      const comingSoon = formatLanguageList(
        COMING_SOON_TEACHING_LANGUAGES,
        locale,
        languageName,
      );
      expect(offered).not.toContain(languageName("ar"));
      expect(offered).not.toContain(languageName("so"));
      expect(comingSoon).toBe(languageName("so"));
      expect(messages.home.benefits.language.body).toContain("{languages}");
      expect(messages.home.benefits.language.body).toContain("{comingSoonLanguages}");
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
