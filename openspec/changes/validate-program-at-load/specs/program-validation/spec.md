# program-validation

## Purpose

The `program-validation` capability owns the gate between a constructed program and a running conductor. A program is checked completely before anything spawns — the well-formedness of its turn-logic structure, the totality of every `then:` block, the resolution of every actor reference, and the completeness of the initial state every actor reads — so each mistake a producer could author is found before turn one and named precisely, never discovered mid-run on whichever branch a session happened to take.

The principle underneath the gate is that the runtime never runs a program it only partially understands. It executes exactly what the author built, or it refuses with the reason. Because `framework-native-contracts` makes a program a typed structure with direct typed inference references and read-only runtime-owned values, the type system already rejects unbound references and writes to protected values at author time; this capability checks only the residue a type cannot express.

## ADDED Requirements

### Requirement: A program is validated before the conductor spawns

The runtime SHALL validate a program in a single ordered pass before any actor is spawned, with each check a stop condition, in this order: (1) structural well-formedness of the turn-logic structure, (2) branch totality, (3) actor-reference resolution, (4) initial-state completeness. The pass SHALL fail with the first violation in this order, and the conductor SHALL halt without spawning. The pass SHALL be extensible: a dependent capability MAY add further load-time checks to the gate, which run within the same pre-spawn pass.

#### Scenario: A structural failure preempts the later checks

- **WHEN** the turn-logic structure is malformed
- **THEN** the program is rejected with the structural error and no later check runs

#### Scenario: A valid program proceeds to spawning

- **WHEN** a program passes every check in the gate
- **THEN** the conductor proceeds to spawning and turn one may begin

### Requirement: Branch totality is structural

Every `then:` block SHALL be total, decided structurally: the final branch of the block has no `when:` (an `otherwise:`), and every branch before the final one carries a `when:`. A block that lacks a guardless final branch SHALL be rejected, and a block with a guardless branch followed by further branches SHALL be rejected, since the later branches would be unreachable. The rejection SHALL name the actor and the block. A program that passes this check SHALL make any no-branch fall-through unreachable.

#### Scenario: A block without a guardless branch is rejected

- **WHEN** a `then:` block carries only guarded branches and no `otherwise:`
- **THEN** validation rejects the program, naming the actor and the block

#### Scenario: A block ending in a guardless branch is accepted

- **WHEN** every `then:` block in the program ends in a branch with no `when:`
- **THEN** the totality check passes
- **AND** no turn can settle by falling through a `then:` block without matching a branch

#### Scenario: A guardless branch before the end of the block is rejected

- **WHEN** a `then:` block contains a branch with no `when:` followed by further branches
- **THEN** validation rejects the program, naming the actor and the block
- **AND** no branch is left unreachable behind an earlier guardless branch

### Requirement: Actor references must resolve

Every `await:` target, the program's entry reference, and the target of any construct that names an actor — such as `become:` — SHALL name an actor present in the program. A dangling target SHALL be rejected at load, before anything spawns, so no `null` spawn can occur at runtime.

#### Scenario: A dangling await target is rejected at load

- **WHEN** an `await:` terminator names an actor absent from the program
- **THEN** validation rejects the program, naming the referencing actor and the missing target
- **AND** no `null` spawn can occur at runtime

#### Scenario: A dangling entry reference is rejected at load

- **WHEN** the program's entry reference names an actor that is not present
- **THEN** validation rejects the program, naming the entry reference and the missing actor

### Requirement: Initial-state completeness is checked at the gate

The gate SHALL include the initial-state completeness check `framework-native-contracts` defines: before turn one, every typed value an actor reads — its private state and the frames it inherits — must have an initial value, and a read with no initializer SHALL halt before turn one with an incomplete-initial-state error naming the value and the owning scope.

#### Scenario: An uninitialized read halts before turn one

- **WHEN** an actor reads a private-state field or a frame value that no initializer provides
- **THEN** the gate halts before turn one with an incomplete-initial-state error naming the value and its owning scope

### Requirement: Validation rejections carry typed errors

Every validation rejection SHALL be a tagged error identifying the failed check and the offending location — the actor, block, reference, or value, as applicable — so the conductor's error edge can switch on the tag and a producer can locate the fix mechanically.

#### Scenario: A rejection reaches the halted state as a tagged error

- **WHEN** any gate check fails
- **THEN** the conductor halts with a tagged error that names the check and the offending location
