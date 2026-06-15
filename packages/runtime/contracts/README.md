# @indra/runtime-contracts

This package holds the shared type vocabulary for the INDRA runtime workspace. Every other `@indra/runtime-*` package may depend on it. It depends on none of them.

## Why it exists

The `@indra/runtime-*` packages enforce a single directional rule: dependencies run inward, toward the contract, never outward or in a cycle. Placing the shared types in their own package makes that rule structural. The TypeScript compiler rejects any import that would cross the boundary in the wrong direction, so the rule is no longer a comment in an architecture document — it is a fact the build enforces.

The package imports nothing from the workspace. Its only external dependency is `effect`, which it uses for the tagged error constructors in `errors.ts`.

## What it exports

Three modules make up the public surface, all re-exported from `src/index.ts`.

### Program types (`types.ts`)

The full type system for an INDRA `.in` program. A `Program` is a resolved document: an entry actor id, an initial world keyed by namespace, and a table of `ActorDef` records keyed by id.

Every type in this module is plain, serializable data — no functions, no class instances. That constraint is load-bearing. An `ActorDef` is passed to XState as an actor's `input` value, which means it must survive structured serialization and snapshot persistence. The runtime holds no behavior in the program representation; behavior lives in the interpreter that reads these data structures.

The types descend from the root `Program` through `ActorDef` and `PerformBlock` to individual `Branch` records. Each branch carries an optional `GuardExpr` (the `when:` condition), a list of `SetStatement` records that run before the turn ends, and a `Terminator` that describes how the turn closes. A terminator is one of three forms: `say` emits text to the host and returns control, `await` spawns a child interpreter and stores its output, and `return` carries a final value out of the actor.

`ValueExpr` is the expression type that appears wherever the program needs to produce a value. It resolves to a literal, a read from the world at a given `ContextPath`, or a call to a named inference function via `InferenceRef`. The `ContextPath` type identifies a location in the world by namespace and a sequence of path segments. The five namespaces are `context`, `user`, `signals`, `dialogue`, and `args`; the program can write to `context` and `dialogue`, while `user` and `signals` are read-only to program code.

### Error taxonomy (`errors.ts`)

The four typed errors the runtime raises, plus the closed union `IndraError` that names all of them.

Each error class extends `Data.TaggedError` from `effect`, which gives each instance a literal `_tag` field. The XState boundary collapses Effect failures to rejected promises, and the `_tag` lets the choreography layer switch on the error kind after that transition.

The four errors are:

- `IncompleteInitialStateError` — a path that the program references was never initialized in the root `with:` block.
- `ReadOnlyViolationError` — a `set:` statement targeted `&user` or `&signals`, which the program is not permitted to write.
- `ToolInvocationError` — a tool or inference call threw; wraps the underlying cause so the failure carries a tagged value rather than an opaque rejection.
- `InferenceParseError` — BAML retries were exhausted and the typed result never parsed successfully.

### Choreography contract (`choreography-contract.ts`)

The types shared between the runtime core and the choreography layer. This contract is provisional: the `say:`-routing and `await:`-resume seams between these two layers are not yet fully built, so the shapes here will evolve as those seams are completed.

`TurnOutcome` is what the core's turn evaluator hands back when a turn reaches its terminator — a resolved `say`, `await`, or `return` with its concrete values filled in. The event types describe what crosses the choreography boundaries at runtime: `ConductorEvent` covers everything the conductor receives (user input from the host, plus control signals from the actor it spawned); `OutputEvent` is what the conductor emits to host subscribers when a `say:` turn completes; and `IndraActorEvent` is the single `TURN` event the conductor sends to trigger an actor's next turn.

## Architecture

The package sits at the root of the dependency graph by design. No workspace package appears in its `dependencies` or `devDependencies` beyond the shared tooling packages. This means a dependency cycle through `@indra/runtime-contracts` is impossible by construction: there is nothing here for another package to depend back on.

The build uses rslib for the JavaScript output and TypeScript project references for declaration files. In development, Bun resolves the package directly from source through the `bun` export condition, so no build step is required to work with the types locally.
