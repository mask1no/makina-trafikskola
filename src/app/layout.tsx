import type { Metadata } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import { Noto_Sans_Arabic, Noto_Sans_Ethiopic } from "next/font/google";

import { isLocale } from "@/i18n/routing";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-app",
  weight: "100 900",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  preload: false,
});

const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-ethiopic",
  preload: false,
});

export const metadata: Metadata = {
  title: "Makina Trafikskola",
};

export default async function RootLayout(
  {
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>
) {
  const requestedLocale = (await headers()).get("x-makina-locale") ?? "sv";
  const locale = isLocale(requestedLocale) ? requestedLocale : "sv";

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body
        className={`${geistSans.variable} ${notoArabic.variable} ${notoEthiopic.variable} antialiased ${
          locale === "ar"
            ? "font-[family-name:var(--font-arabic)]"
            : locale === "ti"
              ? "font-[family-name:var(--font-ethiopic)]"
              : ""
        }`}
      >
        {children}
      </body>
    </html>
  );
}
