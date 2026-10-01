import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs/config";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const r2PublicUrl = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL)
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: r2PublicUrl
      ? [
          {
            protocol: r2PublicUrl.protocol.replace(":", ""),
            hostname: r2PublicUrl.hostname,
            port: r2PublicUrl.port,
            pathname: `${r2PublicUrl.pathname.replace(/\/$/, "")}/**`,
          },
        ]
      : [],
  },
  async redirects() {
    return [
      {
        source: "/product/:slug*",
        destination: "/sv/paket/:slug*",
        permanent: true,
      },
      {
        source: "/korlektion",
        destination: "/sv/korlektioner",
        permanent: true,
      },
      {
        source: "/:locale/mina-sidor/saldo",
        destination: "/:locale/mina-sidor/lektioner",
        permanent: true,
      },
      {
        source: "/th/home",
        destination: "/ti",
        permanent: true,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(self)",
      },
      {
        key: "Content-Security-Policy-Report-Only",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "script-src 'self' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com https://accounts.google.com",
          "style-src 'self' 'unsafe-inline'",
          `img-src 'self' data: blob: https://maps.gstatic.com https://maps.googleapis.com https://*.stripe.com${r2PublicUrl ? ` ${r2PublicUrl.origin}` : ""}`,
          "font-src 'self' data:",
          "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://*.googleapis.com https://accounts.google.com https://*.sentry.io https://*.ingest.sentry.io",
          "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
          "worker-src 'self'",
          "form-action 'self'",
        ].join("; "),
      },
    ];
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
