## Context

The runtime is one dense TypeScript package built on Bun (`runtime/bun.lock`, `runtime/bunfig.toml`). A full import-graph trace of `runtime/src` established the joints this change cuts along: `ast/types.ts` imports nothing and has 20+ importers; `effect/errors.ts` imports only effect's `Data`; and `effect/` never imports `xstate/` — the dependency is one-directional `xstate → effect` through the single bridge module `runtime/src/xstate/leaves.ts`. The inward-only rule lives today as prose (`runtime/ARCHITECTURE.md:45`). This change makes it structural by standing up a workspace and placing the contract at the root of the dependency graph.

This is a packaging and toolchain change with no behavior change. It is the first rung of the monorepo-bootstrap initiative; `extract-inference-adapter` and `define-program-ir` ladder onto the workspace it creates.

## Goals / Non-Goals

**Goals:**

- Stand up a Bun workspace with a clean toolchain division of labor: Bun manages packages and runs source in dev; TypeScript typechecks and emits `.d.ts` only; rslib builds the JS; Turbo orchestrates and caches; Biome lints and formats.
- Extract `@indra/runtime-contracts` as the root package importing nothing.
- Split the dense middle into `@indra/runtime-core` (world store + turn evaluator) and `@indra/runtime-choreography` (the XState conductor) along the verified one-directional joint.
- Create `@indra/runtime-host` as the composition root.
- Make the inward-only dependency rule a fact the compiler enforces.

**Non-Goals:**

- Extracting the inference adapter or moving `WelcomeResult` (that is `extract-inference-adapter`).
- Hardening the contract into a versioned, validated IR (that is `define-program-ir`).
- Any behavior change. The offline suite stays green and import paths are the only observable diff.

## Decisions

**Bun workspaces + catalogs.** Bun is already the toolchain. Catalogs centralize dependency versions so every package references a single pinned version with `catalog:` / `catalog:tooling`. Versioning is `~` (patch-only bumps) everywhere. Alternative — independent per-package version ranges — was rejected because it reintroduces the drift catalogs exist to remove.

**TypeScript for typecheck and `.d.ts` only; rslib builds JS; Bun runs source.** An explicit division: tsc owns types, rslib owns JS, Bun owns execution. This is *why* the baseline is `module: preserve` / `moduleResolution: bundler` (extensionless imports, no `allowImportingTsExtensions`) rather than `nodenext`. There is no Node-publish path through tsc, so NodeNext's `.js`-extension requirement buys nothing. The fallback is recorded under Risks.

**Project references with `composite` + `emitDeclarationOnly`.** Packages depend on each other, so cross-package declaration builds must be ordered. This is Effect's published pattern (`Effect-TS/effect@main`), which is why no throwaway toy is needed to prove the baseline composes — the reference model is already exercised at scale upstream. A root solution `tsconfig.json` references every package, and each package carries a tsconfig trio (`tsconfig.src.json`, `tsconfig.test.json`, plus the aggregating `tsconfig.json`) and a `tsconfig.build.json`. Cross-package type deps are references to the dependency's `tsconfig.src.json`.

**Contracts is a real package, not an alias.** `@indra/runtime-contracts` is a published-shape workspace package rather than a path alias. This is Effect-faithful and avoids a non-package alias-resolution wrinkle in the reference graph.

**Core/choreography split happens now, contract marked provisional.** The `effect → xstate` edge is clean (verified zero reverse edges), and the split chunks the real cognitive joint — the state model versus the turn loop. Marking the shared contract (`TurnOutcome`, events, leaf signatures) provisional prevents mistaking the package line for a frozen contract; the unbuilt `say:`-routing and `await:`-resume seams will reshape it. This decision supersedes the retired `runtime-improvements` change, which had kept substrate and choreography in one package.

**Effect-style layout.** Packages live one nesting level deep under `packages/runtime/<pkg>`, with a root tsconfig trio plus per-package trios — the explicit reference model from `Effect-TS/effect@main`.

**ESM everywhere, `moduleDetection: force`, all tsconfigs JSONC.** `"type": "module"` throughout. Comments are kept in tsconfigs (the `.json` name is retained for tsc and editor discovery) and in `biome.jsonc` (`json.parser.allowComments: true`). Biome does not lint Markdown, so `lint:docs` uses `markdownlint-cli2`.

**Manifest-driven scaffold CLI.** `scripts/scaffold/` is a Bun TypeScript CLI (`manifest.ts`, `parts.ts`, `index.ts`), idempotent, creating structure plus configs only — no source moves. Each part is a pure function from a package spec to one file, so a part regenerates in isolation and a package scaffold is the composition of every part: `package.json`, the tsconfig trio plus `tsconfig.build.json`, `rslib.config.ts`, `vitest.config.ts`, and `README.md`. Its `PACKAGES` manifest (`relpath|name|deps`) is the single edit point. The root `package.json`, `turbo.json`, and `biome.jsonc` are authored directly, not by the scaffold.

**Per-package vitest config extends a shared `@indra/configs` base.** Each package's `vitest.config.ts` is thin: it imports `baseConfig` from `@indra/configs/vitest` and `mergeConfig`s in only that package's `test.name` and `test.root`. Everything identical workspace-wide — the resolver plugins, the cross-package alias map, and the test settings — lives once in the base config, so the manifest stays the single edit point and no per-package config carries a hand-kept map.

The base config resolves two specifier kinds through the tool whose scoping fits each, a split verified against the installed `vite-tsconfig-paths@6.1.1` source:

- `~/*` means a different `src` in each package, so its resolver must be **include-scoped**. `vite-tsconfig-paths` (with `configNames` covering `tsconfig.src.json` and `tsconfig.test.json`, since the discoverable `tsconfig.json` is a references-only solution file the plugin otherwise skips) applies each package's `~/*` mapping only to that package's own files.
- `@indra/runtime-*` (and the `@indra/runtime-core/inference-live` subpath) has one meaning workspace-wide and appears inside the loaded source of packages other than the one under test, so its resolver must be **process-global**: a `resolve.alias` map in the base config, built from `PACKAGES`, rewrites the specifier wherever it appears and so resolves the transitive case to source. `tsc` still resolves built `.d.ts` across packages through project references; the alias map is the test runner's concern only.

Turbo orchestrates: `turbo run test` runs each package's `vitest run`, caches per package so a change in one package does not rerun another's tests, and the `test` task declares `dependsOn: ["check:types", "^check:types"]` so type-checking gates tests in every scope. Vite never type-checks.

Alternatives considered and rejected: paths in the aggregate `tsconfig.json` (skipped by the plugin — empty `include`); paths in `tsconfig.src.json` (breaks `tsc -b` with TS6059); `exports` conditions to dist (abandons source-based testing); and a generated per-package alias map duplicated into every config (more output, no benefit over centralizing the identical map in `@indra/configs`).

## Risks / Trade-offs

- **`composite` + `moduleResolution: bundler` + `emitDeclarationOnly` must compose, and `tsc -b` must resolve cross-package types via the reference graph.** → This is Effect's published reference model, exercised upstream at scale, so it is adopted directly rather than proven on a throwaway toy. The `nodenext` fallback (accepting `.js` import extensions) or a non-emitting check plus rslib-owned dts remains available if the real tree surfaces a problem during apply.
- **Dev resolution via the `bun` condition.** → Bun must run `@indra/runtime-*` from `src` with no build while tsc resolves `types` from built `.d.ts`. This is confirmed against the real tree as packages come up, not on a separate toy.
- **rslib externalization.** → Workspace and catalog deps must be externalized and the `exports` map must match rslib's ESM output. Verify `rslib build` emits ESM with workspace deps externalized.
- **Freezing a still-moving contract into a package line.** → Mitigated by marking the core↔choreography contract provisional in the contract package and in the spec.
- **Markdown lint is a separate tool.** → Biome will not cover Markdown; `markdownlint-cli2` is wired as `lint:docs`.

## Migration Plan

1. Run the scaffold script to create `packages/runtime/{contracts,core,choreography,inference-baml,host}` with their tsconfig trios, `rslib.config.ts`, and manifests; setup subagents author the root `package.json`, `turbo.json`, `biome.jsonc`, and `vitest.*`.
2. Relocate source: `ast/types.ts` + `effect/errors.ts` + the provisional choreography contract → `contracts`; `effect/` → `core`; `xstate/` → `choreography`; the entrypoint → `host`. `baml/` stays inside `core` for now (it moves in `extract-inference-adapter`).
3. Repoint imports to `@indra/runtime-*` specifiers.
4. Verify: `tsc -b tsconfig.json` green from root; `runtime-contracts` resolves no workspace package; `runtime-core` imports nothing from `runtime-choreography`; offline suite green; `turbo run check:types` caches on the second run.

Rollback is a git revert; nothing is published and no data migrates.

## Open Questions

- **rslib bundle vs bundleless per package** — bundleless preserves module structure for libraries; bundle suits the `host`. Decide per package at build setup.
- **`host` package name** — it is the composition root, not a CLI; rename if a better fit emerges.
- **`skeleton.ts` long-term home** — a dedicated `programs`/examples package later; provisional in `core/src/programs/` now.
- **`types: ["bun"]` vs `["node"]`** per package — pick by what globals each package touches.
- **`nodenext` fallback** — held in reserve. Adopt only if the real tree surfaces a `bundler`/`emitDeclarationOnly` problem the upstream Effect model does not.
- **changesets** — not adopted (private repo; `~` + catalogs suffice). Revisit if publishing.
