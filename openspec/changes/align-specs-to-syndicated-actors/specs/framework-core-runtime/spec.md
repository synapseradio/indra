# framework-core-runtime

## Purpose

An agentic program coordinates several agents, and two problems recur under every feature it ships. One agent produces a result another needs, so the framework has to move that result to whoever needs it. And an agent's answer is only as good as its context, so the framework has to keep one agent's working state out of another's prompt unless it is meant to be shared. A third problem sits under both: the same program, run twice on the same inputs, should behave the same way, even though the model inside it does not.

`framework-core-runtime` is the deterministic execution core that answers the third problem and gives the other two a place to stand. It is renamed from `interpreter-runtime` because the old name framed INDRA as a language an interpreter walks. INDRA is a TypeScript framework whose core is a runtime that carries out a program the same way every time.

The capability owns the single canonical turn cycle, the deterministic dispatch rule that fixes the order of turns, the settling actions and iteration frames that guarantee every turn settles, supervision through retraction, and the total side-effect-free expression evaluator. One generic interpreter actor carries out every INDRA actor, parameterized by the actor's definition as data. A turn observes the facts its actor is permitted to see, runs, and settles by asserting a typed fact or suspending. Coordination is reactive: an actor takes a turn when a fact it observes appears or retracts. The non-determinism lives only at the inference boundary; the dispatch around it is fixed.

## Foundational terms

An INDRA developer works with two verbs — **observe** and **assert** — and one control, the **capability**, that bounds both. The definitions below are plain on purpose: a developer should understand them without prior exposure to the model INDRA borrows from.

- **observe** — declare interest in facts of a given shape. An actor observes a pattern, and the runtime delivers every matching fact as it appears and signals when one retracts. This is subscribing to a slice of shared state.
- **assert** — publish a typed value so interested actors receive it. Asserting calls no one; it places the value where every actor observing that shape will see it.
- **fact** — the typed value an assertion carries. The current facts together are the program's shared state.
- **assertion** — a published fact together with its lifetime. It is retained while its actor maintains it and retracted automatically when that actor ends, whether by a clean exit or a crash, so a vanished fact is itself a failure signal. A **message**, by contrast, is a one-shot send that is not retained.
- **dataspace** — the one shared pool where every published fact lives and from which each observed fact is delivered. There is a single dataspace; an actor never sees all of it, only the facts its capability admits.
- **capability** — an actor's handle to the dataspace, narrowable so the holder may observe and assert only some facts. The narrowing is **attenuation**, and it is where isolation is set. A capability is a scoped permission, like a read-only key to one storage bucket; attenuation is minting a child key that can do less.
- **context** — what an actor brings to an inference: the facts it observes, plus its own private working state. Private state an actor has not asserted stays private, and no other actor can read it. Shared context is a fact more than one actor observes.

INDRA leaves two terms from the borrowed model behind, and a developer meets neither. The **entity** — an addressable unit inside an actor — is folded into the actor, so the actor is the only unit. The borrowed model's network-layer **scope** — a relay-addressing concept — is dropped because INDRA runs in-process; it shares only its spelling with the everyday word "scope" and carries none of its meaning here.

## ADDED Requirements

### Requirement: The runtime carries out one canonical turn cycle

The runtime SHALL carry out every turn through a single canonical cycle: select the next turn by the deterministic dispatch rule, assemble the actor's context from the facts it observes, run its turn logic (with guards reading only committed state), check for loop suspension, settle through a settling action or a suspension, and commit staged writes at the turn boundary. The boundary commit SHALL be the only commit of staged writes, occurring as a single step between turn N settling and turn N+1 dispatching. The runtime SHALL NOT commit staged writes mid-turn. A committed assertion produced by a turn becomes observable to other actors only after the boundary commit.

#### Scenario: The commit happens between turns, not within them

- **WHEN** an actor stages a write during its turn and the turn settles
- **THEN** the staged write is committed exactly once, after the turn settles and before the next turn dispatches
- **AND** no read during the settling turn observes the staged value

#### Scenario: Guards read committed state only

- **WHEN** an actor's turn logic evaluates a guard after a write staged earlier in the same turn
- **THEN** the guard reads the committed value from before the turn began

### Requirement: Turns settle only through a settling action or a suspension

Every turn SHALL end through exactly one settling action — asserting a typed fact, or returning a typed value to the turn's continuation — or through a loop suspension. Turn logic SHALL be total: every branch set carries a guardless final branch or its guards are exhaustive. Totality SHALL be enforced before the first turn by `program-validation`, which rejects a non-total program at load time, naming the actor and the block.

#### Scenario: A turn cannot end without settling

- **WHEN** a validated program carries out a turn
- **THEN** the turn ends through exactly one settling action or a loop suspension

#### Scenario: A non-total turn body is rejected at load

- **WHEN** a program is loaded in which an actor's turn body has guarded branches but no guardless final branch and no exhaustive guard set
- **THEN** the program is rejected before turn one with a validation error naming the actor and the non-total block

### Requirement: Turn dispatch follows a deterministic rule

The runtime SHALL fix the order of turns by a deterministic dispatch rule applied to the state of the dataspace, so that the structure and the order around every inference run the same way each time even though the inference itself does not. The rule SHALL define three things together:

- **Inter-turn order.** When more than one actor is runnable, the runtime SHALL choose among them by a deterministic ordering over the runnable set, never by arrival time or wall clock.
- **Intra-turn batch consistency.** A turn SHALL observe an atomic snapshot of the dataspace taken at dispatch. Facts asserted or retracted after the snapshot SHALL NOT become visible mid-turn. When a single turn asserts more than one fact, the reactions those facts trigger SHALL be ordered by the same deterministic rule, so no reader ever observes a partial state.
- **Cycle termination.** When observation is cyclic, the dispatch rule SHALL bound iteration through the reified loop frame and its hard iteration cap, so a cycle cannot run unbounded.

The dispatch rule SHALL be the only source of cross-actor ordering; no actor SHALL depend on the order in which asynchronously-arriving facts happened to land.

#### Scenario: Two runnable actors dispatch in a defined order

- **WHEN** two actors become runnable from facts asserted in the same boundary commit
- **THEN** the runtime dispatches them in the order fixed by the deterministic rule, and a re-run of the same program over the same inputs dispatches them in the same order

#### Scenario: A turn sees a consistent snapshot

- **WHEN** a fact is asserted by another actor after the current turn has been dispatched
- **THEN** the current turn does not observe that fact, and observes only the snapshot taken at its dispatch

### Requirement: Actors are logically concurrent over a single serial dispatch

The runtime SHALL present actors as logically concurrent — each reacting independently to the facts it observes — while carrying out their turns one at a time in a single serial dispatch. Logical concurrency SHALL NOT introduce parallel mutation: every turn runs to its boundary commit before the next turn dispatches.

#### Scenario: Concurrent reactions run serially

- **WHEN** several actors are simultaneously runnable because each observes a fact that just appeared
- **THEN** the runtime carries out their turns one at a time, each committing at its boundary before the next dispatches

### Requirement: An actor's assertions retract when it terminates, and a supervisor reacts

When an actor terminates, whether by an orderly exit or a crash, the runtime SHALL automatically retract every assertion that actor published. Failure SHALL surface as the retraction of an expected fact rather than as a thrown control-flow signal. A supervising actor SHALL observe the retraction, or the absence of an expected assertion, and react by the supervision policy it declares, which MAY restart the failed actor.

#### Scenario: A crash retracts the actor's facts

- **WHEN** an actor crashes mid-turn before its boundary commit
- **THEN** every fact that actor had asserted is retracted automatically
- **AND** no partial state from the crashed turn is committed

#### Scenario: A supervisor reacts to the missing fact

- **WHEN** a supervised actor terminates and its assertions retract
- **THEN** the supervisor observes the absence of the expected assertion and reacts by its declared policy

### Requirement: One generic interpreter actor carries out every INDRA actor

The runtime SHALL register exactly one generic interpreter actor and instantiate every INDRA actor from it, passing the actor's definition (identity, turn logic, observed patterns) as serializable data. The generic interpreter SHALL read turn logic as an inspectable data structure rather than as opaque executable code, so that the runtime's determinism and the load-time checks can walk the structure before it runs. Every instantiation target SHALL be the same spawn operation parameterized by different data.

#### Scenario: The interpreter reads turn logic as data

- **WHEN** the generic interpreter carries out any actor
- **THEN** it reads the actor's branches, guards, and settling actions as a data structure that static validation can walk before the first turn

#### Scenario: Every actor is one interpreter parameterized by data

- **WHEN** the runtime instantiates two different INDRA actors
- **THEN** both are instances of the one registered generic interpreter, differing only in their input data

### Requirement: Expression evaluation is total, deterministic, and side-effect-free

The runtime SHALL evaluate every expression deterministically, with no side effects, yielding a value or a typed expression error for every input. `is` SHALL be type-strict structural deep equality with no coercion — operands of different types compare false; `not` SHALL be its negation. Ordered comparators (`greater_than`, `less_than`, `greater_than_or_eq`, `less_than_or_eq`) SHALL be defined only when both operands are numeric and SHALL otherwise raise an expression type error. Truthiness SHALL treat `false`, `null`, `0`, `""`, `[]`, and `{}` as falsy and every other value as truthy. An existence check on a state reference SHALL be true if and only if the reference resolves to a present, non-null value. A ternary SHALL evaluate only the branch its condition selects. An interpolation SHALL evaluate the expression and stringify the result.

#### Scenario: is does not coerce across types

- **WHEN** a guard compares a numeric state value to the string `"3"` while the value holds the number `3`
- **THEN** the comparison is false because the operands have different types

#### Scenario: An ordered comparison on non-numeric operands is an error

- **WHEN** an expression evaluates `"abc" greater_than 2`
- **THEN** the runtime raises an expression type error rather than producing a value

#### Scenario: A ternary evaluates one branch

- **WHEN** a ternary's condition is true and its false branch contains an expression that would error
- **THEN** only the true branch is evaluated and no error is raised

### Requirement: Suspended until-loops are reified frames

When a turn suspends inside an `until:` loop, the runtime SHALL capture the loop as an explicit frame — iteration count, condition, `max_iterations`, position in the loop-body structure, and local state — held in the actor's private state. Resumption SHALL restore the frame exactly and continue from the suspension point. `max_iterations` SHALL be a hard limit counted across turns, and it SHALL be the mechanism that bounds cyclic observation. A settling action inside an `until:` loop SHALL terminate the loop and settle the turn. Nested loops SHALL each maintain an independent frame.

#### Scenario: A loop resumes from its frame

- **WHEN** an `until:` loop suspends at iteration 3 and control later returns to the actor
- **THEN** the loop resumes at iteration 3 from the saved position with its local state restored

#### Scenario: max_iterations bounds the loop across turns

- **WHEN** a loop with `max_iterations: 5` has accumulated 5 iterations across multiple suspensions and resumptions
- **THEN** the loop terminates rather than iterating a sixth time

### Requirement: Halting is never gated by trace visibility

A fatal fault — a violation of the runtime's invariants the turn cannot continue past, as distinct from an external tool failure — SHALL always halt execution and SHALL always be recorded in the error channel, regardless of the trace setting. The trace flag SHALL gate only whether the fault's message is printed. A tool failure SHALL be non-fatal: the runtime logs a warning, the operation yields `null`, and execution continues.

#### Scenario: A fatal fault halts with trace off

- **WHEN** a fatal fault occurs while trace mode is off
- **THEN** execution halts and the fault is recorded in the error channel
- **AND** only the printing of the message is suppressed

#### Scenario: A tool failure continues with null

- **WHEN** a tool call fails or times out during a turn
- **THEN** the runtime logs a non-fatal warning, the operation's value is `null`, and the turn continues

### Requirement: Shared state lives in the dataspace, and private state stays private

State shared between actors SHALL live in the dataspace as assertions. An actor SHALL make a value visible to other actors only by asserting it as a fact, and SHALL read another actor's state only by observing a fact that actor asserted. An actor's working state that it has not asserted SHALL remain private and unreadable by any other actor, and no actor SHALL reach into another actor's private context.

#### Scenario: Cross-actor reads go through observed facts

- **WHEN** actor A needs a value actor B holds
- **THEN** A obtains it by observing a fact B asserted, not by reading B's private context

#### Scenario: Unasserted state stays private

- **WHEN** actor B holds working state it has not asserted as a fact
- **THEN** no other actor can read that state, because only an asserted fact is observable

## REMOVED Requirements

### Requirement: Delegation is a call stack with resumption

**Reason**: The delegation call stack with `await:` / `store_in:` / `&result` is replaced by reactive coordination. A producer asserts its result as a typed fact and a consumer that observes the matching pattern reacts, so sequencing falls out of observation rather than a call-and-resume stack.

**Migration**: Replace `await: @B store_in: <path>` with an observation: actor A observes the fact B asserts when it finishes, and reacts to it. A value formerly read at `&result` is read as the body of the observed fact.

### Requirement: A say action routes control

**Reason**: `say:`-routing by name selected the next component by naming it, which is the global control flow SAM removes. The next turn is selected by the deterministic dispatch rule over what each actor observes, not by a named hand-off.

**Migration**: Replace `say: to: @B what: <text>` with asserting a fact that B observes. Output to the human is an assertion the human, as an actor, observes; see `signal-system`.

### Requirement: Become creates a single-turn persona actor

**Reason**: The `become:` operation spawned a temporary single-turn actor whose constraints came from a named persona. Only the spawn is removed: a persona is no longer something the runtime instantiates as an actor. Persona itself is kept and redefined as an agent's authored configuration in `agent-configuration`, a value with no actor lifecycle. The generic-interpreter-reads-data idea this requirement also carried is kept, restated without `become:`, under "One generic interpreter actor carries out every INDRA actor".

**Migration**: Express a one-off specialized turn as an ordinary actor instantiated from the generic interpreter with its own turn logic and observed patterns. The constraints formerly supplied by a `become:` persona record are supplied as a persona that parameterizes the actor; see `agent-configuration`.
