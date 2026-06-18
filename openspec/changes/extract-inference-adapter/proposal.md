## Why

After `bootstrap-workspace-and-contracts` stands up the workspace, the BAML adapter still sits inside `@indra/runtime-core`, so the deterministic core transitively depends on a Rust-backed codegen DSL: `baml/inference.layer.ts` is the only module that loads the binding (transitively, through the generated `baml_client`), and the port `baml/inference.ts` imports `WelcomeResult` type-only from `baml_client/types.ts` — a gitignored directory produced by `baml-cli generate` (`runtime/baml_src/generators.baml`, `output_dir "../"`). The core therefore cannot typecheck without running the adapter's codegen. Cutting the adapter out moves the binding behind the port, lets the host wire the concrete adapter, and forces the leaked result shape into the contract where it belongs.

## What Changes

- Formalize the **Inference port** (`baml/inference.ts`: the `Inference` tag, its interface, and the offline stub) as a first-class `@indra/runtime-core` module — out of the `baml/` subdirectory the adapter shared. The core owns the port; no adapter is required to typecheck it.
- Move the **live adapter** — `inference.layer.ts`, `baml_src/`, and the generated `baml_client/` — into a new package `@indra/runtime-inference-baml`. It is the only package that loads `@boundaryml/baml`. The `.gitignore` entry for `baml_client/` moves with it, and `generators.baml`'s `output_dir` is repointed so codegen lands inside the adapter, off the core's path.
- **Move `WelcomeResult` into `@indra/runtime-contracts`** (forced — see Why). The port imports the result shape from the contract, not from the adapter's generated directory.
- **Repoint the two tests** that import `WelcomeResult` from `baml_client` — `seam-typed-return.test.ts` and `conductor-cycle.test.ts` — to import it from `@indra/runtime-contracts`. The gated live test (`live-turn.live.test.ts`) takes its dependency on the adapter package.
- The **host** wires `@indra/runtime-inference-baml` behind the port, keeping the core, choreography, and contracts packages BAML-free.
- No behavior change. The offline suite runs against the stub port with no BAML dependency; the gated live turn stays green through the adapter. **Not BREAKING** at the behavioral level.

### Non-Goals

- Replacing BAML with an Effect-Schema inference adapter. That swap is the later `own-inference` change, against the port this one isolates.
- Hardening the contract into a versioned, serializable IR document. That framing is dropped as language-era; load-time validation of the typed program lives in `validate-program-at-load`.

## Capabilities

### New Capabilities

- none.

### Modified Capabilities

- `package-boundaries`: extend the capability `bootstrap-workspace-and-contracts` introduces with the inference-specific invariants — the port owned by the core, the BAML binding isolated to the adapter package, the inference result shapes owned by the contract package, and the offline suite carrying no dependency on `@boundaryml/baml`.

## Impact

- **New package**: `@indra/runtime-inference-baml` holding `inference.layer.ts`, `baml_src/`, the generated `baml_client/`, and the sole `@boundaryml/baml` dependency. `experiments/` sits under it.
- **Source moves**: the Inference port becomes a core-owned module; `WelcomeResult` moves to `@indra/runtime-contracts`; the adapter and codegen move to the new package.
- **Codegen**: `generators.baml`'s `output_dir` and the `baml_client/` `.gitignore` entry relocate into the adapter so `baml-cli generate` never touches the core's tree.
- **Tests**: `seam-typed-return.test.ts` and `conductor-cycle.test.ts` import `WelcomeResult` from contracts; `live-turn.live.test.ts` depends on the adapter package.
- **Dependency rule made physical**: `@indra/runtime-core` loads no `@boundaryml/baml` and typechecks without codegen; `@indra/runtime-inference-baml` is the sole BAML dependant; only `@indra/runtime-host` imports the concrete adapter.
- **Unblocks**: the `own-inference` swap becomes a second adapter behind the same port.
- **Initiative ledger**: monorepo-bootstrap gains the inference-adapter-extraction entry — what the cut makes legible (the deterministic core stops depending on a codegen DSL) and what it costs (the host must wire the concrete adapter; the result shape must be owned by the contract).
