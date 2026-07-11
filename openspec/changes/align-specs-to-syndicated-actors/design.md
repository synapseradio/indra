## Context

The `syndicated-actors-conceptual-alignment` initiative is the canonical record of INDRA's foundation on the Syndicated Actor Model. The four model specs predate it and still describe the delegation-and-persona design: `interpreter-runtime` specifies a delegation call stack and `say:`-routing, `context-state` addresses state through `&`-namespaces and dotted paths, `inference-layer` models personas as data records, and `signal-system` classifies user input without treating the human as an actor. Two changes hold requirements this alignment needs to keep — `define-runtime-supervision-model` (supervision and the deterministic next-actor rule) and `validate-program-at-load` (the load-time gate) — and both are slated for archival.

This change re-founds three of the four specs on SAM, retires the fourth (`inference-layer`) in favor of a new `inference-boundary` edge capability, harvests the two changes before archiving them, and carries one rename. It is spec work only. A runtime exists but diverges from this direction and is due for its own refactor, so no code changes are in scope here. The specs lead; the runtime follows later.

The requirement inventory below is read from the current spec and change files, not from the initiative's line cites, which have already drifted (the initiative cites `interpreter-runtime:67` for two different requirements, and the live spec `:67` is only one of them).

## Goals / Non-Goals

**Goals:**

- Re-found `framework-core-runtime` (renamed from `interpreter-runtime`), `context-state`, and `signal-system` on SAM concepts: assertions, observe-by-pattern, capabilities with attenuation, transactional turns, supervision via retraction, and handle-plus-`caused-by` provenance.
- Settle the deterministic dispatch rule and its three duties — inter-turn order, intra-turn batch consistency, cycle termination — as a requirement of `framework-core-runtime`.
- Retire `inference-layer` and stand up `inference-boundary` as the validated edge to the external model; INDRA does not perform inference.
- Redefine persona as agent configuration in a new `agent-configuration` capability.
- Stand up `program-validation` as a new capability holding the load-time gate.
- Harvest the reusable requirements from `define-runtime-supervision-model` and `validate-program-at-load`, then archive all four model changes.
- Scrub dead colon-form references from the mechanics artifacts.

**Non-Goals:**

- No runtime or other code changes. The implementation catches up to these specs in later work.
- No distribution, persistence, or relay machinery. Forks F2 (entity granularity) and F3 (the network layer) stay deferred, and the specs state them as deferred rather than designed.
- No new authoring surface for watchdogs or aggregators. The initiative's open question about the single authoring construct is left for later work.
- No change to the mechanics specs' requirements. The mechanics scrub is editorial.

## Decisions

### Rename `interpreter-runtime` to `framework-core-runtime`

The "interpreter" name encodes the rejected language framing, where INDRA was modeled as a language an interpreter walks. INDRA is a TypeScript framework whose deterministic execution core is a runtime. The name moves to `framework-core-runtime` across the spec directory, the `openspec/specs/README.md` capability map, and every cross-reference.

OpenSpec has no `RENAMED` delta section, so the rename is expressed by writing the re-founded delta under `specs/framework-core-runtime/` and renaming the live `openspec/specs/interpreter-runtime/` directory to match when the change applies. The alternative, a `REMOVED` of the old capability plus an `ADDED` of the new one, was rejected because it reads as deletion-and-recreation and loses the continuity of the kept requirements.

### Fold the dispatch rule and supervision into `framework-core-runtime`

The deterministic dispatch rule is the keystone the initiative names: the runtime selects the next turn by a fixed rule, which is what holds determinism over the eventually-consistent dataspace (fork F1). Its three duties are inter-turn order, intra-turn batch consistency (a turn observes an atomic snapshot of the dataspace), and cycle termination. These belong with the turn cycle the spec already owns, so they land as requirements of `framework-core-runtime`, harvested from `define-runtime-supervision-model:39` and `:25`. The harvested change's scheduler-entity framing is dropped: determinism is a property of the runtime's dispatch, not a separate component that conducts it.

Supervision folds into the same capability. `define-runtime-supervision-model:67` propagates an actor failure to its supervisor as a typed value; this is reframed as failure-as-retraction, where a terminating actor's assertions retract automatically and a supervisor reacts to the absence. The dispatch rule and supervision share the runtime's single serial dispatch, so splitting them across capabilities would fracture one mechanism. The alternative, a standalone `actor-supervision` capability matching the harvested change's spec name, was rejected because its owning change is being archived and the content is small enough to live with the turn cycle it depends on.

### `program-validation` as its own capability

The load-time gate is a distinct concern from the turn cycle: it runs once before the first turn is dispatched and rejects an invalid program. It earns its own capability rather than a requirement inside `framework-core-runtime`. The name `program-validation` already appears as a forward reference in the `framework-native-contracts` deltas, so adopting it keeps continuity.

The gate's checks change with the SAM re-founding, harvested and transformed from `validate-program-at-load`:

| Old check (`validate-program-at-load`) | New check |
| --- | --- |
| Branch totality is structural (`:25`) | Reaction coverage |
| Actor references must resolve (`:46`) | Capability resolution |
| Initial-state completeness (`:61`) | Initial-assertion validation |
| Validated before the first turn (`:11`) | Kept as-is |
| Validation rejections carry typed errors (`:70`) | Kept; this is also where fork F4 lands |

Fork F4 (no silent discard) lands here: an attenuation mismatch is a typed error or a load-time rejection, never a quiet drop, so the gate's typed-rejection requirement is the natural home for it.

### Reframe in place; remove only what the initiative names

The determinism mechanics each spec already specifies are kept, and the SAM re-founding changes the vocabulary around them rather than rewriting them. A staged-write commit becomes local deterministic replication; the runtime-owned signals namespace becomes runtime-asserted facts; the generic interpreter reading turn logic as data stays exactly as it is. Most deltas are `MODIFIED` reframings plus targeted `REMOVED` sections rather than wholesale rewrites; the exception is `inference-layer`, which is retired outright (see the next decision).

The removals are bounded to what the initiative names:

- `framework-core-runtime`: remove the delegation call stack (`interpreter-runtime:38`) and `say:`-routing (`:53`). The `become:` persona-spawn is removed too; persona itself is not deleted but redefined as agent configuration in `agent-configuration` (see the next decision).
- `context-state`: the `&context`/`&user`/`&signals` namespaces and dotted-path addressing are woven through several requirements (the protected-namespace requirement at `:43`, and `interpreter-runtime:130` "Program state lives only in the context substrate") rather than isolated in one. The reframe replaces the addressing model with typed assertions and dataflow fields across those requirements.
- `signal-system`: reframe the three-mode classification (`:28`) and command translation (`:19`) around the human as an asserting-and-observing actor. Harvest `define-runtime-supervision-model`'s `signal-system` delta, including "The handled-signal record is a runtime-owned typed value," which already moves toward runtime-asserted facts.

### Cyclic observation: permit it, bound it with the existing iteration frame

The initiative leaves open whether the model permits cyclic observation. The design takes a position: permit it, because an open discussion (one actor reacts to a second, the first reacts back) is a target use, and bound its convergence with the iteration-frame reification and hard iteration cap the spec already specifies (`interpreter-runtime:101`). The initiative names that reification as "the mechanism to keep," so cycle termination reuses it rather than introducing a new bound. This is recorded as a decision but flagged in Open Questions, since it is the least-settled of the three dispatch duties.

## Risks / Trade-offs

- Initiative line cites have drifted from the live specs → the specs phase locates content by requirement text and meaning, never by the initiative's line numbers, and re-reads each spec before editing.
- Large BREAKING surface across four specs at once → the runtime already diverges and no code depends on these specs being stable, so the breakage is contained to spec text; the deltas are reframings of kept mechanics plus named removals, which bounds the blast radius.
- Harvesting from changes that are then archived → order is fixed: harvest into the re-founded specs first, verify the harvested requirements are present, then archive. Archival before harvest would lose the source.
- The dispatch rule's intra-turn batch consistency and cycle termination are designed, not yet exercised by any runtime → these are stated as specified target behavior; the spec text marks what is specified versus what awaits a runtime, so a reader does not mistake the spec for a running guarantee.

## Migration Plan

1. Write the delta specs: `framework-core-runtime` (with rename, dispatch rule, supervision), `context-state`, `inference-layer`, `signal-system`, and the new `program-validation`.
2. Carry the rename through the `openspec/specs/README.md` capability map and all live cross-references.
3. Harvest the supervision and validation requirements into their new homes, and confirm each harvested requirement is present before proceeding.
4. Archive the four model changes (`framework-native-contracts`, `scope-context-by-actor-subtree`, `define-runtime-supervision-model`, `validate-program-at-load`).
5. Scrub dead colon-form references from the mechanics artifacts (`package-boundaries`, `package-scaffold`, `git-hooks`, `module-resolution`, `extract-inference-adapter`, `clarify-module-resolution`).

Rollback is reverting the spec edits; these are versioned text changes with no deployed surface.

## Open Questions

- Cyclic observation is permitted by this design and bounded by the existing iteration cap, but what bounds convergence when the cycle runs over inference (which recomputes non-deterministically) needs the runtime work to validate. The spec states the cap; whether the cap suffices is a runtime question.
- The single authoring construct that covers both a watchdog and an aggregator is left to later work, per the initiative. This change does not introduce it.
- How a developer expresses how much is determined (capability width, inference latitude, observe scope as one coherent control) is out of scope here and noted for a later change.
