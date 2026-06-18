## Context

INDRA's value is a programmable inner monologue — one actor, many actors, or whole interacting groups of ephemeral LLM actors, with the composition readable because it mirrors how a person thinks. The failure that destroys that value in every shared-state multi-agent system is contamination: one actor's reasoning bleeds into another's through shared state, and the bleed compounds into an output decay that no trace can localize.

`framework-native-contracts` removes the shared global state space. State becomes typed, scoped values: each actor has a typed private state, a supervisor establishes typed immutable frames for its subtree, and actors exchange typed crossings. That is the substrate this change works over. This change defines who may see what across that substrate, and turns isolation into an invariant rather than a convention.

The governing analogy is a screenplay. Two characters in a scene share the room — both know where they are, what time it is, what just happened. That shared knowledge is fixed; neither character edits the room. Each character has an inner monologue the other cannot hear. What crosses between them is dialogue: spoken lines, not thoughts. The audience's interest lives in the **delta** between the two private monologues — the gap between what each knows and what each says. A system where characters read each other's monologues has no scene; it has one melted mind talking to itself.

## Goals / Non-Goals

Goals:

- Make inter-actor isolation an invariant that holds by construction, enforced before the first turn.
- Give an actor a precise, lexically-determined readable set: its ancestors' frames, its own private state, its declared inbound crossings.
- Make the isolation boundary also the encapsulation boundary, so actors are refactorable behind stable typed interfaces.
- Place the leaf/voice seam so single-voice assembly is fused below it and multi-voice composition lives above it as actors exchanging crossings.

Non-Goals:

- The typed state substrate itself — the partition into typed private state and typed immutable frames, and the retirement of shared mutable state. That is `framework-native-contracts`. This change scopes that substrate; it does not define it.
- Actor-tree *mechanics*: spawning, await resumption, control routing, loops, parallel execution. Assumed as substrate, specified elsewhere.
- Supervision and failure handling. A separate change.
- The eDSL authoring API. This change specifies the model the API and the validator must honor.

## Decisions

### SC1 — The typed state substrate is provided by `framework-native-contracts`

The partition — a typed private state per actor that it alone writes, typed immutable frames a supervisor establishes for its subtree, and no shared mutable cell anywhere — is established by `framework-native-contracts`. This change does not restate it. Everything below scopes that substrate: it decides who may read which typed value, not what the typed values are.

### SC2 — Visibility is the lexical scope chain; the no-meld invariant is its closure

An actor's readable set is exactly: the frames established by actors on its ancestor path, its own private state, and the values declared as its inbound crossings. Anything else is invisible. The no-meld invariant is the statement that this set is closed — no read resolves outside it. A sibling's private state is unreachable not by policy but because it is not on the reader's scope chain, exactly as a sibling function's locals are not in a caller's lexical scope.

### SC3 — Enforcement splits between the type system and the load-time validator

Because `framework-native-contracts` makes state typed, the type system carries the enforceable share of the invariant: a reference to a value outside an actor's scope — a sibling's private state, an undeclared crossing — does not typecheck, so the violation is an author-time error rather than a runtime hope. This is the answer to what was an open question — how much of the scope a type can carry — and the answer is "the part where the scope is a type." The load-time validator carries the residue the type system cannot express: a spawn site whose actor identity is chosen at runtime, and crossing routing. A reference the validator finds outside scope is a load-time error naming the actor, the reference, and the scope it escaped. The floor of the invariant is the compiler; the validator is the backstop.

### SC4 — Crossings: value shape from contracts, routing here

`framework-native-contracts` defines a crossing's typed value shape. This change governs its routing. A crossing is an explicit typed envelope an actor emits and a supervisor routes to a named recipient's declared inbound interface. Only the declared fields cross; the sender's private state does not. Prose is allowed inside a declared field — the spoken line may be free text — but the field is declared and bounded, so the meld vector (the whole monologue riding along inside free text) is closed: only declared fields cross.

### SC5 — The isolation boundary is the encapsulation boundary (double duty)

A caller addresses an actor only through its typed interface: the crossings it accepts and the value it returns. The actor's private state and any subtree it supervises are unaddressable from outside that interface. One wall does both jobs: it stops the bleed (nothing leaks out, nothing reads in) and it hides the implementation (one leaf or a forty-actor company is indistinguishable to the caller). This is what makes an agent system refactorable — an actor's guts can be replaced by an org, or an org by a leaf, with callers and siblings unchanged.

### SC6 — Static checking is modular, which keeps it sound under dynamic spawning

Because callers see only interfaces and bodies are checked only against their own scope, each actor is validated in isolation — a body against its scope chain, a call site against the callee's interface. The whole tree need not be statically known. A dynamically-chosen actor stays sound because its **lexical position** (the spawn site) is static even when its **identity** is not: the spawn site declares the frame the child inherits and the crossing shapes it may receive, and that declaration is checkable regardless of which actor fills the slot. The type system carries this where the spawn site's types prove it; the validator checks the rest.

### SC7 — The leaf/voice seam: one leaf, one voice

The boundary between INDRA composition and single-call fusion is drawn at every voice change. Single-voice prompt assembly — one persona building its own prompt from fragments — lives below the leaf and is fused into a single call; no meld is possible there because it is one actor's private monologue. Multi-voice composition lives above the leaf as distinct actors exchanging typed crossings. Pushing more than one voice into a single leaf reintroduces the meld inside the prompt; the inference-fidelity pilot measured exactly this when three persona-voiced steps were collapsed into one call ("high leakage, lost persona switching" — `runtime/experiments/inference-fidelity/findings.md:38-42`). The persona is therefore the unit that cannot be subdivided below the leaf.

## Risks / Trade-offs

- **The type system carries only the share where the scope is a type.** Dynamic spawn sites and crossing routing fall to the load-time validator, so the invariant is a proof for the static part and a check for the rest. If a spawn's *readable scope* depended on a runtime value, even the validator would weaken to a runtime guard; the bet is that lexical position is always static while identity varies. Needs a spike against the `derisk-dynamic-dispatch` pattern.
- **The crossing seam is shared with `framework-native-contracts`.** That change owns the crossing value shape; this one owns its routing. Each property needs exactly one owner or the two changes double-specify the crossing. Resolve the seam explicitly when both are synced.
- **Prose-in-a-declared-field is a controlled meld vector, not a closed one.** A large enough prose field can carry as much framing as the whole monologue would. The invariant bounds *which* fields cross, not *how much* a field may say. A discipline on prose-field size or a lint may be wanted later.

## Open Questions

- **Do frames need nominal identity?** Two frames of the same shape established by different supervisors are different rooms. Whether the type system should distinguish them nominally, or structural typing suffices, bears on how hard SC3 carries no-meld. This is shared with `framework-native-contracts`' open question on frame identity; resolve it once, there.
- **Does a crossing need a provenance stamp** so the trace can later attribute a decision to the line that caused it — connecting this model to the not-yet-built conversation trace?
