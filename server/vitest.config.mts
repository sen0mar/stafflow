import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globals: true,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    isolate: true,
    pool: "forks",
    setupFiles: ["test/setup.ts"],
  },
});
