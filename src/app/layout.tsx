import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
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
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default async function RootLayout(
  {
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>
) {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  const requestedLocale = headerStore.get("x-makina-locale") ?? "sv";
  const locale = isLocale(requestedLocale) ? requestedLocale : "sv";
  const theme = cookieStore.get("makina-theme")?.value === "dark" ? "dark" : "light";

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-theme={theme} suppressHydrationWarning>
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
