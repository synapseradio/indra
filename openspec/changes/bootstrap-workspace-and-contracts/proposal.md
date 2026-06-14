## Why

The runtime is one dense TypeScript package doing several things at once, and holding all of it exceeds what one person can keep in working memory — the problem the monorepo-bootstrap initiative exists to relieve (`openspec/initiatives/monorepo-bootstrap.md`). A full import-graph trace of `runtime/src` found the real joints: the AST contract imports nothing and has 20+ importers (`runtime/src/ast/types.ts`); the error taxonomy imports only effect's `Data` and is shared vocabulary, not substrate (`runtime/src/effect/errors.ts`); and `effect/` never imports `xstate/` — the dependency runs one way, `xstate → effect`, through a single bridge module (`runtime/src/xstate/leaves.ts`). Those joints are describable now, so cutting them turns the runtime's inward-only dependency rule from a comment (`runtime/ARCHITECTURE.md:45`) into a fact the compiler enforces.

## What Changes

- Stand up a **Bun workspace** so `runtime/` becomes packages among many: catalogs for centralized versions, a TypeScript project-reference graph for cross-package declaration builds, rslib for the JS build, Turbo for orchestration and caching, and Biome for lint and format. No behavior changes; this is packaging and toolchain.
- Relocate the runtime under `packages/runtime/*` (one nesting level, the Effect-style layout).
- Extract **`@indra/runtime-contracts`** — the IR/AST types (`ast/types.ts`), the error taxonomy (`errors.ts`), and the provisional core↔choreography contract (`TurnOutcome`, the events, the leaf signatures). It imports no workspace package and sits at the root of the dependency graph.
- **Split** the dense middle along its verified joint: `effect/` (world store + turn evaluator + validation + assembly) becomes **`@indra/runtime-core`**, and `xstate/` (the conductor, actor machine, leaves, events) becomes **`@indra/runtime-choreography`**. The split is a clean cut, not an untangling — the `effect → xstate` edge has zero reverse edges. The contract between the two packages is marked **provisional**, because the unbuilt `say:`-routing and `await:`-resume seams will reshape it.
- Create **`@indra/runtime-host`** — the composition root (the renamed entrypoint, not a CLI), the only package that will import a concrete adapter.
- The inference port, adapter, and `WelcomeResult` move in `extract-inference-adapter`, which depends on this change. Here, `baml/` stays in place inside `packages/runtime/core` so this change carries no inference rework.
- No behavior change. Import paths change; observable behavior does not. The offline suite stays green. **Not BREAKING** at the behavioral level.

### Non-Goals

- Extracting the inference adapter or moving the `WelcomeResult` result type — that is `extract-inference-adapter`, which follows this change.
- Hardening the contract into a versioned, validated IR — that is `define-program-ir`, which now hard-depends on this change.
- Extracting `legacy/`, `docs/`, or `openspec/specs/` as packages — latent packages the initiative tracks separately.

## Capabilities

### New Capabilities

- `package-boundaries`: the package decomposition of the runtime workspace and the dependency invariants that hold across the cuts — the contract package at the root importing nothing, the core never importing the choreography, an adapter depending inward on the port it implements, and the offline suite free of the BAML binding. This makes the inward-only rule (today a comment, `runtime/ARCHITECTURE.md:45`) a structural contract. Re-homed and extended from the retired `runtime-improvements` change, whose single-runtime-package requirement this plan supersedes by splitting core from choreography now.

### Modified Capabilities

- none. No spec-level requirement changes to existing capabilities. The `inference-layer` contract — inference is a service behind a tag, host-bound, returning typed values with no access to the store — is preserved exactly; its physical packaging shifts in the next change. The requirement changes that touch `inference-layer` and `context-state` live in `define-program-ir`.

## Impact

- **Workspace layout**: a new root `package.json` (Bun workspaces + catalogs), `tsconfig.base.json`, root `tsconfig.json`/`tsconfig.build.json` solution files, `turbo.json`, `biome.jsonc`, `.markdownlint.jsonc`, and `vitest.*`; per-package manifests, `rslib.config.ts`, and tsconfig trios under `packages/runtime/{contracts,core,choreography,inference-baml,host}`.
- **Source relocation**: `ast/types.ts` + `effect/errors.ts` + the provisional choreography contract → `contracts`; `effect/` → `core`; `xstate/` → `choreography`; the entrypoint → `host`. `skeleton.ts` sits provisionally in `core/src/programs/`.
- **Imports**: references across the former `effect/` and `xstate/` update to the new package specifiers (`@indra/runtime-*`).
- **Build and test**: tsc owns typecheck and `.d.ts` only; rslib owns the JS build; Bun runs source in dev via the `bun` export condition. The offline suite stays green.
- **Dependency rule made physical**: `contracts` imports nothing, and `core` cannot import `choreography` — the inward-only rule stated in `runtime/ARCHITECTURE.md:45` becomes a compiler-enforced fact.
- **Toolchain baseline**: `composite` + `moduleResolution: bundler` + `emitDeclarationOnly` with cross-package project references — Effect's published reference model, adopted directly. The `nodenext` fallback stays in reserve if the real tree surfaces a problem.
- **Unblocks**: `extract-inference-adapter`, `define-program-ir`, and the later own-inference swap each extend a workspace that already exists.
- **Initiative ledger**: monorepo-bootstrap gains its first concrete entries — what the contracts extraction and the core/choreography split make legible, and what each costs.
