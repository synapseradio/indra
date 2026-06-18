## Why

The runtime's contract package describes itself, in its own header, as "the parsed shape of an INDRA `.in` program" and "the parser's eventual output" (`packages/runtime/contracts/src/types.ts:1-12`). Every type in it is shaped by that premise. Inference is referenced by a string name to be resolved later (`InferenceRef.fn`, `:50-54`). An awaited actor writes its result into a string-addressed slot rather than returning it (`Terminator.await.storeIn`, `:96-101`). All state lives in one global world addressed by dotted string paths across a fixed namespace set (`World`, `Namespace`, `ContextPath`, `:28-42`). That is the shape of a compiled language, not of a framework a developer writes against in TypeScript.

INDRA is a TypeScript framework with a deterministic runtime, not a language. The contract is where that has to become real. While the executable model is a stringly-typed parse tree, every surface built on it inherits the language's ergonomics and forfeits the type safety the framework exists to provide. This change makes the contract framework-native — typed, authored in TypeScript, free of string-name and string-path indirection — so the type system carries guarantees the runtime would otherwise check by hand.

## What Changes

- **Inference leaves become direct typed function references.** An actor names the inference function it calls by holding the function, not a string key bound through a registry at load.
- **Awaiting an actor returns its typed value.** The `storeIn` slot and the result-namespace fallback are removed; an awaited actor yields a typed value to the caller's turn logic, which binds it where it needs it.
- **State becomes typed, scoped values rather than a global string-addressed world.** Each actor's private state is a typed value; frames are typed immutable values readable down a subtree; runtime-owned inputs are typed. The dotted-path-and-namespace model is retired.
- **The execution structure stays inspectable data.** An actor's turn logic remains a structure of guarded branches and terminators the one generic interpreter reads. The typing lives at the TypeScript authoring surface; the structure the runtime walks stays data. The framework's determinism and its static validation depend on this, so it is preserved deliberately.
- **The contract is reframed** from "the parsed shape of a language" to "the framework's typed actor model that the TypeScript API constructs." A future `.in` parser becomes one more producer of that model, never its definition.
- Actor definitions are no longer plain JSON, because they hold function references. Persistence is deferred, so nothing depends on their serializability today; the seam is handed to the persistence capability when it lands.

## Capabilities

### Modified Capabilities

- `context-state` — the state model: typed, scoped state replaces the global namespaced world and its dotted-path addressing.
- `inference-layer` — an inference point holds a direct typed function reference rather than a name a host registry resolves.
- `interpreter-runtime` — an awaited actor returns a typed value; state access is typed; the "actor definition as data the generic interpreter reads" model survives, with its state representation changed.

## Impact

- Rewrites the core of `packages/runtime/contracts/src/types.ts`: `InferenceRef`, `Terminator`, `ValueExpr`, `SetStatement`, and the `World`/`Namespace`/`ContextPath` cluster.
- Touches the live runtime that reads those types: the turn executor (`packages/runtime/core/src/effect/turn.ts`), the store and path resolution (`packages/runtime/core/src/effect/path.ts`), the generic interpreter (`packages/runtime/choreography/src/indra-actor.machine.ts`), and the initial-state walker (`packages/runtime/core/src/effect/initial-state.ts`).
- Re-authors the skeleton program (`packages/runtime/core/src/programs/skeleton.ts`) against the typed API.
- Ripples into `scope-context-by-actor-subtree`: its frames, private context, and crossings, specified in dotted-path terms, are restated in typed terms. Typed scoped state lets the type system carry part of the no-meld guarantee, which narrows what the load-time validator must check and resolves that change's open question on how much of the scope a type can carry.

## Sequencing

This is the next change and the foundation the others rebase onto.

- It lands first.
- `scope-context-by-actor-subtree` is updated to the typed model, as the scoping and isolation layer built on top of typed state.
- `validate-program-at-load` — the validation spine salvaged from `define-program-ir` — comes after, validating the typed structure.
- `define-program-ir` is dissolved: its validation requirements move to `validate-program-at-load`, and the rest (a versioned serializable document format, the name registry, forward-declared constructs) is dropped as language-era framing.
