## Why

Two shipped specs assume a runtime that no shipped spec defines. `context-state` and `signal-system` both speak of "parallel actors," and `signal-system` grounds its whole mailbox discipline on signals being "observed at turn boundaries" — yet `interpreter-runtime` describes a single conductor stepping one active actor through one global turn sequence, and never says what "the active actor" or a "turn boundary" means when several actors are live at once. The scheduling model is referenced by name and defined nowhere.

`scope-context-by-actor-subtree` makes the gap explicit: it declares supervisor-tree mechanics — actor spawning, await resumption, control routing, loops, parallel actors, and supervision on failure — out of its own scope and assigns them to "a separate change" that does not exist. This is that change.

The absence has concrete costs the spec review surfaced. "Deterministic" is the headline invariant, but determinism over more than one live actor needs a defined dispatch order, and there is none. `signal-system` contradicts itself: it forbids preempting a turn mid-execution, then describes an interjection restarting an actor "while B is running." And "observed at turn boundaries" is never reconciled with the fact that an `await:` — the longest-latency operation in the system, since it covers an inference call — is itself a suspension point. Each of these is a question about the scheduling model, so each is answered here.

## What Changes

- Define the **turn** and the **turn boundary**. A turn is one actor's execution from dispatch to its next settling action — `say:`, `return:`, `await:`, or a loop suspension. Every settling action is a turn boundary. An `await:` is therefore a boundary, not an exception to one: the actor parks, control returns to the conductor, and the mailbox is observed there.
- Define **logical concurrency over a serial conductor**. Many actors may be live at once — runnable, or parked at an await — but the conductor dispatches exactly one turn at a time. "Parallel actors" is logical concurrency, physically serialized. No two turns execute simultaneously, so there is no shared-memory race to resolve; combined with the typed, single-writer state `framework-native-contracts` establishes, nothing contends.
- Make **dispatch order deterministic**. The conductor selects the next actor from the runnable set by a stated deterministic rule, so a program with the same inputs and the same inference outputs takes the same dispatch sequence every run. This is the property "deterministic" names once more than one actor is live.
- Reconcile **no preemption with interjection**. A signal — including an interjection — is observed only at a turn boundary. An interjection restarts the innermost active actor on its *next* dispatch, after the in-flight turn settles. Nothing is restarted mid-execution, so the no-preemption rule and the interjection rule hold on the same trace.
- Order the **classification predicates**. A user input is matched against signal / awaited-response / interjection in a fixed order, first match wins: a leading `*` is always a signal, even at an `await: @user` prompt. "Exactly one of" becomes decidable.
- Specify **failure propagation** up the delegation stack. An actor that halts with an error delivers a typed failure to its supervisor — the actor awaiting it — rather than vanishing or silently returning null; an unhandled failure at the root halts the program. Restart strategies beyond propagation are named as an open question, not specified here.
- Land the **control mechanics and user-command surface** the scheduling model presupposes. `interpreter-runtime` already specifies `say:` routing to a named component and resumption from the await point, and `signal-system` already specifies `*command` translation into a signal object, the `*trace` visibility-only toggle, deterministic `*help` routing, and the restricted instruction-payload subset. None is implemented, and no other change owns them. Because this change is what makes "which actor takes the next turn" and "a `*command` at an `await:`" well-defined, it carries their implementation rather than leaving them stranded against a scheduling model that now exists. These add no requirements: the behavior is already specified, and this change implements it.

## Capabilities

### New Capabilities

- `actor-supervision`: the scheduling and supervision model — the turn and turn-boundary definition, logical concurrency over a serial conductor, deterministic dispatch order, the runnable set and how await/loop suspension and resumption move actors through it, and failure propagation up the delegation stack.

### Modified Capabilities

- `signal-system`: the interjection rule is restated as boundary-observed (no mid-execution restart); the three-mode classification gains an explicit predicate order; "observed at turn boundaries" is tied to the `actor-supervision` definition of a boundary; and the `&signals` recording requirement is restated in the typed runtime-owned-input terms `framework-native-contracts` establishes, since the namespace model is retired.

## Impact

- Gives `interpreter-runtime` the scheduling model its turn cycle assumes. The single-conductor cycle it specifies is the per-turn step; this change defines how the conductor chooses which actor takes the next turn.
- Lets `scope-context-by-actor-subtree` reference a real supervision tree: it scopes how state is *seen* across the tree; this change defines how the tree is *spawned, scheduled, and supervised*.
- Makes the "deterministic" claim in the README and `interpreter-runtime` defensible for multi-actor programs, and removes the `signal-system` self-contradiction the review flagged.

## Sequencing

- Depends on `framework-native-contracts`: the typed single-writer state model is what makes serialized dispatch race-free and lets this change assert no contention. The `&signals` restatement also depends on it.
- Composes with `scope-context-by-actor-subtree`: that change assumes a spawned, supervised tree; this change defines it. They share no requirements and may land in either order, but the README's isolation and determinism claims are both true only once both have landed.
- Restart and supervision strategies beyond failure propagation (Erlang-style supervisor restarts, backoff, escalation) are deferred to a later change. This one specifies that failure propagates and where it halts, not how a supervisor might recover.
