# context-state

## Purpose

The `context-state` capability owns the `&context`, `&user`, and `&signals` namespaces of the INDRA runtime. State is STM-backed so that multiple actors can run in parallel against a shared transactional whiteboard. The capability defines the staged-versus-immediate `set:` semantic, the atomic turn-boundary commit, protection of runtime-owned namespaces, transactional serialization of contending commits, and strict initialization of all referenced context paths before the first turn.

## Requirements

### Requirement: Staged perform-level mutations are invisible within their own turn

A `set:` executed inside an actor's `perform:`/`then:` block SHALL be staged and SHALL NOT be visible to any read during the same turn, including `when:` guards and interpolations within that turn. The staged value SHALL become visible on the next turn after the turn-boundary commit.

#### Scenario: A perform-set does not affect a same-turn guard

- **WHEN** an actor stages `&context.value = "new"` in its `perform:` block and then evaluates `when: &context.value is "new"` in the same turn
- **THEN** the guard reads the committed value (not `"new"`) and the `otherwise:` branch executes

#### Scenario: A staged value is visible next turn

- **WHEN** an actor stages `&context.value = "new"` and the turn ends
- **THEN** the value is committed at the turn boundary
- **AND** the next actor to take a turn reads `&context.value` as `"new"`

### Requirement: Sequence-level mutations are immediate within the sequence

A `set:` executed inside a `sequence:` block SHALL be applied immediately and SHALL be visible to subsequent steps within the same sequence.

#### Scenario: A sequence-set is visible to a later step

- **WHEN** a sequence sets `&context.x = 1` in step 1 and reads `&context.x` in step 2
- **THEN** step 2 reads `1`

### Requirement: Protected namespaces reject program writes

A `set:` targeting `&user` or `&signals` SHALL be rejected with a read-only violation error before any state cell is modified. These namespaces are written only by the runtime.

#### Scenario: Writing to &user is rejected

- **WHEN** a program attempts `set: &user.latest = "x"`
- **THEN** the runtime raises a read-only violation error and `&user` is unchanged

### Requirement: Commits to shared context are serialized

When two actors commit mutations to the same `&context` path, the runtime SHALL serialize the commits transactionally so that no update is lost, retrying a conflicting commit against the latest committed value.

#### Scenario: Two actors contend on the same path across a yield point

- **WHEN** actor A stages a mutation to `&context.counter` and parks at an `await:` inference call, and actor B commits a mutation to `&context.counter` before A resumes
- **THEN** A's commit retries against B's committed value rather than overwriting it
- **AND** the final committed state reflects both commits, not a lost update

### Requirement: Initial context must be fully initialized

Before the first turn, the runtime SHALL trace every `&context` path referenced anywhere in the resolved program and verify the root `dialogue … with:` block initializes each one. If any referenced path is uninitialized, the runtime SHALL halt with a fatal incomplete-initial-state error. There is no global context to inherit from.

#### Scenario: A referenced but uninitialized path halts execution

- **WHEN** a component reads `&context.quest.status` but the root `with:` block does not initialize `quest.status`
- **THEN** the runtime halts before turn one with a fatal incomplete-initial-state error naming the missing path
