## ADDED Requirements

### Requirement: State is typed, scoped values

Program-visible state SHALL be typed values, not a single namespaced world addressed by dotted string paths. Each actor SHALL have a private state that is a typed value it alone writes. A supervisor MAY establish a frame: a typed immutable value readable by its subtree and written by no one after establishment. Runtime-owned inputs — the values the former `user` and `signals` namespaces carried — SHALL be typed values the program reads and cannot write. No string-keyed namespace union and no dotted-path addressing SHALL be part of the state model.

#### Scenario: Private state is a typed value

- **WHEN** an actor reads or writes its private state
- **THEN** the access is to a typed value checked at author time, not a dotted path resolved at runtime

#### Scenario: A frame is a typed immutable value

- **WHEN** a supervisor establishes a frame and a descendant reads it
- **THEN** the descendant reads a typed value
- **AND** no actor writes the frame after establishment

#### Scenario: Runtime-owned inputs are typed and read-only

- **WHEN** program logic references a runtime-owned input
- **THEN** the reference is a typed read, and a write to it is a type error at author time rather than a violation rejected at commit

## MODIFIED Requirements

### Requirement: Staged perform-level mutations are invisible within their own turn

A write staged inside an actor's turn logic SHALL target that actor's private state, SHALL be staged, and SHALL NOT be visible to any read during the same turn, including guards and interpolations within that turn. The staged value SHALL become visible after the turn-boundary commit.

#### Scenario: A perform-set does not affect a same-turn guard

- **WHEN** an actor stages a write to a field of its private state and then evaluates a guard reading that field in the same turn
- **THEN** the guard reads the committed value, not the staged one, and the fallback branch executes

#### Scenario: A staged value is visible next turn

- **WHEN** an actor stages a write to its private state and the turn ends
- **THEN** the value is committed to that actor's private state at the turn boundary
- **AND** the actor reads the new value on its next turn

### Requirement: Sequence-level mutations are immediate within the sequence

A write executed inside a sequence SHALL target the executing actor's private state, SHALL be applied immediately, and SHALL be visible to subsequent steps within the same sequence.

#### Scenario: A sequence-set is visible to a later step

- **WHEN** a sequence writes a field of private state in step one and reads it in step two
- **THEN** step two reads the written value

### Requirement: A staged perform-set wins over a same-turn sequence-set at commit

When a single turn both sequence-writes and perform-stages the same field of an actor's private state, the staged perform-write SHALL win at the turn-boundary commit. The sequence write is intermediate computation; the staged write is the actor's considered end-of-turn intent.

#### Scenario: Same-field collision resolves to the staged value

- **WHEN** a turn sequence-writes a private-state field to one value and perform-stages it to another
- **THEN** subsequent steps within the sequence read the sequence value
- **AND** after the turn-boundary commit the field holds the staged value

### Requirement: Initial context must be fully initialized

Before the first turn, the runtime SHALL verify that every typed state value an actor reads has an initial value: an actor's private state from its declared initial state, and a frame from the supervisor that establishes it. If a read has no initializer, the runtime SHALL halt before turn one with an incomplete-initial-state error naming the value and the owning scope.

#### Scenario: An uninitialized read halts before turn one

- **WHEN** an actor reads a private-state field or a frame value that no initializer provides
- **THEN** the runtime halts before turn one with an incomplete-initial-state error naming the value and its owning scope

## REMOVED Requirements

### Requirement: Commits to shared context are serialized

**Reason**: The typed state model has no shared mutable cell. Private state has a single writer and frames are immutable, so two actors never contend on the same value. There is nothing to serialize, and the serialization-and-retry requirement has no scenario to satisfy.

### Requirement: Protected namespaces reject program writes

**Reason**: The namespace union is retired. Runtime-owned inputs are now typed read-only values, so a program write to one is a type error at author time rather than a runtime-rejected commit. The guarantee is restated in "State is typed, scoped values" and carried by the type system instead of a commit-time check.
