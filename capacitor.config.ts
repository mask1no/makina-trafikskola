import type { CapacitorConfig } from "@capacitor/cli";

const siteUrl = process.env.CAPACITOR_SERVER_URL ?? "https://www.makina.se";

const config: CapacitorConfig = {
  appId: "se.makina.trafikskola",
  appName: "Makina Trafikskola",
  webDir: "public",
  server: {
    url: siteUrl,
    cleartext: false,
    androidScheme: "https",
    // The shell loads the site itself, so session cookies stay first-party.
    // Google and Stripe must be allowed or login and checkout cannot leave the origin.
    allowNavigation: [
      "makina.se",
      "www.makina.se",
      "accounts.google.com",
      "*.google.com",
      "*.googleusercontent.com",
      "*.stripe.com",
      "checkout.stripe.com",
    ],
  },
  ios: {
    contentInset: "automatic",
  },
  plugins: {
    Camera: {
      // Teacher photos use the existing signed upload. These strings are the permission prompts.
      presentationStyle: "fullscreen",
    },
  },
};

export default config;
