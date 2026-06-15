# @indra/runtime-core

This package is the deterministic executor of the INDRA runtime. It holds the world store, the turn evaluator, the initial-state validator, the inference port, and the bridge that lets the XState choreography layer run Effect computations. It depends only on `@indra/runtime-contracts`.

## Why it exists

The INDRA runtime splits along one clean joint: things that involve state are kept deterministic and testable in isolation, and the non-deterministic LLM call sits behind a typed port. This package owns the deterministic side. The choreography layer (`@indra/runtime-choreography`) drives the XState conductor and calls into this package through `ManagedRuntime`; it never reaches the store directly. The inward-only dependency rule — choreography depends on core, never the reverse — is a fact the compiler enforces through workspace project references, not a convention.

## The problem it solves

A multi-turn dialogue program runs actors in sequence or in parallel. Each actor reads from a shared world, makes an inference call if needed, stages writes back into that world, and then hands off. Two correctness requirements follow: staged writes from one turn must not be visible to reads within that same turn (so a guard cannot see its own turn's output and route on it), and concurrent actors must not clobber each other's writes when their commits land close together.

This package solves both with a three-cell STM store. The committed cell holds the stable world every read sees. A sequence overlay holds writes that take effect immediately within the same turn. A staged overlay holds writes that become visible only after the turn boundary commit. Effect's STM type makes the third invariant — the LLM call stays outside any transaction — impossible to violate at the type level: the `STM` type forbids embedding an `Effect`, so no inference call can open inside a transaction body.

## Architecture

The package organizes into four areas.

**The store** (`effect/context-store.ts`, `effect/context-store.layer.ts`, `effect/path.ts`) holds the STM-backed `ContextStore` interface and its dependency-injection tag. The store exposes `setImmediate` for sequence-level writes, `setStaged` for perform-level writes, `setPrivileged` for the runtime's own writes to protected namespaces, and `beginTurn`/`commitTurn` for the turn boundary. The `&user` and `&signals` namespaces are read-only to program code; the store returns a `ReadOnlyViolationError` on any program-issued write to those namespaces. Path reads and writes are pure functions (`getAt`, `setAt`) kept separate from the STM layer so they stay trivially testable.

**The turn evaluator** (`effect/turn.ts`) evaluates one actor turn as a pure Effect over the `ContextStore` and `Inference` services. It selects a branch by evaluating guards, runs each `set:` statement at the appropriate write level, and resolves the terminator to a concrete `TurnOutcome`. Inference completes to a plain value before any commit opens. The XState layer runs this through `ManagedRuntime`, which is the only path into the store from outside this package.

**The inference port** (`baml/inference.ts`, `baml/inference.layer.ts`) defines the `Inference` Effect service — a tag and interface with one method per BAML function in the current skeleton — and provides two implementations: `InferenceStub`, a fixed-result layer for offline tests that never loads the BAML native binding, and `InferenceLive`, the live layer that calls the generated BAML client. The live layer is exposed through the `@indra/runtime-core/inference-live` subpath export so importing the main entry point never loads the BAML native binding. This separation is provisional: the planned `extract-inference-adapter` change will move `InferenceLive` and the generated client into a dedicated `@indra/runtime-inference-baml` package, leaving the port and stub in core.

**The ManagedRuntime bridge** (`effect/runtime.ts`) packages the store and inference layers into an `IndraRuntime` value the XState choreography layer holds. XState leaves call `runtime.runPromise` or `runtime.runPromiseExit`; the store and inference services are resolved through that runtime. One runtime per program run holds the world.

The validator (`effect/initial-state.ts`) walks a `Program`'s actors before turn one, collects every `&context` path the program references, and fails with `IncompleteInitialStateError` if any path is absent from the initial world. This runs once and is pure: no STM, no store.

The skeleton program (`programs/skeleton.ts`) is the hand-authored AST for the `@explore` entry actor. It exists to prove execution against all three layers — read `&dialogue`, run one inference, stage one `set:`, and `say:` the typed result — with no parser involved. Its long-term home is a dedicated examples package.

## Public exports

The main entry (`@indra/runtime-core`) exports:

- `makeContextStore` — allocate a `ContextStore` backed by an initial `World`
- `makeStoreRefs`, `makeStoreRefsSharing`, `storeFromRefs` — lower-level store construction for multi-actor scenarios that share a committed cell
- `applyPatch`, `emptyPatch` — patch utilities used by the store and exposed for tests
- `ContextStoreTag`, `ContextStoreLayer` — the Effect tag and layer for dependency injection
- `getAt`, `setAt`, `pathToString`, `isReadOnly` — pure path functions
- `Inference`, `InferenceStub` — the inference service tag and the offline stub layer
- `validateInitialState`, `findUninitializedContextPaths`, `referencedContextPaths` — the initial-state validator and its supporting functions
- `makeIndraRuntime` — build an `IndraRuntime` from an initial world and a chosen inference layer
- `runTurnEffect`, `commitTurnEffect`, `stageValueEffect`, `ingestUserInputEffect` — the turn evaluator and its boundary effects
- `skeleton`, `explore` — the walking skeleton program and its entry actor
- `WelcomeResult` (type) — the inference result shape, re-exported provisionally from the generated BAML client; it moves to `@indra/runtime-contracts` in the `extract-inference-adapter` change

The `@indra/runtime-core/inference-live` subpath exports:

- `InferenceLive` — the live BAML inference layer; importing this subpath is the only way to load the BAML native binding through this package

## Dependencies

Runtime dependencies are `@indra/runtime-contracts` (the IR types and error taxonomy), `effect` (STM, Context, Layer, ManagedRuntime), and `@boundaryml/baml` (the BAML client, which the `extract-inference-adapter` change will move out). Tests run with `@effect/vitest` and `vitest`.
