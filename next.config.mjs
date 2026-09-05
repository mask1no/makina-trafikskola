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
        source: "/th/home",
        destination: "/ti",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
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
