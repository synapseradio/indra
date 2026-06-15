# @indra/runtime-inference-baml

This package is the BAML inference adapter for the INDRA runtime. It holds the live layer that calls the BAML async client, the BAML source definitions (`baml_src/`), and the codegen output (`baml_client/`) that BAML generates. Every other runtime package stays free of the `@boundaryml/baml` native binding. This package is the sole place in the workspace that loads it.

## Why this package exists

The deterministic core of the INDRA runtime (`@indra/runtime-core`) depends on an inference service it does not implement. The core owns the port — the `Inference` Effect tag, the `InferenceService` interface, and an offline stub — but it cannot depend on a concrete adapter without pulling a Rust-backed native binding and its codegen step onto the core's path. Separating the adapter into its own package means the core typechecks and runs its offline test suite with no BAML dependency and no codegen required, while the live binding stays available to the host when it assembles the full runtime.

## What exists today

This package is currently a stub. Its entry (`src/index.ts`) exports nothing. The live adapter (`inference.layer.ts`), the BAML source definitions, and the generated client live inside `@indra/runtime-core/src/baml/` and move here in the `extract-inference-adapter` change.

## What is planned

When the `extract-inference-adapter` change applies, this package will export `InferenceLive`: an Effect `Layer` that implements the `Inference` port from `@indra/runtime-core` by wrapping the BAML async client. It will be the only package in the workspace that declares `@boundaryml/baml` as a dependency. The codegen output directory will be rooted here, so `baml-cli generate` never writes into the core's tree.

`WelcomeResult` — the result type the inference port currently imports from the generated client — will move into `@indra/runtime-contracts` as part of the same change. The port will then import the result shape from the contract package, and this adapter will supply a concrete implementation that satisfies it.

## Architecture

This package sits at the outer edge of the runtime dependency graph. It depends inward on `@indra/runtime-core` to obtain the `Inference` port it implements, and on `@indra/runtime-contracts` for the shared result types. Only `@indra/runtime-host`, the composition root, imports this adapter and wires it behind the port.

```text
@indra/runtime-contracts        (result types, error taxonomy)
         ↑
@indra/runtime-core             (Inference port, deterministic executor)
         ↑
@indra/runtime-inference-baml   (InferenceLive — this package)
         ↑
@indra/runtime-host             (composition root, wires adapters)
```

The offline test suite for `@indra/runtime-core` uses `InferenceStub`, a stub layer defined in the core, and carries no dependency on this package. The gated live test depends on this adapter directly.
