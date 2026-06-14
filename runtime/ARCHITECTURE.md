# Architecture of `runtime/`

This document explains how the code under `runtime/` embodies the three-layer design described in [docs/architecture.md](../docs/architecture.md). That page tells the conceptual story — XState owns choreography, Effect owns the substrate, BAML owns inference — and walks a turn from input to commit. This one is the layer below it: what each directory is for, which directory may depend on which, the promises the parts hold each other to, and the places the runtime is deliberately built to grow. Read the conceptual page first. Come here before opening files.

## Why a deterministic runtime exists

INDRA's thesis is that a reasoning process is a program, not a prompt. The structure of that program — which actor takes a turn, which branch its guard selects, what gets written to the shared world, when writes become visible — runs identically every run, because it is executed by ordinary code. The model is consulted only at the marked inference points, the `<...>` direct-prompt channel, and each consultation is one typed function call that returns a value the runtime can check.

That split is what `runtime/` owns: the deterministic execution of an INDRA program and the typed seam through which inference enters it. It refuses to own judgment. No guard, no branch selection, no commit, and no control transfer is ever delegated to a model. It also refuses, today, to own parsing: the program it executes is a hand-authored syntax tree, and turning `.in` files into that tree is a separate capability tracked in [docs/toolchain.md](../docs/toolchain.md). The semantic authority for what the runtime should do lives in `openspec/specs/`, not in this directory. The runtime is the specs' executable counterpart, and where the two diverge the divergence is recorded rather than papered over.

## The concepts

**The program is data.** The runtime executes a `Program`: an entry actor id, an initial world, and a table of actor definitions (`src/ast/types.ts`). Every type in that file is plain, serializable JSON-shaped data — no functions, no class instances. The one program that exists is hand-authored in `src/ast/programs/skeleton.ts`, a single `@explore` actor derived from `legacy/commands/explore.in`. The AST is the shape a parser will one day emit, authored by hand until then.

**Actors and turns.** An actor is a definition, not a hand-written machine. It carries persona data (`identity`, `rules`, `understands`) and a `perform` block holding its turn logic: a `method`, a `goal`, and an ordered list of branches, each with an optional `when:` guard, a list of `set:` statements, and a terminator. A turn is one dispatch of that logic to completion: the first branch whose guard passes runs its sets in order, then its terminator decides what happens next — `say:` emits text and yields, `await:` delegates to another actor, `return:` finishes with a value (`src/effect/turn.ts`).

**Staged and immediate state.** The shared `&context` world lives in Effect STM as three transactional cells: the committed world, a sequence overlay, and a staged overlay (`src/effect/context-store.ts`). A `sequence`-level `set:` lands in the sequence overlay and is readable immediately within the turn. A `perform`-level `set:` lands in the staged overlay, which the read path never consults, so it stays invisible — even to the actor that wrote it — until the turn-boundary commit folds both overlays into the committed world.

**The conductor.** One machine holds the turn baton (`src/xstate/conductor.machine.ts`). It validates the initial world, spawns the entry actor, then loops through `idle`, `ingesting`, `dispatching`, and `committing`. User input is ingested through the one privileged write path, a turn is dispatched, and the commit happens in exactly one state, between one turn settling and the next dispatching. The human enters the system through this loop as `USER_INPUT`, and `say:` output leaves it as an emitted `OUTPUT` event.

**The inference channel.** Inference is a service behind an Effect tag (`src/baml/inference.ts`). The interface promises a typed value — the skeleton's one function returns a `WelcomeResult` with a `reasoning` field declared first and a `message` field after it — and the service has no access to the store, so inference completes to a plain value before any transaction opens. The live implementation (`src/baml/inference.layer.ts`) wraps the generated BAML client and is the only module in the system through which a real model call is reachable. Tests substitute a stub layer that returns a fixed result.

**Personas are data.** An actor's `identity`, `rules`, and `understands` are not executed line by line. They are rendered as a reusable system-role template (`baml_src/personas.baml`) that frames what the model sees at the actor's inference points. A persona shapes inference and drives no turn.

## How the source is organized

The directory split mirrors the three-layer split, plus the vocabulary the layers share.

`src/ast/` is the vocabulary. It holds the types every other directory operates on — `Program`, `ActorDef`, `Branch`, `Terminator`, `ValueExpr`, `ContextPath` — and the one hand-authored program under `programs/`. It imports nothing from the rest of the runtime, which is what lets everything else import it freely.

`src/effect/` is the deterministic substrate. `context-store.ts` is the STM whiteboard and the commit fold, with `context-store.layer.ts` as its dependency-injection seam. `path.ts` is the pure read, write, and read-only-guard machinery the store composes inside its transactions. `turn.ts` is the deterministic evaluation of one turn: guard evaluation, branch selection, set execution, and terminator resolution, including the call that completes inference to a value. `initial-state.ts` is the pure completeness check that runs before turn one. `errors.ts` is the tagged-error taxonomy. `runtime.ts` packages the store and inference layers into the `ManagedRuntime` that XState leaves run effects through.

`src/xstate/` is the choreography. `conductor.machine.ts` and `indra-actor.machine.ts` are the only two machines: the conductor that owns the turn loop and the commit, and the one generic interpreter that every INDRA actor runs as, parameterized by its `ActorDef` passed as input. `leaves.ts` wraps each substrate operation as a `fromPromise` actor and is the sole crossing point into Effect. `actors.ts` is the assembly point that wires a program, an inference layer, the leaves, and the machines into one runnable system. `events.ts` names the events that cross the choreography boundaries.

`src/baml/` is the inference seam: the service interface and stub in `inference.ts`, the live Anthropic-backed layer in `inference.layer.ts`. The split within this small directory is load-bearing. The interface module imports only types from the generated client, which are erased at runtime, so resolving the tag or building a stub never loads the BAML native binding. Only the live layer imports the generated client's value side.

`src/test/` is the offline suite plus the gated live test. The `seam-*.test.ts` files pin the semantics the design depends on — staging invisibility, sequence immediacy, parallel STM commit, typed return — and the `derisk-*.test.ts` files exercise the riskier mechanics such as STM contention and dynamic dispatch. `live-turn.live.test.ts` drives one real turn against the model and is skipped without an API key.

`baml_src/` holds the `.baml` sources: the client configuration, the persona template, the one inference function, and the generator settings. `baml_client/` is the generated TypeScript client, gitignored and produced by `bun run generate`. `experiments/` holds de-risking experiments with their own BAML projects, each carrying a `findings.md`. Experiments are evidence, not product code, and nothing under `src/` imports them.

`src/index.ts` is the live entrypoint: it assembles the system over the skeleton program with the real inference layer, prints `OUTPUT` events to stdout, and feeds stdin lines in as `USER_INPUT`.

## Boundaries

The dependency direction is inward, toward data. `src/ast/` depends on nothing in the runtime. `src/effect/` depends on `src/ast/` and on the inference interface in `src/baml/inference.ts`, never on `src/xstate/`. `src/baml/` depends on `src/effect/errors.ts` for its error types and on the generated client. `src/xstate/` depends on all three, and `src/index.ts` assembles everything. This is the import graph as built, and the inward-only rule for the substrate is stated in the header of `src/effect/turn.ts` rather than left to convention: the turn evaluation is pure Effect over the store and the inference service, with no XState in sight.

Each edge has a rule.

At the AST edge, the rule is serializability. An `ActorDef` is handed to XState as a spawned actor's `input`, so it must survive structured serialization and snapshot persistence. That is why the AST is plain data with no behavior: the one generic interpreter reads the data, and the variation between actors lives in the data rather than in per-actor machines. It is also what makes rehydration possible, since a snapshot can restore an actor by re-reading its blueprint through a fixed registered source.

At the Effect-to-XState edge, the rule is one crossing point and tagged errors. XState reaches the substrate only through the `fromPromise` leaves in `src/xstate/leaves.ts`, and a failing effect rejects with the tagged-error instance itself (via `Cause.squash`) rather than an opaque fiber failure, so a machine's `onError` handler can switch on `event.error._tag`. This is the standing mitigation for the impedance between Effect's typed error channel and XState's untyped rejection.

At the inference edge, the rule is that nondeterminism stays behind the tag. The substrate consumes the `Inference` interface and never the live layer. The live layer is the single module that can fire a network call, and the offline suite never constructs it. The interface returns typed values and has no access to the store, so the model can never write the world — it can only produce a value a turn then stages.

At the world edge, the rule is that program state lives exclusively in Effect. XState context holds control-flow data only: which actor is active, what it is awaiting, a pending delegation. Two sources of truth for the world would drift, so the boundary is structural rather than advisory.

## Contracts

These are the promises the parts keep, each checkable in the file named.

The AST is serializable, always. No functions, no class instances, anywhere in a `Program` (`src/ast/types.ts`). Breaking this breaks actor spawning and any future persistence.

There is exactly one commit of staged writes, at the turn boundary, owned by the conductor. The commit folds the sequence overlay first and the staged overlay second in a single transaction, so when one turn both sequence-sets and perform-stages the same path, the staged write wins — the considered end-of-turn intent overrides the intermediate computation (`src/effect/context-store.ts`). The transaction body is pure transactional-reference operations, and because Effect's STM type cannot embed a general effect, the rule that the model call stays outside the transaction is enforced by the compiler.

Reads never see the staged overlay. The read path resolves the committed world unioned with the sequence overlay and nothing else, which is the single fact that produces the staging semantics rather than a flag checked in many places (`src/effect/context-store.ts`).

The `&user` and `&signals` namespaces are read-only to programs. A program `set:` into either fails with a tagged `ReadOnlyViolationError` before any cell is touched, and the only way those namespaces change is the runtime-privileged path the conductor uses to ingest user input (`src/effect/path.ts`, `src/effect/turn.ts`).

Inference returns are typed, and the typed shape leads with reasoning. Every inference function declares its output as a BAML class, with a free-form `reasoning` field declared before the typed payload so the model produces its chain of thought before committing the value (`baml_src/explore.baml`). Retry exhaustion surfaces as `InferenceParseError`, raised before the commit, so a failed inference leaves the world untouched (`src/baml/inference.layer.ts`, `src/effect/errors.ts`).

The initial world is checked for completeness before turn one. Every `&context` path the program references must be initialized by the program's initial world, because INDRA has no global context to inherit defaults from. The check is pure, traces every reference across all actors, and halts the conductor with a fatal `IncompleteInitialStateError` naming the first missing path (`src/effect/initial-state.ts`).

Errors are a closed, tagged union. `IncompleteInitialStateError`, `ReadOnlyViolationError`, `ToolInvocationError`, and `InferenceParseError` are the only errors the runtime raises, each a `Data.TaggedError` whose `_tag` survives the crossing into XState (`src/effect/errors.ts`).

## Seams

The runtime is a walking skeleton by design: the thinnest vertical that exercises all three layers, with the places it must grow recorded explicitly. The archived extraction design keeps the full seam log (`openspec/changes/archive/2026-06-12-extract-deterministic-runtime/design.md`, section "Seam log"). The seams that matter to a reader of this directory are these.

**`say:` does not yet route control.** The language defines `say: to:` as naming which component takes the next turn. As built, the conductor treats every `PASS_CONTROL` the same way: it re-emits the text as host output and returns the baton to the same entry actor, ignoring the `to:` target (`src/xstate/conductor.machine.ts`). The intended routing semantics are captured in the interpreter-runtime spec.

**Delegation does not yet resume.** The language defines `await:` as a call with resumption: the awaiting actor continues from the await point once the child returns. As built, the awaiting actor stores the child's result into its `store_in:` path and then finalizes (`src/xstate/indra-actor.machine.ts`). Related to the same rebuild, `store_in:` is required on the await node and `&result` is not yet a namespace, so the spec'd fallback of landing an unstored result in `&result` has nowhere to go yet.

**`each`, `until`, and `become` are defined but not executed.** The AST has no node forms for loops, and the guard grammar covers `is`, `isNot`, and `exists` while the language's full expression surface — ordered comparators, ternary, `${expr}` splices, truthiness — is specified but unbuilt (`src/ast/types.ts`). `become:` is anticipated by the same mechanism that makes `await:` work: every actor is the one registered generic interpreter parameterized by data, so a parameterized `become:` is the same spawn with a different blueprint.

**A no-branch turn falls through.** A turn whose `then:` block matches no branch and has no `otherwise:` settles as an implicit `return: null` (`src/effect/turn.ts`). The specs exclude this case statically — every `then:` block must be total — and the fall-through is a recorded gap until load-time totality validation lands.

**Inference dispatch is hand-coded.** The turn evaluator recognizes exactly one inference function by string comparison and fails any other name with a `ToolInvocationError` (`src/effect/turn.ts`). This is the placeholder for a registry: inference functions referenced by name in the program and bound to implementations at load time. The related composition layer — splicing an inference into a template, back-referencing an earlier generation — is de-risked in `experiments/inference-fidelity/` but not built, and today's `select` field on an inference reference is its first installment, picking one typed field out of a result and discarding the rest.

**The AST is becoming an IR.** The design anticipates promoting `src/ast/types.ts` from an internal detail to a versioned, validated intermediate representation: the public artifact that multiple front-ends compile to and the only thing the runtime executes, with load-time validation closing the no-branch fall-through, the dangling `await:` target, and the hand-coded dispatch in one move. An in-flight change under `openspec/changes/define-program-ir/` carries that promotion. This document describes the runtime as built, and the IR is the direction the seams above converge on.

The stance that governs that growth is worth naming, because it generates the IR's individual decisions rather than summarizing them after the fact: **the format is generous, execution is strict, and refusal is loud and named.** The document format grows additively, and its version changes only when the meaning of an existing form changes — so a document written against old forms stays readable by every runtime that ever read them. Whether a loaded runtime *executes* a construct is a separate question, answered by a declared capability set rather than by the parser. And when the runtime declines — an unrecognized version, an unsupported construct, an unresolved reference — it refuses before turn one with an error naming the cause. It never skips, guesses, or reinterprets what it read, because this document is executed, and partially understanding an executable document means running a program its author did not write.

**The `&dialogue` namespace is provisional.** The runtime defines it and user-input ingestion writes `&dialogue.latest_dialogue_entry`, but no language source defines a `&dialogue` namespace. Whether it becomes part of the language or goes away is an open question deferred to the parser seam, recorded in the seam log as S15.

## Discrepancies observed

The README's pointer to the extraction design names `../openspec/changes/extract-deterministic-runtime/design.md`, but the change is archived and the document lives at `../openspec/changes/archive/2026-06-12-extract-deterministic-runtime/design.md`. The archived path is the one this document cites.

Beyond that stale link, I found no place where the repo docs and the code disagree on behavior. The two places where the language and the runtime diverge — `say:` routing and resume from await — are stated as gaps in both [docs/language.md](../docs/language.md) and the seam log, and they are documented as seams above rather than as discrepancies.
