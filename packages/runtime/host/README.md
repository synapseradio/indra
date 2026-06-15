# @indra/runtime-host

`@indra/runtime-host` is the composition root of the INDRA runtime workspace. It is the single place where abstract ports meet concrete adapters, where the layers of the runtime are assembled into one running system.

The workspace splits the runtime across four packages along a strict inward-only dependency line: `@indra/runtime-contracts` holds the IR types and error taxonomy; `@indra/runtime-core` holds the deterministic executor and inference port; `@indra/runtime-choreography` holds the XState conductor and actor interpreter; and this package, the host, stands at the outer edge, depending on all three and supplying what the inner packages cannot see: a concrete inference adapter. The inner packages remain free of any model binding because the host holds it.

## What it does

The host exports one function, `start()`. Calling it assembles the full actor system against the `skeleton` program — the walking skeleton `@explore` actor — and the `InferenceLive` layer, which wraps the BAML async client as the `Inference` service. It then creates an XState actor from the resulting conductor machine, attaches a listener that writes `OUTPUT` event text to stdout, starts the actor, and opens a readline interface over stdin. Each line read from stdin becomes a `USER_INPUT` event sent to the running conductor.

Running `start()` fires real model calls. It requires `ANTHROPIC_API_KEY` in the environment.

If the entry module runs as the main script (`import.meta.main === true`), it calls `start()` directly, which lets the package serve as a runnable entry point without a separate CLI wrapper.

## Exports

```ts
export const start: () => void
```

That is the entire public surface.

## Architecture

The dependency graph runs inward only, and the host sits at its outer boundary:

```text
@indra/runtime-contracts     (no workspace dependencies)
        ↑
@indra/runtime-core          (depends on contracts)
        ↑
@indra/runtime-choreography  (depends on core and contracts)
        ↑
@indra/runtime-host          (depends on all three; imports InferenceLive)
```

The `package-boundaries` spec requires that only the host imports a concrete adapter. The core, choreography, and contracts packages carry no model binding. This is not a convention enforced by code review; the workspace dependency graph makes it structural — the inner packages have no path to reach the adapter.

The host assembles the system through `makeActorSystem` from `@indra/runtime-choreography`, passing the `skeleton` program and the `InferenceLive` layer imported from the `@indra/runtime-core/inference-live` subpath. That subpath is the deliberate seam: the core's main export never re-exports `InferenceLive`, so nothing that depends on the core through its main entry point can accidentally pull in the BAML binding.

The host carries no tests. The offline test suite in the inner packages assembles the same actor system with an `InferenceStub` layer, so the deterministic behavior is covered there without any model dependency. Tests for the live path require a real `ANTHROPIC_API_KEY` and are handled as gated live tests in the core package.

### What is planned but not yet built

The `extract-inference-adapter` change will move the BAML adapter out of `@indra/runtime-core` and into a dedicated `@indra/runtime-inference-baml` package. When that happens, the host will import `InferenceLive` from `@indra/runtime-inference-baml` rather than from the core's subpath export. The public surface of the host — `start()` — does not change; only the import site of the adapter shifts.

The `skeleton` program wired here is provisional. It is the hand-authored `@explore` actor that proves the full execution path. A later change will supply programs through a validated IR loaded from outside the host rather than a constant baked into the package.
