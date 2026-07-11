# context-state

## Purpose

An actor builds up working state as it takes a turn, and two needs pull against each other. Within a turn it needs scratch space — intermediate values a later step reads. It also needs a stable view of itself, because a guard that read half-finished state would make the turn's behavior depend on the order the actor's own writes happened to run, which is the determinism INDRA exists to remove. `context-state` owns the discipline that resolves the tension. A write inside a `sequence:` is immediate scratch, visible to later steps. A write in the turn body is staged, invisible until the turn-boundary commit, and it carries the actor's considered output. When the two collide on one field, the staged write wins. When several turns commit together, the runtime serializes them into a deterministic order, so the same program over the same inputs reaches the same state every time.

This is a narrower contract than the shared mutable store other frameworks offer, and the narrowing is the point. There is no cell that two actors both write and one loses, because shared state is not a mutable cell at all: it is the facts each actor asserts, which a consumer observes and may aggregate. State that stays private to an actor lives in its own working context and is unreadable from outside. State meant to be shared becomes a fact in the dataspace. A developer never has to decide which of several state mechanisms a value belongs in.

## MODIFIED Requirements

### Requirement: Staged perform-level writes are invisible within their own turn

A write executed inside an actor's turn body SHALL be staged and SHALL NOT be visible to any read during the same turn, including guards and interpolations within that turn. The staged value SHALL become visible only after the turn-boundary commit. A turn therefore reads a stable view of its own state: nothing it stages mid-turn changes what it reads mid-turn, so a turn's behavior never depends on the order its own writes happened to run.

#### Scenario: A staged write does not affect a same-turn guard

- **WHEN** an actor stages a write setting its `value` field to `"new"` in its turn body and then evaluates a guard testing whether `value` is `"new"` in the same turn
- **THEN** the guard reads the committed value, not `"new"`, and the guardless branch executes

#### Scenario: A staged value is visible next turn

- **WHEN** an actor stages a write setting `value` to `"new"` and the turn ends
- **THEN** the value is committed at the turn boundary
- **AND** the next turn reads `value` as `"new"`

### Requirement: Sequence-level writes are immediate within the sequence

A write executed inside a `sequence:` block SHALL be applied immediately and SHALL be visible to later steps within the same sequence. A `sequence:` write is intermediate computation, scratch space a later step reads, and it does not settle the turn.

#### Scenario: A sequence write is visible to a later step

- **WHEN** a sequence sets a field `x` to `1` in step 1 and reads `x` in step 2
- **THEN** step 2 reads `1`

### Requirement: A staged write wins over a same-turn sequence write at commit

When a single turn both sequence-writes and stages the same field, the staged write SHALL win at the turn-boundary commit. The sequence write is intermediate computation; the staged write is the actor's considered end-of-turn intent.

#### Scenario: Same-field collision resolves to the staged value

- **WHEN** a turn sets a field `x` to `1` inside a `sequence:` and stages `x` to `2` in its turn body
- **THEN** later steps within the sequence read `1`
- **AND** after the turn-boundary commit, `x` is `2`

### Requirement: Contending commits serialize into a deterministic order

When the commits of more than one turn would land in the same boundary batch, the runtime SHALL apply them in a deterministic order, so the resulting state of the dataspace is reproducible: the same program over the same inputs reaches the same state every time, regardless of the wall-clock order in which asynchronously-arriving facts happened to land. A commit SHALL NOT silently overwrite another so that an update is lost; the deterministic order is the single source of how concurrent commits combine. This is local deterministic replication: each actor's committed facts replicate into the dataspace under one fixed rule.

#### Scenario: Two actors commit in the same batch

- **WHEN** actor A and actor B each commit a fact in the same boundary batch
- **THEN** the runtime applies both in the deterministic order, neither commit is lost, and a re-run over the same inputs combines them the same way

## REMOVED Requirements

### Requirement: Protected namespaces reject program writes

**Reason**: The `&user` and `&signals` namespaces are removed with the rest of `&`-path addressing. Runtime-owned state is no longer a protected namespace a program might write to; it is a set of facts only the runtime asserts.

**Migration**: Read runtime-owned state by observing the facts the runtime asserts (see `signal-system`). A program cannot assert a runtime-owned fact, because it does not hold a capability that admits asserting one — the read-only guarantee is the attenuation, not a namespace check.

### Requirement: Initial context must be fully initialized

**Reason**: Initial-state completeness is now checked by the `program-validation` gate as initial-assertion validation, alongside the other load-time checks, rather than as a `context-state` requirement over `&context` paths.

**Migration**: See `program-validation`. The load-time gate verifies that every fact an actor observes at start has an initial assertion before the first turn, and rejects a program with a missing one.
