# INDRA Principles

INDRA is a language for choreographing reasoning. A deterministic runtime executes the choreography, and a language model supplies the judgment at typed inference points. Every architectural decision in the runtime traces back to one of the principles below. Each principle states what it protects and names where it is enforced, so a change that strains against one of them can be recognized as such before it lands.

## 1. Determinism serves inhabitation

The deterministic machinery exists to give the model freedom of expression, not to constrain it. A model asked to also be its own interpreter must spend attention pretending to a faithfulness it cannot verify from the inside — it structurally cannot know whether it executed a program or improvised one. The runtime carries that knowledge instead, so the model can inhabit its generative role completely and without defensive overhead.

The canonical negative example is the legacy protocol's `next_state_assertion`, which made the model assert after every inference that it was "resuming the interpreter role." The assertion was a confession: the role could be left, so it had to be re-sworn. A real runtime never leaves its role, and the assertion is gone.

Enforced by: the whole of the runtime extraction (`openspec/changes/extract-deterministic-runtime`), and specifically the typed-return requirement in the inference-layer spec, which discards the assertion.

## 2. The model steers only through typed data; the runtime decides transitions

The model influences where execution goes by writing typed values into context. Deterministic guards route on those values. The model never names a transition directly, and the runtime never asks the model which branch was taken. This keeps every control-flow decision replayable: given the same committed state and the same typed value, the same branch fires.

Enforced by: design decision D7, the guard semantics in the interpreter-runtime spec (guards read committed state, expression evaluation is total and side-effect-free), and the typed output shapes in the inference-layer spec.

## 3. Inference is a typed, bounded leaf

Each inference point is a function with a declared input and a declared, schema-validated return type. The call is a leaf: it produces one typed value and does not itself combine, splice, or chain other inferences. Boundedness extends to the output's reach — a call site selects the fields it keeps, and discarded fields such as `reasoning` never reach program-visible state or output.

Enforced by: design decision D9 (the typed-function recipe for genuine inference) and the `select` composition boundary in the inference-layer spec.

## 4. Composition stays in the language

Combining inference results — splicing one result into another prompt, referring back to an earlier generation — is composition, and composition belongs to the INDRA language, not to host code. The boundary risk is leakage: if composition drifts into hand-written host functions, INDRA stops being a language and becomes a library. Keeping composition expressible in the protocol is what keeps it a language.

Enforced by: design decision D9, which assigns splice and back-reference composition to the layer above the typed inference functions.

## 5. Shared coordination state is not shared prompt attention

`&context` is a blackboard in the Hearsay-II sense: a shared workspace that actors coordinate through, with transactional commits at turn boundaries. It is not a shared context window. Actors receive scoped, typed inputs at their inference points; the blackboard's full contents are never dumped into a prompt. This is the distinction that answers the strongest published objection to shared state in multi-agent systems — the contamination argument targets shared prompt attention, and INDRA shares coordination state instead. The STM commit discipline is what makes the blackboard safe when actors run genuinely in parallel.

Enforced by: design decisions D1 through D3, the serialized-commit and staging requirements in the context-state spec, and the single boundary commit in the interpreter-runtime spec.

## 6. Reasoning precedes commitment

Every structured inference declares a free-form reasoning field first, so the model produces its reasoning tokens before emitting the typed value it commits to. Constrained output without that room measurably degrades judgment; with it, the typed contract costs little. The order is the principle: think, then bind.

Enforced by: design decision D8 and the reasoning-field requirement in the inference-layer spec.

## Corollaries

A corollary is derivable from the principles and the preamble. It earns a place here because the moment someone needs it is a review, and re-deriving it under review pressure is where mistakes happen. Each corollary names its premises; a corollary whose premises cannot be named is a smuggled principle.

### C1. Pure computation never costs an inference call

A `<...>` call whose semantics are a pure function — `count`, `has_content`, `get_first` — executes as a deterministic host function, never as an inference call. Counting requires no judgment, so it earns no inference point, and giving it one would encode a latency, cost, and nondeterminism bug as a typed contract.

Premises: the preamble (the model supplies judgment at typed inference points) and principle 3 (inference is a typed, bounded leaf).

Enforced by: design decision D9 and the requirement in the inference-layer spec that pure `<...>` calls run as host functions.
