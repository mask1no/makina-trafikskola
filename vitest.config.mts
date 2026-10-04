import { fileURLToPath } from "node:url";

const unitConfig = {
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: [
      "e2e/**",
      "node_modules/**",
      ".next/**",
      "**/*.integration.test.ts",
    ],
  },
};

export default unitConfig;
