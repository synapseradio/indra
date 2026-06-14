## Context

The offline test suite resolves cross-package `@indra/runtime-*` imports to source
through one root alias map in `vitest.shared.ts`, hand-built from the `PACKAGES`
manifest. It is global (every package's test run is coupled to one file) and it is
a second copy of a fact the tsconfigs already encode. The goal is per-package,
self-contained test configuration with one orchestrator.

Two resolution facts shape the design, both verified against the installed
`vite-tsconfig-paths@6.1.1` source:

- The plugin is **include-scoped**. A resolver applies only to importer files that
  match its config's `include`/`exclude` (dist `index.js` lines 443–464), and a
  config with empty `files` and no `include` is skipped entirely with
  "no files can be matched" (lines 360–362). So tsconfig path mappings cannot
  resolve a cross-package specifier that appears inside *another* package's source
  — the transitive case — without putting those mappings in every package's
  source-covering config, which is the composite build config that `tsc` rejects
  cross-package source paths in (TS6059).
- A Vite `resolve.alias` is **process-global**: it rewrites a specifier regardless
  of which file imports it, so it resolves transitively.

These pull apart cleanly by specifier kind.

## Goals / Non-Goals

**Goals:**

- Each package owns a self-contained `vitest.config.ts`, generated from the
  manifest.
- Cross-package `@indra/runtime-*` (and the `@indra/runtime-core/inference-live`
  subpath) resolve to source through a generated alias map, with no hand-kept map.
- `~/*` resolves to source through tsconfig path mappings.
- `turbo run test` orchestrates from the root, caches per package, and runs tests
  only for changed packages.
- Type-checking runs before tests in every scope, enforced by turbo.
- Vite never type-checks; `tsc -b` stays green and owns types.
- The scaffold generates a base `README.md` for every package.

**Non-Goals:**

- Changing any runtime source or the package dependency graph.
- A root `vitest.shared.ts` or `vitest.workspace.ts` — both are removed; turbo is
  the orchestrator.

## Decisions

### `~/*` via tsconfig paths, `@indra/runtime-*` via a generated alias map

The two specifier kinds use the tool whose scoping fits them.

`~/*` means a different `src` in each package, so its resolver *must* be
include-scoped: `vite-tsconfig-paths` (eager, repo root) discovers every package's
`tsconfig.src.json` and applies each `~/*` mapping to that package's own files,
transitively and correctly.

`@indra/runtime-*` has one meaning workspace-wide, and it appears inside loaded
source of packages other than the one under test, so its resolver must be
process-global: a generated `resolve.alias` in each package's `vitest.config.ts`,
mapping every workspace package to its `src/index.ts` plus the
`@indra/runtime-core/inference-live` subpath to `core/src/baml/inference.layer.ts`.
The scaffold emits the full map into each config (self-contained, robust against
dependency depth); the manifest stays the single edit point.

Alternatives considered:

- **Paths in the aggregate `tsconfig.json`** — skipped by the plugin (empty
  `include`). Verified dead. Rejected.
- **Paths in `tsconfig.src.json`** — breaks `tsc -b` (TS6059). Rejected.
- **`exports` conditions to dist, build-first** — abandons source-based testing.
  Rejected.
- **One root shared alias map (the Effect pattern)** — works, but couples every
  package to one file and defeats per-package turbo caching. Rejected in favor of
  generated per-package maps.

### Turbo orchestrates; type-checking gates tests in every scope

`turbo run test` runs each package's `vitest run` and caches per package, so a
change in one package does not rerun another's tests. The `test` task declares
`dependsOn: ["check:types", "^check:types"]` (plus the existing `generate` edges),
so a package's own type-check and its dependencies' type-checks complete before its
tests run, in every scope. Vite does no type-checking; `tsc -b` owns it.

### The scaffold owns the new shape

`scripts/scaffold/parts.ts` gains a `readme` generator, rewrites `vitestConfig` to
emit the self-contained config (tsconfig-paths plugin plus the generated alias map),
and the root config files `vitest.shared.ts` / `vitest.workspace.ts` are removed.
`turbo.json` gains the `check:types` gate on `test`.

## Risks / Trade-offs

- [The full alias map in every package lists packages a package does not import] →
  Harmless: Vite only applies an alias when the specifier actually appears. The
  full map keeps the generator trivial and robust against deeper graphs.
- [Per-package configs duplicate boilerplate] → They are generated, so the manifest
  stays the single edit point; duplication lives only in generated output, which is
  the price of per-package turbo cache isolation.
- [Type-check gate slows the inner test loop] → That is the stated requirement;
  turbo caches `check:types`, so the gate is a cache hit when types are unchanged.

## Migration Plan

1. Add the `readme` generator and rewrite `vitestConfig` to the self-contained
   shape; remove `vitest.shared.ts` and `vitest.workspace.ts`.
2. Add the `check:types` gate to the `test` task in `turbo.json`.
3. Regenerate all packages with the scaffold; confirm the tree matches generators.
4. Run the offline suite via `turbo run test`. Green is the acceptance check.
5. Confirm `tsc -b` stays green.

Rollback is reverting the scaffold change and regenerating; no runtime code moves.

## Open Questions

- Does the per-package README need a description field in the manifest, or does the
  package name suffice? Resolved during apply by what the template needs.
