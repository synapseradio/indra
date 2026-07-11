# program-validation

## Purpose

The `program-validation` capability owns the gate between a constructed program and its first turn. A program is checked completely before any actor is dispatched — the well-formedness of its turn-logic structure, the coverage of every reaction over the cases it can face, the resolution of every capability a reference needs, and the presence of an initial assertion for every fact an actor observes at start — so each mistake a producer could author is found before turn one and named precisely, never discovered mid-run on whichever branch a session happened to take.

The principle underneath the gate is that the runtime never runs a program it only partially understands. It carries out exactly what the author built, or it refuses with the reason. Where the surface is typed, the type system already rejects an unbound reference or a write to a runtime-owned value at author time, so this capability checks the residue a type cannot express. It is the load-time home for fork F4: a coverage gap, an unresolved or unadmitted capability, or a missing initial assertion is a typed rejection raised at the gate, never a silent discard at runtime.

## ADDED Requirements

### Requirement: A program is validated before the first turn

The runtime SHALL validate a program in a single ordered pass before any actor is dispatched, with each check a stop condition, in this order: (1) structural well-formedness of the turn-logic structure, (2) reaction coverage, (3) capability resolution, (4) initial-assertion completeness. The pass SHALL fail with the first violation in this order, and the runtime SHALL halt without dispatching a turn. The pass SHALL be extensible: a dependent capability MAY add further load-time checks, which run within the same pre-dispatch pass.

#### Scenario: A structural failure preempts the later checks

- **WHEN** the turn-logic structure is malformed
- **THEN** the program is rejected with the structural error and no later check runs

#### Scenario: A valid program proceeds to its first turn

- **WHEN** a program passes every check in the gate
- **THEN** the runtime proceeds to dispatch and turn one may begin

### Requirement: Reaction coverage is structural

Every reaction's branch set SHALL be total, decided structurally: the final branch carries no guard — a default — and every branch before it carries a guard. A branch set that lacks a guardless final branch SHALL be rejected, and a branch set with a guardless branch followed by further branches SHALL be rejected, since the later branches would be unreachable. The rejection SHALL name the actor and the reaction. A program that passes this check SHALL make any fall-through with no matching branch unreachable.

#### Scenario: A reaction without a guardless branch is rejected

- **WHEN** a reaction's branch set carries only guarded branches and no default
- **THEN** validation rejects the program, naming the actor and the reaction

#### Scenario: A reaction ending in a guardless branch is accepted

- **WHEN** every reaction in the program ends in a branch with no guard
- **THEN** the coverage check passes
- **AND** no turn can settle by falling through a reaction without matching a branch

#### Scenario: A guardless branch before the end of the reaction is rejected

- **WHEN** a reaction contains a branch with no guard followed by further branches
- **THEN** validation rejects the program, naming the actor and the reaction
- **AND** no branch is left unreachable behind an earlier guardless branch

### Requirement: Capability resolution is checked at the gate

Every reference a program needs to resolve SHALL resolve before any turn is dispatched: the program's entry reference SHALL name an actor present in the program, and every capability a reference requires — to observe a fact, to assert a fact, or to address another actor — SHALL resolve to one the holder is admitted to hold. A dangling reference or a capability the holder is not admitted to SHALL be rejected at load, so no missing target and no unadmitted access can surface at runtime.

#### Scenario: A dangling entry reference is rejected at load

- **WHEN** the program's entry reference names an actor that is not present
- **THEN** validation rejects the program, naming the entry reference and the missing actor

#### Scenario: An unadmitted capability is rejected at load

- **WHEN** an actor's reference requires a capability the actor is not admitted to hold
- **THEN** validation rejects the program at load, naming the referencing actor and the capability
- **AND** no unadmitted observe or assert can occur at runtime

### Requirement: Initial-assertion completeness is checked at the gate

The gate SHALL check that the program's starting state is complete: before turn one, every fact an actor observes at start SHALL have an initial assertion, and every typed value an actor reads — its private state and the frames it inherits — SHALL have an initial value. A read with no initializer, or a fact observed at start with no initial assertion, SHALL halt before turn one with an incomplete-initial-state error naming the value or fact and the owning actor.

#### Scenario: An uninitialized read halts before turn one

- **WHEN** an actor reads a private-state field or a frame value that no initializer provides
- **THEN** the gate halts before turn one with an incomplete-initial-state error naming the value and its owning actor

#### Scenario: A fact observed at start with no initial assertion halts

- **WHEN** an actor observes a fact at start that no initial assertion provides
- **THEN** the gate halts before turn one with an incomplete-initial-state error naming the fact and the owning actor

### Requirement: Validation rejections carry typed errors

Every validation rejection SHALL be a tagged error identifying the failed check and the offending location — the actor, reaction, reference, capability, or value, as applicable — so the runtime's error edge can switch on the tag and a producer can locate the fix mechanically. Per fork F4, a coverage gap, an unresolved or unadmitted capability, or a missing initial assertion SHALL surface as such a typed rejection at the gate, never as a silent discard at runtime.

#### Scenario: A rejection reaches the halted state as a tagged error

- **WHEN** any gate check fails
- **THEN** the runtime halts with a tagged error that names the check and the offending location

#### Scenario: An unadmitted capability is a typed rejection, not a silent drop

- **WHEN** a reference would access a capability the holder is not admitted to
- **THEN** the gate rejects the program with a tagged error rather than dropping the access quietly at runtime
