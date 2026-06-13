# INDRA runtime architecture

INDRA is a real language with a deterministic runtime. A program written in INDRA describes actors that take turns reasoning over a shared world, and the runtime executes that program the same way every run. The one place nondeterminism is allowed in is inference: each `<...>` direct-prompt point is a single typed call to a language model, and nothing else in the system is left to a model's discretion.

This document is about how the runtime executes a program. If you want the author's view of what a program *is* — the channels, actors, personas, and namespaces you write in a `.in` file — read the language overview in [language.md](./language.md) first and come back. Everything here maps to real modules under `runtime/src/`, and every claim about behavior cites the file you can read to check it.

## The shape of the system

Three libraries split the work, and the boundaries between them do not overlap. The split is the load-bearing idea of the whole runtime, so it is worth stating plainly before anything else.

XState owns choreography. It holds the actors, the turn loop, the delegation call stack, and the transfer of control between `say:`, `await:`, and `return:`. A single conductor actor holds the turn baton and owns the one place writes become permanent.

Effect owns the substrate. File access, the typed error taxonomy, dependency injection, and the shared `&context` world all live here. State sits in Effect's software transactional memory, so actors can run in parallel against one transactional whiteboard rather than passing messages that each carry a private copy of the world.

BAML owns inference. Every `<...>` becomes one typed function, and a persona becomes a reusable system-role template the function renders. The model returns a typed value, never free text the runtime has to parse and trust.

The rule that keeps these three honest is a single invariant: the world lives exclusively in Effect. XState context holds only control-flow data — which actor is active, what it is awaiting, where a loop's counter sits. Two sources of truth for program state would drift apart, so the boundary is enforced rather than merely encouraged. `runtime/src/effect/turn.ts:20-31` states this as the inward-only dependency rule: the deterministic turn evaluation is pure Effect over the context store and the inference service, and XState reaches the store only through one bridging leaf.

## Where the world lives

The `&context` whiteboard is STM-backed, and it is built from three transactional cells (`runtime/src/effect/context-store.ts:6-22`). The committed cell holds the consistent state every read sees at a turn boundary. A sequence overlay holds immediate writes that are visible within the current turn. A staged overlay holds the writes that stay invisible until the turn-boundary commit.

The single fact that produces INDRA's staging semantics is the read path. A read resolves the committed world unioned with the sequence overlay, and it never reads the staged overlay (`runtime/src/effect/context-store.ts:120-127`). That one omission is what makes a `perform:`-level `set:` invisible even to the actor that just wrote it, while a `sequence`-level `set:` is visible immediately. The distinction is not a flag checked in many places; it falls out of which overlay the reader is allowed to see.

The namespaces a path can address are `context`, `user`, `signals`, `dialogue`, and `args` (`runtime/src/ast/types.ts:36`). A program may write `context` and `dialogue`. The `dialogue` namespace exists in the runtime but in no protocol source, and whether it becomes a defined part of the language or goes away is an open question tracked in [toolchain.md](./toolchain.md). The `user` and `signals` namespaces are read-only to programs and writable only through a runtime-privileged path, so a program cannot forge user input or signal state. The write guard rejects a program `set:` into a read-only namespace before it touches any cell, raising a tagged `ReadOnlyViolationError` (`runtime/src/effect/context-store.ts:93-103`, `runtime/src/effect/errors.ts:25-30`).

## A turn, start to finish

A turn is one message handled to completion by one actor. The actor is internally sequential — it runs its turn from start to finish without interruption — and many actors can run in parallel against the shared world. Signals arrive in a mailbox and are observed at turn boundaries, never as a mid-turn interruption, which is the discipline that lets turn-boundary handling stay compatible with parallel actors.

The deterministic evaluation of a turn lives in `runtime/src/effect/turn.ts`. The conductor's turn cycle reads, top to bottom: clear both overlays at the start of the turn, pick the branch whose `when:` guard passes, run that branch's `set:` statements in order, then resolve the terminator to concrete values (`runtime/src/effect/turn.ts:172-193`). Reading happens against committed state plus the sequence overlay, so a guard always sees the world as it stood at the last commit, never a write staged earlier in the same turn.

Crucially, inference completes to a plain value here, *before* any commit. A `<...>` resolves to a `WelcomeResult` (or whatever the function's return type is), and the turn stages writes but never folds them. The commit is a separate step the conductor owns, and that separation is what keeps the model call outside the transaction by construction (`runtime/src/effect/turn.ts:24-31`, `88-112`).

## The commit boundary

There is exactly one place staged writes become permanent: the conductor's `committing` state (`runtime/src/xstate/conductor.machine.ts:102-108`). The conductor loops through `idle`, `ingesting`, `dispatching`, and `committing`, and the commit happens in that one state, between one turn settling and the next one dispatching. That is what makes "staged writes become visible next turn" literally true rather than a figure of speech (`runtime/src/xstate/conductor.machine.ts:6-18`).

The commit folds the sequence overlay first, then the staged overlay, into the committed cell, in a single transaction, then clears both overlays (`runtime/src/effect/context-store.ts:153-165`). Folding sequence before staged means that when one turn both sequence-sets and perform-stages the same path, the staged write wins — the considered end-of-turn intent overrides the intermediate computation.

Two properties hold because of how this is built rather than because someone remembered to check them. First, the transaction body is pure transactional-reference operations; Effect's STM type cannot embed a general effect, so the rule "the inference call is outside the transaction" is checked by the compiler, not by convention (`runtime/src/effect/context-store.ts:20-22`). This matters because a transaction can retry, and a retried inference call would re-fire — billing again and producing a different completion each time. Second, because XState guards read pre-assignment context, a staged write cannot leak into a same-turn `when:` guard even by accident; the framework's evaluation order enforces the rule for free.

The commit loop is instrumented. `storeFromRefs` takes an `onCommitAttempt` hook, called on every execution of the transaction body, so attempts minus successful commits equals the number of STM retries (`runtime/src/effect/context-store.ts:105-119`, `153-165`). On the current single-isolate runtime that count is one attempt per commit, because Effect evaluates an STM body synchronously and atomically within one isolate. The hook is the meter to re-read when a genuinely parallel runtime makes commits simultaneous, at which point STM's serialize-and-retry becomes the mechanism that prevents lost updates without hand-rolled locking.

## How an actor is interpreted

Every INDRA actor is the same registered machine. The runtime does not compile each actor to a distinct XState chart; it registers one generic interpreter and parameterizes it with the actor's definition, passed as serializable `input` (`runtime/src/xstate/indra-actor.machine.ts:13-32`). The statechart structure that varies between actors lives in the parsed program, not in a pile of hand-authored machines. This is also what makes durable execution and rehydration possible: the logic is a fixed registered source, and the variation is plain data, so a snapshot can restore an actor by re-reading its blueprint.

The actor definition is plain, serializable data throughout (`runtime/src/ast/types.ts:1-12`). An `ActorDef` carries `identity`, `rules`, and `understands` — the persona data the inference layer renders — plus a `perform` block holding the turn logic: a `method`, a `goal`, an optional `output`, and an ordered list of branches (`runtime/src/ast/types.ts:111-129`). The runtime never holds behavior in the AST. Behavior lives in the one interpreter that reads the data.

The interpreter's own states are small. It starts idle, runs a turn only when the conductor hands it a `TURN` event, and after a `say:` it returns to idle and waits for the next turn (`runtime/src/xstate/indra-actor.machine.ts:73-128`). Starting idle rather than running at spawn is deliberate: it lets the first turn see the user input the conductor has already ingested.

## The three terminators

A turn ends one of three ways, and the terminator decides where control goes next (`runtime/src/ast/types.ts:84-98`).

A `say:` resolves its text, returns the actor to idle, and hands control back to the conductor as a `PASS_CONTROL` event (`runtime/src/xstate/indra-actor.machine.ts:84-97`). The conductor re-emits that text as a host-observable `OUTPUT` event and then commits (`runtime/src/xstate/conductor.machine.ts:87-100`). This is how a turn's words reach the outside world.

A `return:` carries an output value, sends the actor to a final state, and notifies the parent with `ACTOR_DONE` (`runtime/src/xstate/indra-actor.machine.ts:106-114`, `185-191`). A returning actor is finished; its output is what the awaiting parent captures.

An `await:` is delegation, and it is the most involved of the three. The awaiting actor spawns the named target as a child interpreter, hands it a `TURN`, waits for the child's `ACTOR_DONE`, stages the child's result into the path named by `store_in:`, and then ends its own turn (`runtime/src/xstate/indra-actor.machine.ts:130-183`). The child is the same generic interpreter, resolved at action time to break the self-reference; an `await:` chain is therefore a real call stack of nested interpreters, each one a turn-taking actor in its own right.

## The human inside the loop

The human is not an operator standing outside the runtime poking at it. The human is an actor inside the turn loop. The conductor's idle state waits for a `USER_INPUT` event, and the only thing that moves it out of idle is the human speaking (`runtime/src/xstate/conductor.machine.ts:73-85`). When the human speaks, the conductor ingests that input through the one privileged path that may write the read-only namespaces, landing the text in `&user.latest` (`runtime/src/effect/turn.ts:206-222`). Then it dispatches a turn.

So a human utterance and an actor's turn are the same kind of event in the same loop: each acquires the conductor's baton, each is ingested and then dispatched, and each settles through the same commit boundary. The human does not bypass the boundary or reach into the world directly. A `say:` whose target is `@user` is the runtime yielding the baton back for the human's next turn. This symmetry — human turns and actor turns flowing through one loop and one commit — is the design's stance on what an interactive INDRA session is.

## Errors

The runtime raises a closed union of tagged errors (`runtime/src/effect/errors.ts:54-59`). Each is an Effect `Data.TaggedError`, so the value carries a literal `_tag` that the XState boundary can switch on after the error collapses to a rejected promise — the mitigation for the impedance between Effect's typed errors and XState's untyped rejection.

`IncompleteInitialStateError` is fatal and fires before the first turn: a program referenced a `&context` path the root world never initialized, and there is no global default to inherit (`runtime/src/effect/errors.ts:10-19`). `ReadOnlyViolationError` is the write-guard rejection described above. `InferenceParseError` means BAML's retries were exhausted and the typed value never parsed; it is raised before the commit, so nothing staged is folded and the world is left untouched (`runtime/src/effect/errors.ts:43-52`). `ToolInvocationError` wraps a failed tool or inference invocation in a tagged value rather than an opaque rejection.

## What runs today, and what is interpreted from data

The offline core is complete and exercised against a stub inference layer that never touches the network. The generic interpreter, the conductor turn cycle, the STM-backed store with staged-versus-immediate semantics, the typed inference return path, and `await:` delegation all run and are covered by tests (`runtime/src/test/`). The live seam is proven separately: a gated test drives one full turn against the real model and asserts the machine settles back to idle (`runtime/src/test/live-turn.live.test.ts`).

The program the runtime executes is an AST. Today that AST is hand-authored in `runtime/src/ast/programs/skeleton.ts` rather than parsed from a `.in` file, and the AST types carry comments saying as much — they are the parser's eventual output (`runtime/src/ast/types.ts:11-12`). The skeleton is one actor, `@explore`, derived from `legacy/commands/explore.in` with its delegation stripped out: it reads `&dialogue`, runs one inference, and says the typed result. The walking skeleton proves the seams; parsing is a separate capability. For what is planned beyond the running core — the parser, module resolution, the CLI, the REPL, the language server, and the inference pipeline — see [toolchain.md](./toolchain.md).

## Navigating `runtime/src/`

A reader who wants to follow execution through the code can walk it in the order the runtime does.

- `ast/types.ts` is the vocabulary: the shape of a program, an actor, a branch, a terminator, a value expression. Read this first; everything else operates on these types.
- `ast/programs/skeleton.ts` is the one hand-authored program, useful as a concrete example of the types in `ast/types.ts`.
- `effect/context-store.ts` is the STM whiteboard, the three overlays, and the commit fold. This is where staging and the commit boundary live.
- `effect/turn.ts` is the deterministic evaluation of a single turn: guards, sets, terminators, and the inference call that completes to a value before any commit.
- `effect/errors.ts` is the tagged-error taxonomy. `effect/path.ts`, `effect/initial-state.ts`, and `effect/runtime.ts` are the supporting substrate — path resolution, initial-world validation, and the managed runtime.
- `xstate/conductor.machine.ts` is the turn baton and the commit boundary — the loop the human enters.
- `xstate/indra-actor.machine.ts` is the one generic interpreter every actor runs through, including the `await:` delegation states.
- `xstate/leaves.ts`, `xstate/actors.ts`, and `xstate/events.ts` wire the Effect substrate into XState as invokable leaves and assemble the actor system.
- `baml/inference.ts` is the inference service interface and its stub; `baml/inference.layer.ts` is the live Anthropic-backed implementation the real entrypoint pulls in.
- `index.ts` is the live, stdin-driven entrypoint that assembles all of the above.
