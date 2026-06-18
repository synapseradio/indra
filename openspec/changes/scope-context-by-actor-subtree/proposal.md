## Why

A globally readable, globally writable state space is the mechanism by which one actor's reasoning bleeds into another's. When a multi-agent choreography shares state that way, framing and intent leak across roles and compound into a decay of the output that no trace can localize — each step is locally reasonable, the result is wrong, and no single node is at fault.

`framework-native-contracts` removes the global space: state becomes typed, scoped values — an actor's private state, the immutable frames its ancestors establish, and the typed crossings delivered to it. That is the substrate. This change defines the **visibility rule over that substrate and makes isolation an invariant**: an actor sees its ancestors' frames, its own private state, and its declared inbound crossings, and nothing else. A read that would reach a sibling's private state is rejected before the first turn.

The same boundary that prevents the bleed also seals an actor's internals. A caller that awaits an actor sees only its typed return and cannot tell whether one inference leaf or an entire ephemeral subtree produced it. Isolation and encapsulation are the same wall — which is what makes agent systems refactorable: an actor can be replaced by a whole company behind a stable interface, and no caller and no sibling can observe the difference.

## What Changes

- Define **subtree-lexical visibility** over the typed state substrate. An actor's readable set is the frames on its ancestor path, its own private state, and its declared inbound crossings. Visibility follows the lexical scope chain, the way a function sees its lexical environment and nothing of its siblings'.
- Make **no accidental meld an invariant**, enforced statically. Because state is typed, a reference to a value outside an actor's scope — a sibling's private state, an undeclared crossing — does not typecheck, so the type system carries the enforceable share of the invariant at author time. The load-time validator backstops the residue the type system cannot express: spawn sites whose actor identity is chosen at runtime, and crossing routing.
- Govern **crossing routing**. Crossings are the only inter-actor data path. `framework-native-contracts` defines a crossing's typed value shape; this change requires that only the declared fields cross and that the sender's private state never crosses, whatever prose a declared field carries.
- Establish the **encapsulation boundary**. A caller addresses an actor only through its typed interface — inbound crossings and typed return. The actor's private state and any subtree it supervises are unaddressable from outside. Static checking is therefore **modular**: each actor is validated against its own scope, callers against interfaces only, so a dynamically-chosen actor stays sound because its lexical position is static even when its identity is not.
- Fix the **leaf/voice seam**. One inference leaf is one voice. Single-voice prompt assembly lives below the leaf and is fused into a single call. Multi-voice composition lives above the leaf as distinct actors exchanging typed crossings. Collapsing more than one voice into a single leaf reintroduces the meld inside the prompt, which the inference-fidelity pilot already measured ("high leakage, lost persona switching" — `runtime/experiments/inference-fidelity/findings.md:38-42`).

## Capabilities

### New Capabilities

- `actor-scope`: the lexical visibility model (frames, private state, crossings), the no-meld invariant and its static enforcement split between the type system and the load-time validator, crossing routing, the encapsulation boundary and modular soundness, and the leaf/voice seam.

## Impact

- The typed state substrate (the partition into immutable frames and per-actor private state, the retirement of shared mutable state) is established by `framework-native-contracts`, not here. This change adds the visibility rule and the isolation invariant on top of it.
- The type system carries the enforceable share of no-meld: an out-of-scope read does not typecheck. This realizes what was previously an open question — how much of the scope a type can carry — by building the scope into typed state rather than a dotted-path namespace.
- The static no-meld backstop homes in the load-time validator that `validate-program-at-load` defines. The validator checks the residue types cannot express — runtime-chosen spawn identities and crossing routing — and rejects a violating program before turn one.

## Sequencing

This change depends on `framework-native-contracts`, which lands first and provides the typed state substrate this visibility rule scopes. It also depends on `validate-program-at-load` for the load-time backstop: the no-meld invariant is meaningful only if something rejects a violating program the type system cannot catch, and that validator is where the scope-resolution residue is checked.

It is deliberately narrower than the full actor model. Supervisor-tree *mechanics* — actor spawning, await resumption, control routing, loops, parallel actors, and supervision and restart strategies on actor failure — are out of scope and belong to a separate change. This change specifies how state is *seen* across an actor tree; it assumes, but does not define, how that tree is spawned and supervised.
