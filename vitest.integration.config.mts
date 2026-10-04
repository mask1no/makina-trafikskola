import { fileURLToPath } from "node:url";

export default {
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    include: ["src/**/*.integration.test.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    sequence: { concurrent: false },
    testTimeout: 60_000,
    globalSetup: ["./vitest.integration.global-setup.ts"],
  },
};
