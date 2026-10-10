import { describe, expect, it } from "vitest";

import { TEACHING_LANGUAGES } from "@/lib/teachers/languages";

import {
  formatLanguageList,
  offeredTeachingLanguages,
  offeredTeachingLanguagesFrom,
  publicStaff,
  staffMemberLanguages,
} from "./staff";

describe("public staff languages", () => {
  it("gives every staff member at least one confirmed teaching language", () => {
    expect(publicStaff.length).toBeGreaterThan(0);
    for (const member of publicStaff) {
      expect(member.languages.length).toBeGreaterThan(0);
      for (const language of member.languages) {
        expect(TEACHING_LANGUAGES).toContain(language);
      }
    }
  });

  it("lists languages in the page locale", () => {
    const aron = publicStaff.find((member) => member.name === "Aron Kessete");
    expect(aron).toBeTruthy();
    expect(
      formatLanguageList(
        aron!.languages,
        "sv",
        (code) => ({
          sv: "Svenska",
          en: "Engelska",
          ti: "Tigrinja",
          ku: "Kurdiska",
          ar: "Arabiska",
          so: "Somaliska",
        })[code],
      ),
    ).toBe(
      "Svenska, Engelska och Tigrinja",
    );
  });

  it("uses unique slugs", () => {
    const slugs = publicStaff.map((member) => member.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const member of publicStaff) {
      expect(member.name).toBe(`${member.firstName} ${member.lastName}`);
      expect(member.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("derives the ordered offered languages without reserved future codes", () => {
    expect(offeredTeachingLanguages()).toEqual(["sv", "en", "ti", "ku"]);
    expect(offeredTeachingLanguages()).not.toContain("ar");
    expect(offeredTeachingLanguages()).not.toContain("so");
  });

  it("uses a saved teacher profile and ignores languages the school does not offer", () => {
    expect(staffMemberLanguages(["sv"], ["en", "ar", "so"])).toEqual(["en"]);
    expect(staffMemberLanguages(["sv", "ti"], [])).toEqual(["sv", "ti"]);
    expect(offeredTeachingLanguagesFrom(["ar", "so"])).toEqual(offeredTeachingLanguages());
    expect(offeredTeachingLanguagesFrom(["ku", "sv"])).toEqual(["sv", "ku"]);
  });
});
