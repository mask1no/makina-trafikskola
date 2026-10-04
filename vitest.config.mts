import { fileURLToPath } from "node:url";

export default {
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
