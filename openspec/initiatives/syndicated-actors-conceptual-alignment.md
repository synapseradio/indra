# Conceptual alignment: the Syndicated Actor Model and INDRA

This is a repo-native coordination document, a sibling to
[monorepo-bootstrap.md](./monorepo-bootstrap.md). It is the canonical record of how INDRA's foundation
aligns to the Syndicated Actor Model: what the framework is for, the problems it solves over LangGraph
and Mastra, the concepts it adopts from the model to solve them, and the verdict on what each existing
spec and change is worth under that foundation. The `openspec` CLI does not track this file; git does.
The normative specs under `openspec/specs/` are to be re-founded on the direction recorded here, and
the laddering section at the end maps that work.

A note on tense. A runtime exists, but it diverges from the direction recorded here far enough that it
is due for heavy refactoring or replacement. Where this document describes the runtime in the present
tense — a producer asserting a fact, the conductor selecting a turn, a leak the structure forbids — it
states the target design, which the current runtime does not yet realize. Read those sentences as
intent, not as a description of what runs today. The few places that claim something is already true
of an existing artifact, such as a spec that already specifies a behavior, name that artifact so the
claim can be checked against it.

## What INDRA is, and what the model is

INDRA is a TypeScript framework for agentic applications — programs that ship a feature by consulting
models. Earlier specs modeled it as a language, which it is not, and it is distinct from the operating
system (Synit) whose concurrency model it borrows. Reasoning is one capability a developer builds on
it, among others.

Its foundation is the Syndicated Actor Model (SAM), the concurrency model whose foundational text is
Tony Garnock-Jones' 2017 Northeastern dissertation "Conversational Concurrency," documented at
[syndicate-lang.org](https://syndicate-lang.org/doc/capabilities) and republished as the Synit manual.
SAM's fundamental primitive is eventually-consistent replication of state among actors, with
message-passing as a derived operation
([capabilities](https://syndicate-lang.org/doc/capabilities)). Synit is an operating system built on
the model; INDRA borrows the model, never the OS. The canonical `syndicate-lang.org` site and the
Synit manual are the same document tree by the same author, so the concept definitions are identical
across the two, and only the application framing differs.

INDRA adopts SAM's coordination model faithfully and leaves its distributed-systems substrate behind.
The claim driving the adoption is that the context-coordination problem SAM solves among isolated
actors at a low level is the same problem an agentic program faces at a high level: what each agent
sees, what it may read, what it emits, and how state propagates without one agent reaching into
another. The rest of this document is why, and what it costs.

## Sources

- [syndicate-lang.org](https://syndicate-lang.org/) — the canonical model site; the
  [glossary](https://syndicate-lang.org/doc/glossary) and the SAM tutorial at
  [capabilities](https://syndicate-lang.org/doc/capabilities) are the authoritative single sources.
- [synit.org/book](https://synit.org/book/) — the Synit book; the same text as above, plus
  OS-specific operation pages and the [trace schema](https://synit.org/book/protocols/syndicate/trace.html).
- [preserves.dev](https://preserves.dev/) — the Preserves data-language spec.
- Foundational papers located on the site: "Conversational Concurrency" (PhD, 2017), "Coordinated
  Concurrent Programming in Syndicate" (ESOP 2016), and "The Network as a Language Construct" (ESOP
  2014). Their framing was captured from the canonical pages; the PDFs were not read in full.

## Terms

A few terms are fixed here and held to throughout.

- **actor** — INDRA's runtime unit: a sealed reactive participant with typed input, typed output, and
  private context. An actor that consults a model is an **agent**; "agent" names that role, not a
  second kind of thing.
- **assertion** — a published, retained, typed value, and INDRA's core primitive for sharing state.
  The body of an assertion is a **fact**. An actor **observes** a pattern over assertions and
  **reacts**, taking a turn, when a matching fact appears or is retracted. A transient value that is
  not retained is a **message**.
- **context** — the prompt a model receives at an inference boundary. An actor's context is assembled
  from the facts it observes, and isolation is the guarantee that another actor's facts stay out of it
  unless observed.
- **framework, runtime, conductor** — INDRA is the framework, the surface a developer authors against.
  Its runtime executes a program. The conductor is the runtime's scheduler, the part that selects the
  next turn by a deterministic rule.
- **capability** — a reference that fixes what an actor may observe or assert, narrowable by
  attenuation. The typed boundary where one actor's facts become visible to another is realized as a
  capability.

## Three vantage points on one feature

Take one feature an agentic developer wants to ship: answer the user by consulting three specialists,
and if one stalls, go without it. Three people look at that feature and want different things.

The feature author wants to ship the sentence. What they write to get there is mostly plumbing: start
three calls, hold three promises, gather them with a settled-join, race each against a timeout, wrap
each in error handling, then stitch the survivors into one prompt. The feature is one sentence and the
code is dozens of lines of coordination they never wanted to think about. From this chair the enemy is
ceremony.

The second person debugs this at 3am, after the assistant said something strange. They need to see why
it said it: which call produced the odd fragment, what context that call was given, what fired and in
what order. From this chair the enemy is opacity.

The third participant is the model running one inference. Its output is only as good as its context,
and the hazard is another actor's working context bleeding into its prompt. From this chair the enemy
is a polluted context.

These wants clash. The feature author wants the coordination to disappear; the orchestration author who
tunes isolation and determinism wants explicit control over it. An architecture earns its place only if
it serves the disappearance and the control at the same time.

## The problems INDRA solves

The quickest way to see what the architecture buys is to ask how you would guarantee the misery, then
reverse each answer. To make an agentic developer's life painful: force them to await each agent by
name and bind its result by hand; make them thread context into every sub-prompt and hope nothing
leaks; make ordering global, so adding a fourth agent reshuffles the first three; make a failure either
crash the request or vanish in silence; make the finished run unexplainable; and force one rigid shape
on flows that are sometimes a strict pipeline and sometimes an open discussion. Each reversal below is
one of INDRA's value propositions, stated as a removed pain, and each pain is something a developer
writes today in LangGraph or Mastra.

### Orchestration plumbing becomes the runtime's job

Those dozens of lines of join-and-timeout are the pain. Both LangGraph and Mastra make this explicit,
developer-authored control flow, and both leave part of the resilience to the developer. In LangGraph
the timeout, the retry, and the error handler are first-class per-node options
([fault-tolerance](https://docs.langchain.com/oss/javascript/langgraph/fault-tolerance)), so a stalled
worker raises a `NodeTimeoutError` and proceeding without it is a recovery function the developer
attaches to swallow the timeout and write a sentinel; the merge then reads a state key with an append
reducer ([workflows-agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)). In
Mastra `.parallel([a,b,c]).then(merge)` expresses fan-out and merge cleanly, but the parallel block
waits for every branch and fails whole if one throws, so a per-branch deadline and stall-survival are
hand-rolled inside each step with a try/catch and the developer's own `AbortSignal` or `Promise.race`
([control-flow](https://mastra.ai/docs/workflows/control-flow); the absence of a step-level timeout is
inferred from its omission across the control-flow and error-handling pages [?]).

In INDRA's design a producer asserts its result as a fact, the runtime routes it, and a consumer that
declared interest reacts. The settled-join, the timeout race, and the survivor merge move out of the
feature and into the runtime, which is what the first chair wanted.

### Context is assembled from what an actor observes, and a capability bounds it

Threading context into each sub-prompt and hoping nothing leaks is the pain. LangGraph's isolation is a
property of how the shared-state schema is designed: each dynamically-spawned worker has its own input
state and a subgraph can hold private keys, and preventing cross-leakage is the schema author's
responsibility ([use-subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs); the
"author's responsibility" reading is mine, not an explicit doc statement [?]). Mastra enforces memory
isolation automatically when a supervisor delegates to a subagent, giving each delegation a fresh
message history, though resource-scoped memory carries across delegations
([memory/overview](https://mastra.ai/docs/memory/overview)); whether one parallel step's output reaches
a sibling's prompt is still the developer's data-flow design [?].

In INDRA's design an actor's context is assembled from the facts it observes, and what it may observe is
fixed by an attenuated capability. A leak becomes a thing the structure forbids rather than a bug to
hunt. The capability is the place the orchestration author sets isolation by hand, which is the control
the second chair wanted. The concept is SAM's object-capability with attenuation, where a capability
can restrict what a holder observes and not only what it asserts
([capabilities](https://syndicate-lang.org/doc/capabilities)).

### Order is an additive data dependency

Global ordering is the pain, because adding a participant reshuffles the others. In Mastra, adding a
fourth agent touches two places: the `.parallel([...])` array and the consumer step's `inputSchema`,
which must name the new key ([control-flow](https://mastra.ai/docs/workflows/control-flow)). In
LangGraph the dynamic `Send` map-reduce pattern scales without rewiring, since the router emits one more
`Send` and every worker writes the same accumulator key
([workflows-agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)); the
hardcoded-edges pattern means adding a node and an edge.

In INDRA's design order is a local data dependency. An actor observes the fact another asserts when it
finishes, so sequencing falls out of what each actor observes. Adding an actor that observes nothing
already present changes nothing already there. This is sequencing without a control graph.

### Failure shows up as a fact

A stall that crashes the request, or one that vanishes in silence, is the pain. LangGraph gives the
timeout and the error handler as named hooks. Mastra's parallel block waits for all branches and fails
whole on an uncaught throw ([control-flow](https://mastra.ai/docs/workflows/control-flow)).

In INDRA's design a stall or a crash shows up as a fact: the absence of an expected assertion, or a
timeout fact a watchdog asserts when a deadline passes. "Three expected, two present, deadline passed,
proceed" is something the developer writes declaratively over the fact set rather than racing by hand.
SAM's failure model works this way — an actor's assertions are retracted automatically when it
terminates, on a crash as much as an orderly exit
([capabilities](https://syndicate-lang.org/doc/capabilities)) — so the disappearance of a fact is the
signal.

### Every reaction has a recorded cause

The unexplainable run is the pain, and here LangGraph and Mastra are already strong. LangSmith
auto-traces a run as nested runs a developer can inspect
([observability](https://docs.langchain.com/oss/python/langgraph/observability)) and can replay or fork
an execution from a checkpoint
([time-travel](https://docs.langchain.com/oss/python/langgraph/use-time-travel)); Mastra captures agent
and workflow spans automatically and can export them to OpenTelemetry
([tracing](https://mastra.ai/docs/observability/tracing/overview)).

INDRA differs in where the causal record comes from. Because INDRA's coordination model is reactive by
design, an actor takes a turn when a fact it observed appeared, so the causal link is available to the
runtime by construction rather than reconstructed by instrumentation. SAM records it as a `caused-by`
back-pointer from each turn to the turn that caused it
([trace schema](https://synit.org/book/protocols/syndicate/trace.html)), and tracks each fact from
assertion to retraction by a handle ([glossary](https://syndicate-lang.org/doc/glossary#handle)). The
3am question "why did this fire" has an answer the design makes available by construction.

### One construct covers the pipeline and the open discussion

A single rigid shape forced onto flows that vary is the pain. In INDRA's design an actor observes facts
and reacts when they change. A strict pipeline is a narrow observation of one predecessor's fact; an
open "confer" is a wide observation of an accumulating set. Both are the same construct under a
different observation pattern, so the author is never forced to pick a flow shape up front.

## The concepts INDRA takes from syndicated actors

The dividing line is mostly clean: INDRA adopts SAM's coordination model and leaves its
distributed-systems substrate behind. Most friction in the mapping comes from the substrate; the
coordination-model concepts adopt cleanly, apart from a few adaptations noted in the table. Sources are
the Garnock-Jones corpus ([glossary](https://syndicate-lang.org/doc/glossary),
[capabilities](https://syndicate-lang.org/doc/capabilities)).

| SAM concept | How INDRA uses it | Disposition |
| --- | --- | --- |
| Assertion — retained, idempotent, auto-retracted on exit | A producer publishes an assertion carrying a typed fact; the core primitive, replacing today's `&`-path state writes and delegation returns | Adopt |
| Dataspace + Observe-by-pattern | A consumer declares a pattern and reacts; context assembled by fact observation. Because a subscription is itself an assertion, peers can observe observations | Adopt; visibility bounded by capability |
| Capability + attenuation | Fixes which facts an actor may observe and assert; isolation as a composable control | Adopt; adapts today's flat crossing |
| Facet + fate-sharing | A sub-task's facts have a principled lifetime, established and torn down with the conversation | Adapt |
| Transactional turn | Commit on success; the determinism boundary around the call | Adopt — commit-on-success is already specified (`interpreter-runtime` turn-boundary commit, `:9`); roll-back-and-retract-on-crash is designed, not yet specified |
| Supervision via retraction | A retracted assertion signals failure; a supervisor restarts | Adapt — today's typed-failure-to-supervisor becomes failure-as-retraction |
| Handle + caused-by trace | Provenance for emergent runs; the debugging record | Adopt |
| Dataflow field/block | Fine-grained reactive recompute; maps onto private state plus guard re-evaluation | Adapt |
| Message (transient) | One-shot sends where a retained fact is not wanted | Adapt |
| Preserves (value + schema) | Keep the typed-value-plus-schema idea — BAML already supplies it — and drop the wire format | Adapt |
| Eventual consistency | Substrate for asynchronously-landing inference results, under a deterministic dispatch rule | Adapt — see F1 below |
| Entity as a distinct unit of addressing | Collapsed into the actor; the finer granularity is deferred | Leave behind — see F2 below |
| Synchronization action | The single conductor already determines cross-async ordering | Leave behind |
| Network layer (SAM `scope`, relay, transport, OID, WireRef, membrane, gatekeeper, sturdyref, the Syndicate protocol) | Distribution machinery; INDRA is in-process with persistence deferred | Leave behind — see F3 below |
| Silent discard | Contradicts INDRA's load-time validation and recorded causes | Reject deliberately — see F4 below |

The dataspace visibility INDRA bounds with attenuated capabilities is a different thing from SAM's
network-layer `scope` (relay addressing), which it leaves behind; the two share a word and nothing else.

### The design forks, resolved

Mapping a faithful 1-1 met resistance in five places. Each was a fork in the re-founding, and each is
resolved below. The labels F1 through F5 carry through the spec work that follows.

**F1 — Determinism sits under an eventually-consistent surface.** SAM's primitive is
eventually-consistent replication, a property for surviving distribution; INDRA's identity is a
deterministic runtime. These are opposite guarantees. INDRA takes eventual consistency as the substrate
for asynchronously-arriving facts and recovers reproducibility with a deterministic dispatch rule: the
conductor selects the next turn by a fixed rule, so the structure and the order around every inference
run the same way each time even though the inference itself does not. The non-determinism stays at the
inference boundary. The 1-1 holds at the level of concepts and breaks at the level of the consistency
guarantee, and this dispatch rule is the keystone — the salvageable core of
`define-runtime-supervision-model`'s "the conductor selects the next actor by a deterministic rule."

**F2 — The actor is the unit, and the entity collapses into it.** SAM addresses an entity inside an
actor and lets one actor hold many; that granularity earns its keep in an operating system and adds a
layer INDRA does not need today. One reactive actor is the unit, and the finer entity granularity is
deferred. The cost is that capabilities are fine-grained per actor rather than per entity until that
granularity returns.

**F3 — Networking is most of SAM, and INDRA drops it.** A large share of the model exists to replicate
state across trust boundaries: the `scope`, relay, transport, OID, WireRef, membrane, the Syndicate
protocol, and the gatekeeper-sturdyref-macaroon credential chain
([protocol](https://syndicate-lang.org/doc/protocol)). INDRA runs in-process with persistence deferred,
so the network layer maps onto nothing it needs today. The honest framing is a 1-1 over the
computational core, with the network layer left for whenever distribution or persistence is designed.

**F4 — One deliberate departure: no silent discard.** SAM discards a non-matching assertion silently,
justified by the FLP impossibility result
([capabilities](https://syndicate-lang.org/doc/capabilities), footnote 6). INDRA keeps attenuation and
rejects the silence. Silence is the opposite of "every reaction has a recorded cause," which the 3am
debugger depends on, so an attenuation mismatch in INDRA is a typed error or a load-time rejection
rather than a quiet drop. This is the single place INDRA chooses against faithful adoption, and it does
so on purpose.

**F5 — The inference call is the actor's turn body.** An actor observes facts, takes a turn that
consults a model, and asserts a typed fact. The alternative was to model the call itself as an
assertion — an actor asserts a request fact, an inference-provider actor observes it and asserts the
result, so a failed call retracts — which is fully in-model but adds a dataspace round-trip per call.
INDRA makes the consultation the turn body instead, so an inference call needs no separate
request-and-answer round trip. This is the **inference boundary**: the one marked place a turn hands off
to non-deterministic inference and gets a typed value back.

## The borrowed shape, and where it breaks

Strip the structure to its bones: producers assert typed facts, consumers declare interest in a
pattern, the runtime routes and converges, and a capability bounds who observes what. Several mature
areas already live this shape, and INDRA borrows the idiom from them, under one caution that governs all
three: each is synchronous and pure, where inference is neither.

Reactive UI state, such as a Redux store or fine-grained signals in Solid, has components subscribe
(SAM's observe) to slices of state and re-run when a slice changes, never calling each other to obtain
state. Differential dataflow, and the live, incrementally-maintained database query, let a developer
declare a standing query and have a system maintain its result as inputs arrive. An Observe pattern
resembles a standing query, and incremental view maintenance shows that a declarative standing query can
be maintained without a hand-written update order; its convergence guarantees assume pure, terminating,
acyclic recompute, none of which inference offers, so the precedent lends the idiom while its guarantee
stays behind. The most familiar of the three is the spreadsheet: a cell holds a formula naming the cells
it depends on, the sheet recomputes the affected cells when an input changes, and nobody writes the
recompute order. An INDRA actor resembles a cell whose formula is an inference over the facts it
observes, and every working developer already understands a spreadsheet.

What transfers is the idiom: declare what I observe and what I assert, and let the runtime own order,
parallelism, joining, and recompute. What breaks is more than cost. The spreadsheet assumes recompute is
cheap, glitch-free, and synchronous, and inference is none of the three. It also assumes two structural
properties inference violates: a cell is a pure function of its inputs and recomputes to the same value,
where an inference recomputes non-deterministically; and a sheet forbids a cycle, where INDRA means to
allow cyclic observation (see Cycles). Those breakages are why the eventually-consistent substrate and
the deterministic dispatch rule sit underneath the friendly surface, instead of the surface pretending
the cost or the impurity away.

## Two hard problems under the friendly surface

The spreadsheet earns its friendliness by assuming two things inference breaks, and both land on the
same deterministic dispatch rule.

### Cycles

A spreadsheet forbids a circular reference. An open discussion is circular: one actor asserts, a second
reacts and asserts, the first reacts to the second. Once cyclic observation is allowed, "when does
iteration stop" returns, which is the bounded-iteration problem the current
`interpreter-runtime/spec.md:101` already reifies as an explicit iteration frame with a hard iteration
cap. That reification is the mechanism to keep. The open decision is whether the model permits cyclic
observation at all, and if so what bounds its convergence.

### Glitch-free observation

A spreadsheet propagates synchronously, so a reader never sees a half-updated sheet. Facts here land
asynchronously and in batches, so a turn observes either a consistent snapshot of the dataspace or a
partial one. ("Glitch-free," from reactive-programming usage, names the property that no reader ever
sees such a partial state.) Determinism forces the choice the metaphor hides: a turn observes an atomic
snapshot, and two facts asserted in one turn order their reactions by a defined rule. Deduplication and
idempotency are what make the snapshot well-defined.

So the deterministic dispatch rule owns three duties, not one: inter-turn order, intra-turn batch
consistency, and cycle termination. That is the real content under the surface.

## Open questions

- The deterministic dispatch rule must define inter-turn order, intra-turn batch consistency, and cycle
  termination together. `define-runtime-supervision-model` owns it.
- The one authoring construct. A watchdog that halts a subtree and an aggregator that reacts when a fact
  set reaches a shape both reduce to a pattern plus a turn body; the work is finding the single surface
  that covers both.
- How a developer expresses how much is determined. Capability width, inference latitude, and observe
  scope are three controls that should read as one coherent setting.

## How this ladders into the specs

Nothing in the current specs is worthless. The model specs are re-founded on this direction, the four
model changes are archived and their thinking harvested, and the mechanics artifacts stand.

### Model specs — re-found on SAM, with targeted deletions

- `interpreter-runtime` keeps the turn cycle and transactional boundary commit (the SAM turn, `:9`), the
  total deterministic expression evaluator (`:82`), halt-not-gated-by-trace (`:115`), the
  one-generic-interpreter-reads-data idea (`:67`), and loop-frame reification as a determinism mechanism
  (`:101`). It drops the delegation call stack with `await:` / `store_in:` / `&result` (`:38`),
  `say:`-routing by name (`:53`), and the `become:` / persona spawn (`:67`).
- `context-state` keeps the transactional whiteboard, staged-versus-immediate writes, and serialized
  contending commits (`:52`), which already behave like local deterministic replication. It drops the
  `&context` / `&user` / `&signals` namespaces and dotted-path addressing (`:9`, `:62`) in favor of
  typed assertions and dataflow fields.
- `inference-layer` keeps typed-value return (`:9`), declared output shapes (`:24`), reasoning-first
  emission (`:44`), and pure-function builtins (`:53`). It drops persona-as-record (`:33`) and renames
  the inference point to the inference boundary.
- `signal-system` is the most SAM-shaped spec already. It keeps the mailbox and turn-boundary
  observation (`:9`) and the runtime-owned signals namespace (`:59`), reframed as runtime-asserted
  facts, and reframes the `*command`, three-mode classification, and interjection model (`:28`) around
  the human as an asserting-and-observing actor.

### Model changes — archive and harvest

The four still live under `openspec/changes/`; archival is the planned disposition, not a completed
step.

- `framework-native-contracts` — high conceptual salvage (typed values, no string paths, the interpreter
  reads inspectable data, persona removal), but built on delegation, so it cannot stand as-is.
- `scope-context-by-actor-subtree` — the highest salvage; already groping toward object-capabilities
  (crossings to capabilities, interface-addressing to entity addressing, no-meld to isolation). Delete
  "one inference leaf is one inference call" (`.../actor-scope/spec.md:71`).
- `define-runtime-supervision-model` — high salvage; supervision is straight SAM, the deterministic
  next-actor rule answers the observation-order question, and logical concurrency over a serial
  conductor is how INDRA stays deterministic. Reframe failure-as-typed-value into failure-as-retraction.
- `validate-program-at-load` — moderate salvage; the load-time gate is a keeper, and the specific checks
  change (totality to reaction coverage, reference resolution to capability resolution, initial-state to
  initial assertions).

### Mechanics — stand unchanged

`package-boundaries`, `package-scaffold`, `git-hooks`, `module-resolution`, and the
`extract-inference-adapter` and `clarify-module-resolution` changes are not in the archive set. The only
follow-up is scrubbing dead colon-form references.

## Next steps

1. Re-found the four model specs onto this direction.
2. Archive the four model changes, harvesting their reusable requirements.
3. Settle the deterministic dispatch rule's three duties (inter-turn order, intra-turn batch
   consistency, cycle termination) in `define-runtime-supervision-model`, and the open questions above.
4. Scrub dead colon-form references from the mechanics artifacts.

The project `README.md` and the `CLAUDE.md` vocabulary already match this direction.
