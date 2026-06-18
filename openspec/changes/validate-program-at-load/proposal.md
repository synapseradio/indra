## Why

The runtime needs a single gate between a constructed program and a running conductor: a program is checked completely before anything spawns, so each mistake a producer could author is found before turn one and named precisely, never discovered mid-run on whichever branch a session happened to take. `interpreter-runtime` already requires branch totality to be a load-time check; `scope-context-by-actor-subtree` needs a load-time backstop for the no-meld checks the type system cannot express. Both want the same validator, and nothing defines it.

This change is the validation spine salvaged from `define-program-ir`. That change framed validation around a versioned, JSON-serializable IR document, a host-supplied inference-name registry, and a forward-declared construct capability set — all language-era framing. `framework-native-contracts` makes most of it unnecessary: a program is a typed structure built by a typed builder, inference points are direct typed function references, and runtime-owned values are read-only by type, so an unbound reference or a write to a protected value is a type error at author time rather than a load-time check. What remains is the part the type system cannot carry: that the built structure is well-formed, that every `then:` block is total, that every actor reference resolves, and that every value an actor reads is initialized. That residue is this capability.

## What Changes

- Define the **load-time gate**: the runtime validates a program in a single ordered pass before any actor spawns, each check a stop condition, and halts without spawning on the first violation.
- Keep **branch totality** as a structural check — every `then:` block ends in a guardless `otherwise:` and carries no guardless branch before the end — implementing the load-time totality requirement `interpreter-runtime` states.
- Keep **actor-reference resolution**: every `await:` target, the entry reference, and any actor-naming construct such as `become:` must name an actor present in the program, rejected at load.
- Fold in **initial-state completeness** as a gate step, as `framework-native-contracts` defines it for typed private state and frames.
- Make every rejection a **typed error** naming the failed check and the offending location.
- Drop the language-era checks: schema decode of a JSON document, namespace write-protection, inference-name registry resolution, and the construct capability set are removed — the typed model carries them at author time or retires them.

## Capabilities

### New Capabilities

- `program-validation`: the load-time gate, branch totality, actor-reference resolution, initial-state completeness as a gate step, and the typed rejection errors.

## Impact

- Gives `interpreter-runtime`'s load-time totality requirement an implementing capability rather than a re-specification.
- Gives `scope-context-by-actor-subtree` the validator its no-meld backstop homes in: that change adds the runtime-residue checks (runtime-chosen spawn identities, crossing routing) to this gate.
- Replaces `define-program-ir`, which is removed: its validation requirements land here in typed-model terms, and its IR document format, name registry, version field, and forward-declared constructs are dropped.

## Sequencing

- Depends on `framework-native-contracts`: the typed structure and typed inference references are what reduce validation to the residue this capability checks.
- `scope-context-by-actor-subtree` depends on this: it extends the gate with the no-meld checks the type system cannot express.
- Persistence and rehydration revalidation are out of scope; they belong to a persistence capability when it lands, not to this load-time gate.
