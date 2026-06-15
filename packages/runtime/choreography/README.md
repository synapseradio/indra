# @indra/runtime-choreography

`@indra/runtime-choreography` is the XState layer of the INDRA runtime. It contains the conductor state machine, the one generic actor interpreter, the effectful leaves that bridge XState to Effect, and the assembly function that wires all three into a runnable system.

## Why it exists

The INDRA runtime separates two concerns that need different tools. The deterministic work — evaluating turns, managing context state, validating programs — lives in `@indra/runtime-core` and uses Effect for its concurrency model and typed error handling. The turn-sequencing work — deciding when a turn runs, holding the commit boundary, managing actor lifetimes — needs explicit state. That is an XState problem: statecharts make the legal transitions visible and enforceable, and their snapshot model supports rehydration from persisted JSON.

This package owns the XState side of that line. It depends on `@indra/runtime-core` inward; the core does not depend on it. The boundary between the two packages is `leaves.ts`, the sole module where an Effect operation crosses into a `fromPromise` actor that an XState machine can invoke.

## The problem it solves

INDRA programs are documents: a map of named actors, each with a definition that describes what it does. The runtime needs something to read those documents and drive them — to know when to start a turn, which actor to send it to, when a turn has finished, and when to commit the staged writes so they become visible in the next turn.

The choreography package provides that driver. The conductor holds the turn baton and the single commit boundary. The actor interpreter reads an `ActorDef` passed as serializable input and runs the turn against it. Because the interpreter is a registered actor identified by the string `"indraActor"` rather than a runtime-built closure, a conductor snapshot survives a JSON round-trip and rehydrates correctly: the machine logic resolves by name, and the actor definition restores from data.

## Exports

### `makeActorSystem(program, inference)`

Assembles a complete runnable system from a `Program` and an inference `Layer`. Returns an `ActorSystem` containing the conductor machine and the Effect `ManagedRuntime` it runs against.

```ts
const { machine, runtime } = makeActorSystem(program, InferenceLive);
const conductor = createActor(machine, { input: { program } });
conductor.start();
```

The caller drives the conductor by sending `USER_INPUT` events and listening for `OUTPUT` events, which carry the text produced by a `say:` terminator.

### `ActorSystem`

The object `makeActorSystem` returns. Two fields: `machine` (the `ConductorMachine` ready to pass to XState's `createActor`) and `runtime` (the `IndraRuntime` that the leaves run against, exposed so tests can query the Effect context store directly).

### `ConductorMachine` / `makeConductor`

The conductor state machine. It validates the program, spawns the entry actor, and cycles through five states on each turn:

```text
validating → spawning → idle → ingesting → dispatching → committing → idle
```

`ingesting` runs `ingestUserInput` to record the user's message before evaluation begins. `dispatching` sends a `TURN` event to the entry actor and waits for `PASS_CONTROL` (a `say:` result) or `ACTOR_DONE` (a `return:` result). `committing` runs `commitTurn`, the single point where staged writes become visible. A `PASS_CONTROL` event also emits an `OUTPUT` event that host code can observe.

The conductor is rarely constructed directly; `makeActorSystem` builds it.

### `IndraActorMachine` / `makeIndraActor`

The generic actor interpreter. Every INDRA actor in a program is played by this same machine, parameterized by the `ActorDef` and the full actor registry passed as input at spawn time. There are no per-actor machines; what varies between actors lives in the definition data, not in separate statecharts.

A turn ends in one of three states corresponding to the three terminators:

- `say:` — the machine sends `PASS_CONTROL` to the conductor, then returns to `idle` to wait for the next `TURN`.
- `return:` — the machine enters its final state and sends `ACTOR_DONE` to its parent.
- `await:` — the machine spawns a child interpreter, waits for the child to finish, stages the child's output at the declared `storeIn` path, then enters its final state.

### `makeLeaves(runtime)`

Produces the `Leaves` object: five `fromPromise` actors that run Effect operations through the `IndraRuntime`. Each leaf converts Effect failures to tagged-error instances via `Cause.squash` rather than exposing an opaque `FiberFailure`, so XState `onError` handlers can inspect `event.error._tag` when they need to distinguish failure kinds.

The leaves are: `validateInitial`, `ingestUserInput`, `runTurn`, `stageValue`, and `commitTurn`.

`makeLeaves` is an internal dependency of `makeActorSystem`. It is exported because tests that build custom machine configurations sometimes need to replace individual leaves with instrumented versions.

## Architecture

The package's four modules form a layered assembly:

`leaves.ts` sits at the bottom. It holds the only import of Effect in this package and the only place where XState sees an Effect operation. Everything above it is pure XState.

`indra-actor.machine.ts` and `conductor.machine.ts` sit in the middle. The conductor owns the `indraActor` actor registration and the event loop. The actor machine owns the turn logic and the `await:` child-spawn path. Neither imports the other's source; the conductor receives the actor machine as a parameter to `makeConductor`.

`actors.ts` sits at the top. `makeActorSystem` calls `makeIndraRuntime` from `@indra/runtime-core`, then `makeLeaves`, then `makeIndraActor`, then `makeConductor`, passing each result into the next. It is the assembly point and the public entry for any caller that does not need to substitute individual pieces.

## Dependencies

| Package | Role |
| --- | --- |
| `@indra/runtime-contracts` | `Program`, `ActorDef`, `TurnOutcome`, `Json`, `ContextPath` — the IR types and the shared contract |
| `@indra/runtime-core` | `makeIndraRuntime`, the five Effect operations the leaves wrap, and `Inference` |
| `xstate` | State machines, `createActor`, `fromPromise`, `setup` |
| `effect` | `Effect`, `Exit`, `Cause`, `Layer` — used only in `leaves.ts` |
