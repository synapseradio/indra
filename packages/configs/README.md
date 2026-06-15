# @indra/configs

Shared tooling configuration for the INDRA workspace.

## What it is

`@indra/configs` holds the base Vitest configuration that every workspace package extends. It is a build infrastructure package, not a runtime package — its purpose is the same as `turbo.json` or `biome.jsonc`: to keep a piece of tooling behavior in one place rather than duplicated across consumers.

## Why it exists

Each runtime package runs its own test suite through its own `vitest.config.ts`. Without a shared base, every one of those configs would need to carry an identical copy of the module alias map that spans packages — a map derived from the scaffold manifest that would need updating in every package whenever a new runtime package is added. The shared base keeps that map in one place. A package's config then becomes two lines: its own `test.name` and `test.root`, nothing else.

## Exports

The package exposes a single subpath:

```text
@indra/configs/vitest
```

That subpath exports `baseConfig`, a Vitest configuration object built with `defineConfig`. Import it into a package's `vitest.config.ts` and merge in the settings specific to that package:

```ts
import { fileURLToPath } from "node:url";
import { baseConfig } from "@indra/configs/vitest";
import { mergeConfig } from "vitest/config";

export default mergeConfig(baseConfig, {
  test: {
    name: "core",
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
});
```

`baseConfig` is also the `default` export, so `import baseConfig from "@indra/configs/vitest"` works as well.

## Architecture

The base config solves one problem: making tests run against TypeScript source across the workspace, with no build step, for both imports within a package and imports that reach across packages. Two kinds of module specifiers appear in tests, and each resolves through a different mechanism chosen for how it scopes.

**Specifiers within a package** (`~/*`) point to a different `src` directory in each package, so their resolution must be scoped to the package being tested. `vite-tsconfig-paths` handles these by reading each package's `tsconfig.src.json` and `tsconfig.test.json`, which carry the `~/*` path mappings, and applying each mapping only to files covered by that config's `include`. The plugin runs with `ignoreConfigErrors: true` so it skips configs outside the workspace packages without warning.

**Specifiers that cross packages** (`@indra/runtime-*`, including the `@indra/runtime-core/inference-live` subpath) have one meaning across the whole workspace and can appear in transitive imports — source loaded by the package under test that itself imports another runtime package. A resolver scoped to one package would miss those. Instead, `baseConfig` builds a `resolve.alias` map from the `PACKAGES` manifest in `scripts/scaffold/manifest.ts` and registers it as a Vite alias that applies across the whole process. Every `@indra/runtime-*` specifier, wherever it appears, resolves to that package's `src/index.ts` without a build.

The two mechanisms are deliberately separate. Merging them into a single resolver would either make `~/*` resolve globally (wrong: it points at different directories in different packages) or make `@indra/runtime-*` resolve only within a single package's include scope (wrong: it would miss transitive imports).

The base config also sets the test environment to `node`, targets `test/**/*.test.ts`, excludes `**/*.live.test.ts` files from the default suite (those make real model calls and run separately), and sets `passWithNoTests: true` so packages without tests are not counted as failures.
