# Discovery: mapping the Syndicated Actor Model onto INDRA

This is a repo-native coordination document, a sibling to
[syndicated-actor-model-borrow.md](./syndicated-actor-model-borrow.md). It records a discovery
exercise: a full crawl of the canonical Syndicated Actor Model sources, a concept-by-concept mapping
onto INDRA's current specs, and a verdict on what each spec and change is worth under the new
foundation. It captures an evaluation that feeds the re-founding, not a committed change. The
`openspec` CLI does not track this file; git does.

It supersedes the framing of the borrow document, which still treats INDRA's foundation as delegation
and the dataspace as one scoped addition. The settled direction is that INDRA's architectural
foundation is the Syndicated Actor Model itself, adopted as a faithful concept mapping and applied to
the agentic use case. The borrow document is kept for its lineage and its controlled-blend worked
example, both of which remain useful.

## What the model is, and what it is not

The Syndicated Actor Model (SAM) is the concurrency model whose foundational text is Tony
Garnock-Jones' 2017 Northeastern dissertation "Conversational Concurrency." Its fundamental primitive
is eventually-consistent replication of state among actors, with message-passing as a derived
operation (`https://syndicate-lang.org/doc/capabilities`). Synit is an operating system built on the
model; INDRA borrows the model, never the OS. The canonical site `syndicate-lang.org` and the Synit
manual are the same document tree by the same author, so concept definitions are identical across the
two; only the application framing differs (general concurrency versus an OS system layer).

INDRA takes the model's architecture and changes the use case to agentic apps — programs that make
inference calls to agents. The claim driving the adoption is that the context-coordination problem
SAM solves among isolated actors at a low level is the same problem an agentic program faces at a high
level: what each agent sees, what it may read, what it emits, and how state propagates without one
agent reaching into another.

## Sources crawled

- `https://syndicate-lang.org/` — the canonical model site (~80 pages); the glossary at `/doc/glossary`
  and the SAM tutorial at `/doc/capabilities` are the authoritative single sources.
- `https://synit.org/book/` — the Synit book; same text as above, plus OS-specific operation pages.
- `https://preserves.dev/` — the Preserves data-language spec (v0.996.3).
- Foundational papers located on the site: "Conversational Concurrency" (PhD, 2017), "Coordinated
  Concurrent Programming in Syndicate" (ESOP 2016), "The Network as a Language Construct" (ESOP 2014).
  Abstracts and framing captured from the canonical pages; PDFs not read in full.

## The computational core INDRA adopts

These are the model concepts that carry over. Each is defined in the glossary unless noted.

- **Actor** — an isolated thread of execution that takes events from a mailbox, one turn at a time.
  INDRA already has this.
- **Turn** — the unit of execution, quasi-transactional: actions commit on clean completion and roll
  back on crash, at which point the actor terminates and its assertions retract
  (`https://syndicate-lang.org/doc/capabilities`). INDRA's turn-boundary commit converges on this.
- **Assertion** — a published value denoting a portion of an actor's public state; retained until
  retracted, idempotent, automatically withdrawn when the asserting actor terminates. The core
  primitive INDRA gains.
- **Message** — a transient one-shot value to an entity, carrying no lifetime.
- **Dataspace** — an entity that routes and replicates assertions to peers by their declared interest.
- **Observe** — declaring interest by asserting an `Observe` record carrying a pattern; because the
  subscription is itself an assertion, peers can observe observations.
- **Capability** — an entity reference that doubles as an object-capability; concretely a triple of
  target actor reference, target entity reference, and an attenuation
  (`https://syndicate-lang.org/doc/capabilities`).
- **Attenuation** — a chain of filters prepended to a capability that discards, rewrites, or passes
  payloads; it restricts what a holder may assert and, because subscriptions are assertions, what it
  may observe.
- **Entity** — a stateful reactive object located inside an actor; the unit of addressing, since every
  assertion and message targets an entity rather than an actor.
- **Facet** — a language construct for one conversational frame; actors are a tree of facets, each
  owning assertions that share its fate, with structured-concurrency lifetime.
- **Handle** — a scope-unique identifier on every assertion so a later retraction correlates with it.
- **Supervision** — actors or facets monitor others and restart on failure; failure is signalled by
  the guaranteed retraction of a terminated actor's assertions.
- **Dataflow** — state changes auto-re-evaluate dependent computation, at a fine grain (intra-actor
  fields read by blocks that re-run on change) and a coarse grain (assertion changes among actors).
- **Preserves value and schema** — the model's value language and its mapping to host-language types.
- **Trace, `TurnCause`, caused-by** — a turn records the prior turn that caused it, giving a causal
  back-pointer for provenance (`https://synit.org/book/guide/tracing.html`).

## What is out of scope

A large share of the model is networking: scope, network, relay, relay entity, transport, OID,
WireRef, membrane, wire symbol, the Syndicate protocol, and the gatekeeper, sturdyref, and macaroon
credential chain (`https://syndicate-lang.org/doc/protocol`, glossary). These exist to replicate state
across trust boundaries. INDRA runs in-process and has deferred persistence, so the network layer maps
onto nothing INDRA needs today. A faithful adoption is therefore 1-1 over the computational core and
leaves the network layer for whenever distribution or persistence is designed.

## The concept parallels

| SAM concept | INDRA counterpart | Status |
| --- | --- | --- |
| Actor | Actor | Adopt |
| Turn (transactional) | Turn-boundary commit, parse-fail-before-commit (`interpreter-runtime/spec.md:9-11`, `inference-layer/spec.md:11`) | Adopt — convergence |
| Mailbox, boundary observation | Mailbox-delivered signals at boundaries (`signal-system/spec.md:9-11`) | Adopt |
| Assertion | none today (state is `&`-paths) | New — core primitive |
| Message | `say:` / `emit:` (`interpreter-runtime/spec.md:53`) | Adapt |
| Dataspace | none | New, scoped |
| Observe | none (you name an `await:` target) | New |
| Capability | Crossing / typed interface (`actor-scope`) | Adapt — flat to attenuable |
| Attenuation | none (crossing is flat) | New |
| Entity | none; INDRA addresses whole actors | New — design fork F2 |
| Facet | Frame / actor subtree | Adapt |
| Handle | none | New |
| Supervision (retraction-signalled) | Typed failure to supervisor (`define-runtime-supervision-model`) | Adapt |
| Dataflow field + block | `&context` cells + guard re-eval (`context-state`) | Adapt |
| Preserves value + schema | TypeScript values + BAML schemas | Adapt — drop wire format |
| Trace / caused-by | trace subsystem (supervision change) | Adopt the back-pointer |
| Scope, network, relay, transport, OID, protocol, gatekeeper | none | Out of scope |

## Five frictions where the mapping is not clean

These are the places a faithful mapping meets resistance. Three are design decisions for the
re-founding; their resolutions are recorded in the decisions section below once settled.

### F1 — Eventual consistency versus determinism

SAM's primitive is eventually-consistent replication, a property for surviving distribution. INDRA's
identity is a deterministic runtime. The two are opposite guarantees. INDRA can adopt the interaction
shape (assert, observe, dataspace, capability, turn, facet) while running it as local, synchronous,
single-conductor, ordered replication, which is deterministic. The 1-1 holds at the level of concepts
and breaks at the level of the consistency guarantee. This must be stated in the foundation.

### F2 — The entity is SAM's unit of addressing, and INDRA has no slot for it

In SAM you address an entity, not an actor, and one actor holds many entities. INDRA addresses whole
actors through an interface (`scope-context .../actor-scope/spec.md:52`). Faithful adoption requires
either introducing entities as addressable reactive sub-objects within an actor, or collapsing to one
entity per actor, which discards the concept that makes capabilities fine-grained.

### F3 — Networking is most of SAM, and INDRA drops it

Covered above. The honest framing is 1-1 over the computational core, network layer deferred.

### F4 — Silent discard is deliberate in SAM and hostile to INDRA

SAM discards non-matching assertions with no feedback, justified by the FLP impossibility result
(`https://syndicate-lang.org/doc/capabilities`, footnote 6). INDRA validates at load and raises typed
errors. INDRA should take attenuation and refuse silent discard, turning a mismatch into a typed or
load-time error.

### F5 — Where an inference call sits in an assert-and-observe world

An inference call is a request that returns one typed value. It can be modelled as an assertion (an
actor asserts a request fact; an inference-provider actor observes it and asserts the result, so a
failed call retracts), which is fully in-model but adds a dataspace round-trip per call; or the
inference boundary can be a turn-local primitive action alongside assert, retract, and message, not
routed through the dataspace. This is the central agentic design decision, and the model docs cannot
answer it.

## Per-artifact salvage verdict

Nothing is worthless. The model specs are re-founded, the four model changes are archived and their
thinking harvested, and the six mechanics artifacts stand.

### Model specs — re-found on SAM, with targeted deletions

- `interpreter-runtime` — salvage the turn cycle and transactional commit (`:9`), the expression
  evaluator (`:82`), halt-not-gated-by-trace (`:115`), the one-generic-interpreter-reads-data idea
  (`:67`), and loop reification as a determinism mechanism (`:101`). Delete the delegation call stack
  with `await:` / `store_in:` / `&result` (`:38`), `say:`-routing-by-name (`:53`), and `become:` /
  persona from the interpreter requirement (`:67`).
- `context-state` — salvage the transactional whiteboard, staged-versus-immediate writes, and
  serialized contending commits (`:52`), which already behave like local deterministic replication.
  Delete the `&context` / `&user` / `&signals` namespaces and dotted-path addressing (`:9`, `:62`) in
  favour of assertions and dataflow fields.
- `inference-layer` — salvage typed-value return (`:9`), declared output shapes (`:24`),
  reasoning-first emission (`:44`), and pure-functions-are-host (`:53`). Delete personas-as-records
  (`:33`). Rename the inference point or leaf to the inference boundary.
- `signal-system` — the most SAM-shaped spec already; salvage the mailbox and boundary observation
  (`:9`) and the runtime-owned signals namespace (`:59`), reframed as runtime-asserted facts. Reframe
  the `*command`, three-mode classification, and interjection model (`:28`) around the human as an
  asserting-and-observing actor.

### Model changes — archive and harvest

- `framework-native-contracts` — high conceptual salvage (typed values, no string paths, interpreter
  reads inspectable data, persona removal), but built on delegation; cannot stand as-is.
- `scope-context-by-actor-subtree` — the highest salvage; already groping toward object-capabilities
  (crossings to capabilities, interface-addressing to entity addressing, no-meld to isolation). Delete
  "one inference leaf is one inference call" (`.../actor-scope/spec.md:71`).
- `define-runtime-supervision-model` — high salvage; supervision is straight SAM, the deterministic
  next-actor rule answers the observation-order question, and logical-concurrency-over-a-serial-
  conductor is how INDRA stays deterministic. Reframe failure-as-typed-value into failure-as-retraction.
- `validate-program-at-load` — moderate salvage; the load-time gate is a keeper, the specific checks
  change (totality to reaction coverage, reference resolution to capability resolution, initial-state
  to initial assertions).

### Mechanics — salvage, leave in place

`git-hooks`, `package-boundaries`, `package-scaffold`, `extract-inference-adapter`,
`clarify-module-resolution`, and `module-resolution` (file assembly). The only follow-up is scrubbing
dead colon-form references. These are not in the archive set.

## Next steps

1. Settle F1, F2, and F5 (and confirm F4); record the decisions in this document.
2. Write the new foundational spec: the INDRA-named syndicated-actor concept set, in-process and
   deterministic, agentic use case, network layer deferred.
3. Re-found the four model specs onto it.
4. Archive the four model changes, harvesting their requirements.
5. Scrub dead colon-form references from the mechanics artifacts; update `README.md` and the project
   `CLAUDE.md` vocabulary to match.

## Decisions

To be recorded here as F1, F2, F5, and F4 are settled.
