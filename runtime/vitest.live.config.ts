import { defineConfig } from "vitest/config";

/**
 * The live config, run only by `bun run test:live`. It collects the gated
 * *.live.test.ts files the default config excludes — the tests that make a real
 * model call and need ANTHROPIC_API_KEY. Without the key they skip cleanly.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.live.test.ts"],
    environment: "node",
  },
});
