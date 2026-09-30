import { describe, expect, it } from "vitest";

import { renderBookingMessage, type BookingTemplate } from "./booking";

const locales = ["sv", "en", "ti", "ar", "so"] as const;
const templates: BookingTemplate[] = [
  "booking_confirmed",
  "booking_cancelled_by_student",
  "booking_cancelled_by_teacher",
  "booking_reminder_24h",
  "booking_moved",
  "teacher_booking_new",
  "teacher_booking_cancelled",
  "teacher_booking_moved",
];
const teacherTemplates = new Set<BookingTemplate>([
  "teacher_booking_new",
  "teacher_booking_cancelled",
  "teacher_booking_moved",
]);

const startsAt = new Date("2026-10-06T08:00:00.000Z");

describe("booking SMS", () => {
  it("renders every template in every locale without empty fragments", () => {
    for (const locale of locales) {
      for (const template of templates) {
        const message = renderBookingMessage({
          template,
          locale,
          startsAt,
          cancellationDeadline: new Date("2026-10-05T08:00:00.000Z"),
          previousStartsAt: new Date("2026-10-06T06:00:00.000Z"),
          studentFirstName: "Nora",
          teacherFirstName: "Sara",
          placeLabel: "Centralvägen 5",
          schoolPhone: "070-097 04 83",
          creditRefunded: template === "booking_cancelled_by_teacher",
        });
        expect(message.text, `${locale} ${template}`).not.toMatch(
          /undefined|, ,|,\.| :/,
        );
        expect(message.text.length).toBeGreaterThan(8);
      }
    }
  });

  it("keeps phone numbers out of teacher texts and refunds optional", () => {
    for (const locale of locales) {
      for (const template of teacherTemplates) {
        const message = renderBookingMessage({
          template,
          locale,
          startsAt,
          previousStartsAt: startsAt,
          studentFirstName: "Nora",
          placeLabel: "Centralvägen 5",
          schoolPhone: "+46700970483",
        });
        expect(message.text).not.toContain("+46700970483");
        expect(message.text).not.toContain("070-097");
      }
      const refunded = renderBookingMessage({
        template: "booking_cancelled_by_teacher",
        locale,
        startsAt,
        creditRefunded: true,
      });
      const kept = renderBookingMessage({
        template: "booking_cancelled_by_teacher",
        locale,
        startsAt,
        creditRefunded: false,
      });
      expect(refunded.text.length).toBeGreaterThan(kept.text.length);
    }
  });

  it("uses Latin digits for Arabic times", () => {
    const message = renderBookingMessage({
      template: "booking_confirmed",
      locale: "ar",
      startsAt,
      cancellationDeadline: startsAt,
    });
    expect(message.text).toMatch(/\d/);
    expect(message.text).not.toMatch(/[٠-٩]/);
  });
});
