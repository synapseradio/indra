import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Live tests make real model calls and need a key; they are collected only
    // by vitest.live.config.ts, never by the default offline run.
    exclude: [...configDefaults.exclude, "**/*.live.test.ts"],
    environment: "node",
  },
});
