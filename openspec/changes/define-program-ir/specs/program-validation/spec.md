# program-validation

## Purpose

The `program-validation` capability owns the gate between a Program document and a running conductor. A program is checked completely before anything spawns — its structure, its branch totality, every reference it makes, the completeness of its initial world, its writes against protected namespaces, and the resolution of every inference name — so each mistake a producer could author is found before turn one and named precisely, never discovered mid-run on whichever branch a session happened to take. The same gate guards resumption: a persisted snapshot is revalidated against the live host before the conductor picks it back up.

The principle underneath the gate is that the runtime never runs a program it only partially understands. It executes exactly what the author wrote, or it refuses with the reason.

## ADDED Requirements

### Requirement: A Program is validated before the conductor spawns

The runtime SHALL validate a Program in a single ordered pass before any actor is spawned, with each check a stop condition, in this order: (1) schema conformance, (2) branch totality, (3) actor-reference resolution, (4) initial-context completeness, (5) namespace write-protection where statically decidable, (6) inference-reference resolution against the supplied registry. The pass SHALL fail with the first violation in this order, and the conductor SHALL halt without spawning.

#### Scenario: A structural failure preempts semantic checks

- **WHEN** a document fails schema decode
- **THEN** the Program is rejected with the decode error and no semantic check runs

#### Scenario: A valid Program proceeds to spawning

- **WHEN** a Program passes all six checks
- **THEN** the conductor proceeds to spawning and turn one may begin

### Requirement: Branch totality is structural

Every `then:` block SHALL be total, decided structurally: the final branch of the block has no `when:` (an `otherwise:`), and every branch before the final one carries a `when:`. A block whose guards may in fact be exhaustive but that lacks a guardless final branch SHALL be rejected, and a block with a guardless branch followed by further branches SHALL be rejected, since the later branches would be unreachable. The rejection SHALL name the actor and the block. A Program that passes this check SHALL make the runtime's no-branch fall-through (the implicit `return: null`) unreachable.

#### Scenario: A block without a guardless branch is rejected

- **WHEN** a `then:` block carries only guarded branches and no `otherwise:`
- **THEN** validation rejects the Program, naming the actor and the block

#### Scenario: A block ending in a guardless branch is accepted

- **WHEN** every `then:` block in the Program ends in a branch with no `when:`
- **THEN** the totality check passes
- **AND** no turn can settle by falling through a `then:` block without matching a branch

#### Scenario: A guardless branch before the end of the block is rejected

- **WHEN** a `then:` block contains a branch with no `when:` followed by further branches
- **THEN** validation rejects the Program, naming the actor and the block
- **AND** no branch is left unreachable behind an earlier guardless branch

### Requirement: Actor references must resolve

Every `await:` target — and the Program's entry reference, and the target of any construct that names an actor, such as `become:` once the format defines it — SHALL name an actor present in the Program's actor table. A dangling target SHALL be rejected at load, before anything spawns.

#### Scenario: A dangling await target is rejected at load

- **WHEN** an `await:` terminator names an actor absent from the Program's actor table
- **THEN** validation rejects the Program, naming the referencing actor and the missing target
- **AND** no `null` spawn can occur at runtime

#### Scenario: A dangling entry reference is rejected at load

- **WHEN** the Program's entry reference names an actor absent from the actor table
- **THEN** validation rejects the Program, naming the entry reference and the missing actor

### Requirement: Statically decidable namespace write violations are rejected at load

A `set:` whose literal target path addresses a runtime-owned namespace (`&user`, `&signals`, `&result`) SHALL be rejected at load. The runtime's commit-time protection remains the backstop for any write that is not statically decidable.

#### Scenario: A literal write to a protected namespace is rejected before turn one

- **WHEN** a Program contains `set: &user.latest = "x"` as literal IR data
- **THEN** validation rejects the Program at load, naming the protected path
- **AND** the rejection happens before any turn rather than at commit

### Requirement: Inference references resolve against the supplied registry

Every inference reference in the Program SHALL resolve to a key in the host-supplied registry at load. An unresolved reference SHALL be a load-time validation error naming the function, not a call-time invocation error.

#### Scenario: An unbound inference function is rejected at load

- **WHEN** a Program references inference function `"Y"` and the host registry binds no such name
- **THEN** validation rejects the Program before turn one, naming `"Y"`
- **AND** no branch-dependent call-time failure can surface the missing binding mid-run

### Requirement: Use of unsupported constructs is rejected at load

The loaded runtime SHALL advertise a capability set: the constructs it executes. A document that uses a construct the format defines but the capability set excludes SHALL be rejected at load with an error naming the construct and where it is used.

#### Scenario: A forward-declared construct the runtime cannot execute is rejected

- **WHEN** a document uses `until:` and the loaded runtime's capability set does not include `until`
- **THEN** validation rejects the Program with an error naming the construct and the actor using it
- **AND** the interpreter is never driven into a construct it has no semantics for

### Requirement: Validation rejections carry typed errors

Every validation rejection SHALL be a tagged error identifying the failed check and the offending location — the actor, block, path, or name, as applicable to the check — so the conductor's error edge can switch on the tag and a producer can locate the fix mechanically.

#### Scenario: A rejection reaches the halted state as a tagged error

- **WHEN** any validation check fails
- **THEN** the conductor halts with a tagged error that names the check and the offending location

### Requirement: Rehydration revalidates persisted documents

At snapshot rehydration the runtime SHALL revalidate the persisted Program against the schema, against the live registries, and against the loaded runtime's capability set before resuming. A document whose version the runtime does not recognize SHALL be rejected with a typed error. An inference reference that resolved at persist time but is unresolvable against the current registries SHALL reject the resume rather than fail mid-turn after restore, and a construct that was executable at persist time but is outside the resuming runtime's capability set SHALL reject the resume the same way.

#### Scenario: An unrecognized persisted version rejects rehydration

- **WHEN** a persisted snapshot carries a Program version the running runtime does not recognize
- **THEN** rehydration is rejected with a typed error and the conductor does not resume

#### Scenario: Registry drift between persist and resume rejects the resume

- **WHEN** a snapshot persisted under a host binding inference function `"X"` is resumed against a host that does not bind `"X"`
- **THEN** the resume is rejected at rehydration, naming `"X"`, rather than failing mid-turn after restore

#### Scenario: Capability narrowing between persist and resume rejects the resume

- **WHEN** a snapshot of a Program using `until` is resumed by a runtime whose capability set excludes `until`
- **THEN** the resume is rejected at rehydration, naming the construct, rather than failing when the interpreter reaches it
