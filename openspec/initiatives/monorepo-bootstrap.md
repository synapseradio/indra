# Initiative: Bootstrap INDRA as a TypeScript monorepo

This is a repo-native coordination document. It plays the role an OpenSpec *initiative*
plays — the durable "why" that individual changes under `openspec/changes/` ladder up to —
but it lives in the repo as a plain file rather than in an external context store. OpenSpec's
initiative primitive cannot live inside a git repository by design, and the value here is the
document and its framing, not the tooling around it. The `openspec` CLI does not track this
file; git does.

## North star: comprehension before construction

The goal is to make INDRA fit in one person's head. Today it does not. The runtime is a single
dense package doing several things at once, and holding all of it — plus the problems it solves
and the problems it creates — exceeds what one person can keep in working memory at a time.

The monorepo is the remedy, but not as a build arrangement. It is a way to cut the system at its
natural joints, so that each package carries one bounded contract and understanding any single
piece never requires loading all the others. The packages are the chunks. The chunking is the
point.

Construction follows comprehension, not the other way around. No package is extracted until the
seam it sits on is understood well enough to state plainly what that package solves and what it
costs. A seam we cannot yet describe is a seam we are not ready to cut.

## Why INDRA exists (the frame this work serves)

INDRA's thesis is that a reasoning process is a program, not a prompt. The structure of that
program — which actor takes a turn, which branch a guard selects, what gets written to the shared
world and when — runs identically every time, because ordinary code executes it. The model is
consulted only at the marked `<...>` inference points, and each consultation returns a typed value
the runtime can check. The model never decides control, never writes the shared world, never
commits.

That is a deliberate stance against the blackboard architecture that modern multi-agent systems
keep rediscovering: shared mutable state every fallible agent can write, opportunistic control
nobody authored, and behavior that emerges rather than gets designed. INDRA refuses the trade.
It buys legibility by keeping the program authored and the model confined to typed leaves. The
background for this framing lives in [docs/architecture.md](../../docs/architecture.md) and the
conversation saved in [notes/hearsay-challenge.txt](../../notes/hearsay-challenge.txt).

The monorepo is that stance made physical. The deterministic contract at the center of the system
becomes the package at the center of the dependency graph.

## Where the system stands now

The repository is one git repo holding several kinds of thing, and only one of them is built as a
TypeScript package:

- `runtime/` — the one TypeScript package. The executor: an Effect substrate for state and IO, an
  XState layer for choreography, a BAML seam for inference, and a hand-authored AST it runs. This
  is the dense piece the chunking is meant to relieve.
- `legacy/commands/`, `legacy/lib/prism/`, `legacy/core/` — the prompt-era INDRA `.in` sources:
  programs, library modules, and the protocol, authored for the model that role-played the
  interpreter. They are kept under `legacy/` as reference; they are not TypeScript, and the runtime
  does not execute them.
- `openspec/specs/` and `docs/` — the semantic source of truth and the conceptual writing.
- `legacy/thinkies/` — the agent definitions from that era.

So the monorepo already has five or six natural packages latent in it, and only the runtime has
been written. Bootstrapping is less about inventing structure than about surfacing the structure
that is already there.

## A hypothesis, not a plan: the hourglass

One plausible shape is an hourglass, with a deterministic contract at the waist. Front-ends compile
*to* it; the runtime executes *from* it; neither side knows the other exists.

```
   PRODUCERS  (compile to the contract)
     eDSL  ·  .in parser  ·  .in sources
                    │
                    ▼
            ┌───────────────┐
            │   the IR /    │   the contract at the waist:
            │   Program     │   node forms, the serializability invariant,
            │   contract    │   a version field, a schema for validation
            └───────────────┘
                    │
                    ▼
   CONSUMERS  (execute from the contract)
     validation  ·  runtime executor  ·  inference registry
```

The appeal is that the dependency rule the runtime currently states in a comment — depend inward,
toward data — would become a fact the compiler enforces, because the contract package would import
nothing and the executor could not reach back into a front-end. This is one candidate decomposition.
It is recorded here as a hypothesis to test against the runtime, not as a decision.

## Open questions that drive the work

These are unresolved, and resolving them is the actual work of this initiative. They are listed
before any task list on purpose.

- **Is the IR the right first chunk?** Undecided, and currently doubted. The runtime is complex
  enough that the first useful move may be to decompose it *internally* — to understand the
  boundary between the Effect substrate, the XState choreography, and the inference seam — before
  any package is extracted at all. Promoting the AST to a versioned IR is a large move; it should
  not go first merely because it was the first one written down.
- **What is the smallest chunk that reduces head-load?** The right first cut is the one that lets
  a reader hold one part without the rest. That is an empirical question about where the runtime's
  internal coupling actually is, answerable only by reading it.
- **Does a contract package precede or follow taming the runtime?** The hourglass assumes the
  contract is extractable cleanly. Whether that is true depends on how entangled the current AST is
  with the executor that consumes it.

## Relationship to existing changes

- `define-program-ir` — a fully drafted change (proposal, design, four spec deltas; no tasks yet)
  that promotes the AST to a versioned, validated IR. It is a **candidate first extraction, parked**
  pending the decomposition pass above. Its framing is sound; its position in the sequence is the
  open question.
- `runtime-improvements` — an empty change shell. Scope to be determined once the chunk boundaries
  are clearer.

## The lens: problems solved and problems created

Every cut buys something and costs something. This initiative tracks both, because the cost is
where the next problem hides. As the decomposition proceeds, each proposed package earns an entry:
what it makes legible, and what new seam or boundary it introduces. The seed of that ledger is the
frame above — INDRA solves the blackboard's three failures by refusing opportunistic control, and
pays for it in flexibility and in the work of authoring structure by hand.

## Status

Living document. The next step is analysis, not implementation: a decomposition pass over `runtime/`
to find where its real internal boundaries are, so the first chunk can be chosen by evidence rather
than by which idea was written down first.
