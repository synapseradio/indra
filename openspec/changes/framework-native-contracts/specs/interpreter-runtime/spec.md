## ADDED Requirements

### Requirement: Turn logic is inspectable data authored through a typed surface

An actor's turn logic — its guarded branches, its guards, and its terminators — SHALL be a data structure the one generic interpreter reads, not opaque executable code. The TypeScript authoring surface SHALL be a typed builder that produces this structure with full type information; the developer writes typed TypeScript and never a string, while the runtime walks data. The runtime's determinism, its static totality check, and its static reference checks all depend on the structure being readable before it runs, so turn logic SHALL NOT be expressed as an opaque function body.

#### Scenario: The interpreter reads turn logic as data

- **WHEN** the generic interpreter executes any actor
- **THEN** it reads the actor's branches, guards, and terminators as a data structure
- **AND** static validation can walk that structure before the first turn without executing it

#### Scenario: The typed surface builds the data

- **WHEN** a developer authors an actor through the TypeScript API
- **THEN** the API yields the same inspectable structure the interpreter reads, with the author's types checked at author time

### Requirement: Turn logic is built from a fixed construct vocabulary

An actor's turn logic SHALL be expressed through a fixed vocabulary of constructs, each a named node in the inspectable structure, so that every term the specs use is defined rather than assumed:

- A **`then:`** is a turn body: an ordered list of branches. Each branch except the last carries a **`when:`** guard; the final branch is a guardless **`otherwise:`**. Totality is this structural shape, as `interpreter-runtime` and `program-validation` require.
- A **`when:`** is a guard expression on a branch, evaluated against committed state only. An **`otherwise:`** is the guardless final branch that runs when no earlier guard matches.
- A **`perform:`** is a branch's action block: zero or more staged writes to the actor's private state followed by exactly one settling action (`say:`, `return:`, `await:`, or a loop suspension). Its writes are staged and invisible within the same turn, committing at the turn boundary.
- A **`sequence:`** is an ordered block of steps evaluated as intermediate computation within a turn, whose writes apply immediately and are visible to later steps in the same sequence. A `sequence:` is not a settling action and does not end a turn.
- A **`set:`** is a single write of a typed value into the actor's private state, staged when it appears in a `perform:` and immediate when it appears in a `sequence:`.

These constructs are the only vocabulary the generic interpreter walks; the typed builder produces nodes only from this set.

#### Scenario: A then block is an ordered branch list ending in otherwise

- **WHEN** the interpreter reads an actor's `then:`
- **THEN** it finds an ordered list of branches, each but the last carrying a `when:`, and the last a guardless `otherwise:`

#### Scenario: A perform stages writes and ends in one settling action

- **WHEN** a branch's `perform:` is executed
- **THEN** its `set:` writes are staged into private state, invisible within the turn, and the block ends in exactly one settling action

#### Scenario: A sequence applies writes immediately within the turn

- **WHEN** a `sequence:` writes a value in one step and a later step reads it
- **THEN** the later step reads the written value, and the `sequence:` does not settle the turn

## MODIFIED Requirements

### Requirement: Delegation is a call stack with resumption

An await action SHALL push the awaiting actor's state onto a call stack and transfer control to the awaited actor. The awaited actor SHALL end with a return action carrying a typed value, except the human actor, which returns implicitly with the user's input. The returned value SHALL be delivered to the awaiting actor as a typed value, which its turn logic binds into a field of its own private state. There is no result slot and no stored-path fallback: the awaiting actor names the typed destination. After the value lands, the awaiting actor SHALL resume from the point immediately after the await, with its pre-await state restored.

#### Scenario: The awaiting actor resumes after the await point

- **WHEN** an actor awaits another, and the awaited actor returns a typed value
- **THEN** the returned value is delivered at its declared type and bound into the awaiting actor's private state
- **AND** the awaiting actor resumes from immediately after the await, not from the top of its turn, and does not finalize

#### Scenario: A returned value has a typed destination, not a fallback slot

- **WHEN** an awaited actor returns a value
- **THEN** the awaiting actor receives it as a typed value and binds it where its turn logic names
- **AND** no result namespace and no implicit fallback destination is involved

### Requirement: Program state lives only in the context substrate

All program-visible state SHALL live in the typed state substrate: an actor's private state, the frames it inherits, and the runtime-owned inputs it reads. The choreography layer SHALL hold only control-flow phase data, never program state. No program state SHALL be addressed by dotted string path or namespace.

#### Scenario: Every state read resolves to a typed value

- **WHEN** any actor reads program state during a turn
- **THEN** the value comes from a typed state value — its private state, an inherited frame, or a runtime-owned input — not from a dotted-path lookup and not from choreography-layer state
