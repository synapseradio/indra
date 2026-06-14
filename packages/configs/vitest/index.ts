import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import { PACKAGES } from "../../../scripts/scaffold/manifest.ts";

// The base test configuration every runtime package's vitest.config.ts extends
// via mergeConfig. A package adds only its own `test.name` and `test.root`; the
// resolution and test settings that are identical workspace-wide live here, so
// the manifest stays the single edit point and a package's config stays thin.
//
// Two specifier kinds resolve through two different mechanisms, each chosen for
// how it scopes:
//
//   - `@indra/runtime-*` (and the @indra/runtime-core/inference-live subpath) has
//     one meaning workspace-wide and appears inside the loaded source of packages
//     other than the one under test, so it needs a process-global resolver: the
//     `resolve.alias` map below rewrites the specifier wherever it appears, which
//     makes the transitive case resolve to source.
//   - `~/*` means a different `src` in each package, so it needs an
//     include-scoped resolver: vite-tsconfig-paths applies each package's `~/*`
//     mapping only to that package's own files.
//
// tsc still resolves built `.d.ts` across packages via project references; this
// alias map is the test runner's concern only.

// Repo root, three directories up from this file (vitest -> configs -> packages).
const repoRoot = new URL("../../../", import.meta.url);

const workspaceAliases: Record<string, string> = Object.fromEntries(
  PACKAGES.map((pkg) => [
    pkg.name,
    fileURLToPath(new URL(`${pkg.relpath}/src/index.ts`, repoRoot)),
  ]),
);

// The live BAML layer is exposed at a subpath, not on the core barrel, so alias
// it to source as well — the live suite then resolves it without a build.
workspaceAliases["@indra/runtime-core/inference-live"] = fileURLToPath(
  new URL("packages/runtime/core/src/baml/inference.layer.ts", repoRoot),
);

export const baseConfig = defineConfig({
  // Each package's discoverable tsconfig.json is a solution-style file (empty
  // `files`, references only), so the `~/*` path mappings live in tsconfig.src.json
  // and tsconfig.test.json. configNames makes those names discoverable; each one
  // carries its own `include` (src / test), so `~/*` stays scoped per package.
  // ignoreConfigErrors skips configs outside the workspace packages (the
  // reference-only runtime/experiments tree) that the plugin would otherwise warn
  // about while scanning.
  plugins: [
    tsconfigPaths({
      ignoreConfigErrors: true,
      configNames: ["tsconfig.json", "tsconfig.src.json", "tsconfig.test.json"],
    }),
  ],
  resolve: {
    alias: workspaceAliases,
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // Live tests make real model calls and need a key; they are collected only by
    // the live run, never by the default offline suite.
    exclude: ["**/*.live.test.ts"],
    // Packages without tests (contracts, host, inference-baml) are not failures.
    passWithNoTests: true,
  },
});

export default baseConfig;
