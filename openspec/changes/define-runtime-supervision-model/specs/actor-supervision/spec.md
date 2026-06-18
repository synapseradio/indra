# actor-supervision

## Purpose

The `actor-supervision` capability owns how the conductor schedules and supervises a tree of actors. `interpreter-runtime` defines the single turn cycle — one actor, identified, run to a settling action, committed at the boundary. This capability defines the layer around that cycle: what a turn and a turn boundary are, how many actors may be live at once and in what order the conductor dispatches them, how await and loop suspension move an actor in and out of the runnable set, and what happens to a supervisor when the actor it awaits fails.

The principle underneath it is that logical concurrency never costs determinism. Many actors may be in flight, but the conductor runs exactly one turn at a time and chooses the next by a fixed rule, so the same program over the same inputs and the same inference outputs produces the same dispatch sequence on every run.

## ADDED Requirements

### Requirement: A turn runs from dispatch to a settling action, and every settling action is a turn boundary

A turn SHALL be one actor's execution from the moment the conductor dispatches it to its next settling action. A settling action SHALL be exactly one of `say:`, `return:`, `await:`, or a loop suspension, as `interpreter-runtime` defines. The point at which a turn settles SHALL be a turn boundary. An `await:` SHALL be a turn boundary like any other settling action: the awaiting actor parks, control returns to the conductor, and the boundary's mailbox observation happens there. There SHALL be no execution between dispatch and the settling action at which control returns to the conductor.

#### Scenario: An await is a turn boundary

- **WHEN** an actor reaches an `await:` — including an `await:` on an inference call
- **THEN** the turn settles, control returns to the conductor, and the mailbox is observed at that boundary before the next turn dispatches

#### Scenario: A say settles the turn at a boundary

- **WHEN** an actor reaches a `say:`
- **THEN** the turn settles, its staged writes commit at the boundary, and the conductor observes the mailbox before dispatching the next turn

### Requirement: Actors are logically concurrent over a serial conductor

The runtime SHALL allow many actors to be live at once — runnable, or parked at an `await:` or a loop suspension — while the conductor dispatches exactly one turn at a time. No two turns SHALL execute simultaneously. "Parallel actors," wherever the specs use the phrase, SHALL mean this logical concurrency, physically serialized by the conductor. Because turns do not overlap and `framework-native-contracts` gives each value a single writer, two turns SHALL never contend for the same state.

#### Scenario: Two live actors do not execute simultaneously

- **WHEN** two actors are both live and runnable
- **THEN** the conductor runs one actor's turn to its boundary before dispatching the other, and at no point are both executing

#### Scenario: A parked actor stays live without executing

- **WHEN** an actor is parked at an `await:`
- **THEN** it remains live on the delegation stack and consumes no turn until the awaited actor returns and makes it runnable again

### Requirement: The conductor selects the next actor by a deterministic rule

When more than one actor is runnable, the conductor SHALL select the next actor to dispatch by a fixed, deterministic rule over the runnable set, not by wall-clock arrival, thread timing, or any nondeterministic source. The same program, over the same inputs and the same inference outputs, SHALL produce the same dispatch sequence on every run.

#### Scenario: Dispatch order is reproducible across runs

- **WHEN** a program with several runnable actors is run twice with identical inputs and identical inference outputs
- **THEN** the conductor dispatches the actors in the same order both times and the runs produce identical state

#### Scenario: Selection does not depend on arrival timing

- **WHEN** two actors become runnable in different wall-clock orders across two runs, with all else equal
- **THEN** the conductor's selection is the same in both runs, because the rule reads the runnable set and not arrival time

### Requirement: Await and loop suspension move an actor through the runnable set

An `await:` SHALL remove the awaiting actor from the runnable set and push it onto the delegation stack until the awaited actor returns, at which point the value is delivered as `interpreter-runtime` specifies and the awaiting actor becomes runnable again. A loop suspension SHALL leave its actor runnable, to be dispatched again on a later turn so the loop advances across turns under its `max_iterations` bound. A `return:` SHALL remove its actor and make its supervisor runnable with the returned value.

#### Scenario: A returned value makes the supervisor runnable

- **WHEN** an awaited actor reaches `return:`
- **THEN** the actor is removed, its typed value is delivered to the awaiting actor, and the awaiting actor re-enters the runnable set to resume after its `await:`

#### Scenario: A loop-suspended actor is dispatched again

- **WHEN** a turn ends in a loop suspension
- **THEN** the actor stays runnable and the conductor dispatches it again on a later turn, advancing the loop until it terminates or hits `max_iterations`

### Requirement: An actor failure propagates to its supervisor as a typed value

When an actor halts with an error, the runtime SHALL deliver a typed failure to its supervisor — the actor that awaits it — rather than returning `null`, vanishing, or failing silently. The supervisor SHALL receive the failure at the same typed seam its successful return would use, so its turn logic can branch on it. A failure that reaches the root with no supervisor to receive it SHALL halt the program with the typed error. Restart and recovery strategies beyond propagation are out of scope for this capability.

#### Scenario: A child failure reaches the awaiting supervisor

- **WHEN** an awaited actor halts with an error
- **THEN** its supervisor becomes runnable and receives a typed failure at the await seam, rather than a `null` or a silent return

#### Scenario: An unhandled root failure halts the program

- **WHEN** a failure propagates to the root actor and no supervisor remains to receive it
- **THEN** the program halts with the typed error rather than continuing
