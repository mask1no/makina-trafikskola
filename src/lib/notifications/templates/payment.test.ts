import { describe, expect, it } from "vitest";

import {
  orderReceiptPayloadSchema,
  renderCourseRebooking,
  renderLessonRebooking,
  renderOrderReceipt,
  renderPaymentFailed,
} from "./payment";

const orderId = "clh1234567890abcdefghijk";

describe("payment notification rendering", () => {
  it.each(["sv", "en", "ti", "ar", "so"])(
    "renders receipt snapshots and separate VAT in %s",
    (locale) => {
      const message = renderOrderReceipt({
        locale,
        payload: {
          orderId,
          items: [{ productName: "Startpaket", quantity: 2 }],
          totalOre: 1_845_000,
          vatOre: 369_000,
        },
      });

      expect(message.text).toContain("Startpaket");
      expect(message.text).toContain("18\u00A0450\u00A0kr");
      expect(message.text).toContain("3\u00A0690\u00A0kr");
    },
  );

  it("escapes snapshot names and renders Arabic right-to-left", () => {
    const message = renderOrderReceipt({
      locale: "ar",
      payload: {
        orderId,
        items: [{ productName: "<Försök>", quantity: 1 }],
        totalOre: 10_000,
        vatOre: 2_000,
      },
    });

    expect(message.text).toContain("<Försök>");
  });

  it("renders only the validated resume URL for failed payments", () => {
    const resumeUrl =
      "https://example.test/sv/mina-sidor/betalningar/clh1234567890abcdefghijk";
    const message = renderPaymentFailed({
      locale: "sv",
      payload: { orderId, resumeUrl },
    });

    expect(message.text).toContain(resumeUrl);
  });

  it.each(["sv", "en", "ti", "ar", "so"])(
    "explains late lesson and course value in %s",
    (locale) => {
      const lesson = renderLessonRebooking({
        locale,
        payload: {
          orderId,
          bookingUrl: "https://example.test/sv/boka",
        },
      });
      const course = renderCourseRebooking({
        locale,
        payload: {
          orderId,
          coursesUrl: "https://example.test/sv/kurser",
        },
      });

      expect(lesson.text).toContain("https://example.test/sv/boka");
      expect(course.text).toContain("https://example.test/sv/kurser");
    },
  );

  it("rejects extra receipt payload fields", () => {
    expect(
      orderReceiptPayloadSchema.safeParse({
        orderId,
        items: [{ productName: "Paket", quantity: 1 }],
        totalOre: 10_000,
        vatOre: 2_000,
        email: "should-not-enter-the-payload@example.test",
      }).success,
    ).toBe(false);
  });
});
