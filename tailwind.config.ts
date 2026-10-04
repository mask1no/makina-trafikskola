import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          soft: "var(--surface-soft)",
        },
        page: "var(--page)",
        card: {
          DEFAULT: "var(--card)",
          muted: "var(--card-muted)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          inverse: "var(--ink-inverse)",
          "inverse-muted": "var(--ink-inverse-muted)",
          muted: "var(--ink-muted)",
          subtle: "var(--ink-subtle)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          ink: "var(--accent-ink)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      fontFamily: {
        sans: ["var(--font-app)", "Arial", "sans-serif"],
      },
      fontSize: {
        display: "var(--text-display)",
        hero: "var(--text-hero)",
        h2: "var(--text-h2)",
        h3: "var(--text-h3)",
        body: "var(--text-body)",
        small: "var(--text-small)",
        micro: "var(--text-micro)",
        nav: "var(--text-nav)",
      },
      letterSpacing: {
        tighter: "-0.04em",
      },
      boxShadow: {
        soft: "var(--shadow-sm)",
        card: "var(--shadow-md)",
        float: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
