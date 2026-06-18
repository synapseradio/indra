## Context

`bootstrap-workspace-and-contracts` stands up the workspace but leaves `baml/` inside `@indra/runtime-core`. The port and adapter are already separable in the source: `baml/inference.ts` is the type-only `Inference` tag, interface, and stub, widely consumed; `baml/inference.layer.ts` is the live layer that loads the binding (transitively, through the generated client). The friction is one type edge — `inference.ts` imports `WelcomeResult` type-only from `baml_client/types.ts`, a gitignored directory produced by `baml-cli generate` (`runtime/baml_src/generators.baml`). Because of that edge, the core cannot typecheck without the adapter's codegen. This change cuts the adapter into its own package and forces the leaked result shape into the contract.

## Goals / Non-Goals

**Goals:**

- Make `@indra/runtime-core` typecheck and run its offline suite with no `@boundaryml/baml` dependency and no codegen on its path.
- Isolate the BAML binding and its codegen inside `@indra/runtime-inference-baml`.
- Move `WelcomeResult` into `@indra/runtime-contracts` so the port depends on the contract, not the adapter's generated tree.
- Keep the host the only package that wires a concrete adapter.

**Non-Goals:**

- Replacing BAML (that is `own-inference`).
- Any change to inference behavior or to the `inference-layer` spec contract — only physical packaging moves.

## Decisions

**The `WelcomeResult` move into contracts is forced, not stylistic.** The port type-depends on a gitignored, generated directory inside the adapter the core must not depend on. The only way the core typechecks without the adapter's codegen is for the result shape to live in the contract package. The alternative — keeping the type in the adapter and having the core import it — recreates exactly the dependency this change exists to cut, so it is rejected.

**The port stays in the core; only the adapter leaves.** The port is the stable contract the core's turn evaluator calls. It belongs with the consumer that depends on it. The adapter (`inference.layer.ts` + `baml_src/` + `baml_client/`) is what carries the binding, so that is what moves out.

**Codegen relocates into the adapter.** `generators.baml`'s `output_dir` and the `baml_client/` `.gitignore` entry move into `@indra/runtime-inference-baml` so `baml-cli generate` writes only inside the adapter. This keeps codegen off the core's tree entirely rather than merely off its import graph.

**Tests follow the type.** `seam-typed-return.test.ts` and `conductor-cycle.test.ts` import `WelcomeResult` from `@indra/runtime-contracts`. The gated live test depends on the adapter package, where the binding lives.

## Risks / Trade-offs

- **BAML codegen relocation.** [verify] → Repoint `generators.baml` `output_dir`, move the `.gitignore` entry into the adapter, and confirm `baml-cli generate` produces the client inside the adapter and that the live test still resolves it. Keep codegen off the core's path.
- **The live test's adapter dependency.** → `live-turn.live.test.ts` must take its dependency on `@indra/runtime-inference-baml`; verify the gated live turn stays green after the move.
- **Result-shape drift.** → `WelcomeResult` now lives in contracts but is still shaped by what BAML generates. If the generated shape and the contract type diverge, the adapter is where the mismatch surfaces; the contract type is the authority the core trusts.

## Migration Plan

1. Create `@indra/runtime-inference-baml` (depends on core and contracts; sole `@boundaryml/baml` dependant).
2. Move `WelcomeResult` into `@indra/runtime-contracts`; repoint the port's import.
3. Move `inference.layer.ts`, `baml_src/`, and `baml_client/` into the adapter; relocate `output_dir` and the `.gitignore` entry.
4. Formalize `baml/inference.ts` as a core-owned module.
5. Wire the adapter into `@indra/runtime-host`.
6. Repoint `seam-typed-return.test.ts` and `conductor-cycle.test.ts`; point the live test at the adapter.
7. Verify: core carries no `@boundaryml/baml`; the adapter is the sole BAML dependant; offline suite green; gated live turn green; `WelcomeResult` resolves from contracts everywhere.

Rollback is a git revert; nothing is published and no data migrates.

## Open Questions

- **`experiments/` home** — sits under the adapter for now; revisit if it grows its own concerns.
- **Result-shape ownership long-term** — `WelcomeResult` lives in contracts now; `framework-native-contracts` and `own-inference` may reshape how inference result types are defined and validated.
