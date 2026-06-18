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
is the package at the center of the dependency graph.

## Where the system stands now

The repository is one git repo holding several kinds of thing, and only one of them is built as a
TypeScript package:

- `runtime/` — the one TypeScript package. The executor: a world store and turn evaluator built on
  Effect, an XState layer for choreography, a BAML seam for inference, and a hand-authored AST it
  runs. This is the dense piece the chunking is meant to relieve.
- `legacy/commands/`, `legacy/lib/prism/`, `legacy/core/` — the prompt-era INDRA `.in` sources:
  programs, library modules, and the protocol, authored for the model that role-played the
  interpreter. They are kept under `legacy/` as reference; they are not TypeScript, and the runtime
  does not execute them.
- `openspec/specs/` and `docs/` — the semantic source of truth and the conceptual writing.
- `legacy/thinkies/` — the agent definitions from that era.

So the monorepo already has five or six natural packages latent in it, and only the runtime has
been written. Bootstrapping is less about inventing structure than about surfacing the structure
that is already there.

## The natural joints

The runtime couples at a small set of joints, each re-verifiable against the tree by an import-graph
trace of `runtime/src`:

- **The AST is the clean contract.** `runtime/src/ast/types.ts` imports nothing from the runtime
  and has 20+ importers. It is the artifact every front-end compiles to.
- **The error taxonomy is shared vocabulary, not substrate.** `runtime/src/effect/errors.ts`
  imports only effect's `Data` and is imported across the executor (`baml/inference.ts`,
  `baml/inference.layer.ts`, `effect/initial-state.ts`, `effect/context-store.ts`,
  `effect/turn.ts`); no test imports it. It belongs with the contract, not the executor.
- **`effect/` is a world store and a turn evaluator, not a substrate.** It holds five different
  kinds of thing: a world store (`path.ts`, `context-store.ts`, `context-store.layer.ts`), the turn
  evaluator (`turn.ts` — the active operational semantics, the opposite of a passive base), a
  validation pass (`initial-state.ts`), the error taxonomy (`errors.ts`), and assembly glue
  (`runtime.ts`). The word "substrate" misdescribes it.
- **`effect/` has no edge to `xstate/`.** The dependency runs one way, `xstate → effect`, crossing
  through a single bridge module (`runtime/src/xstate/leaves.ts`). The core/choreography split is a
  clean cut, not an untangling. Its shared contract (`TurnOutcome`, the events, the leaf signatures)
  is **provisional** — the unbuilt `say:`-routing and `await:`-resume seams will reshape it.
- **The inference port and adapter are separable.** `runtime/src/baml/inference.ts` (the `Inference`
  tag, interface, and stub) is type-only and widely consumed; `inference.layer.ts` (the live layer)
  is the only module that reaches the `@boundaryml/baml` binding, and it does so transitively through
  the generated client.
- **The inference result type leaks from generated code.** `inference.ts` imports `WelcomeResult`
  type-only from the generated `baml_client/types.ts`, which is gitignored and produced by
  `baml-cli generate` (`runtime/baml_src/generators.baml`). The result shape must live in the
  contract, or the executor cannot typecheck without running the adapter's codegen.

The first chunk is the contract at the root of the graph. It lets a reader hold any one package
without the rest, and because the AST is already cleanly detached, the contract package precedes
taming the runtime rather than waiting on it. Promoting the AST to a versioned IR is a larger move
that builds on the contract once it is its own package.

## The target architecture: the hourglass

The shape is an hourglass with a deterministic contract at the waist. Producers compile *to* it;
consumers execute *from* it. The contract package imports nothing, so no consumer can reach back
into a producer, and the inward-only dependency rule the runtime states in a comment
(`runtime/ARCHITECTURE.md:45`) holds as compiler-enforced structure rather than convention.

```text
  PRODUCERS (later: eDSL, .in parser)  ──▶  @indra/runtime-contracts  ◀──  CONSUMERS
                                            IR types · errors ·             core (executor)
                                            inference shapes ·              choreography
                                            provisional choreo contract     inference adapter
```

All packages live under one `runtime` scope:

- **`@indra/runtime-contracts`** — IR/AST types, the error taxonomy, inference result shapes, and
  the provisional core↔choreography contract. Imports no workspace package; sits at the root of the
  dependency graph.
- **`@indra/runtime-core`** — the world store, the turn evaluator, validation, and assembly; owns
  the `Inference` port. Depends on contracts.
- **`@indra/runtime-choreography`** — the XState conductor, actor machine, leaves, and events.
  Depends on core and contracts. Its contract with core is provisional.
- **`@indra/runtime-inference-baml`** — the live BAML adapter behind the port; the only package
  carrying the `@boundaryml/baml` binding. Depends on core and contracts.
- **`@indra/runtime-host`** — the composition root (the renamed entrypoint, not a CLI): the only
  package that imports a concrete adapter, keeping the others BAML-free. Depends on choreography,
  inference-baml, and contracts.

The load-bearing property of this architecture is that the inward-only rule is structural by
construction: the contract package imports nothing, so nothing can reach behind it. Two facts ground
that design and are verifiable in the source as it stands — the AST contract imports nothing from
the runtime, and `effect/` carries no edge to `xstate/`. The package boundaries that turn those
facts into enforced structure are the deliverable of the laddering changes below; the current
single-package tree proves the facts but does not yet enforce the boundary.

## The laddering changes

Two changes carry the bootstrap, in dependency order `1 → 2`. Each is one bounded, describable seam,
and refactor (packaging) stays separate from behavior change (IR hardening).

- **`bootstrap-workspace-and-contracts`** (deps: none) — stand up the Bun workspace (catalogs, the
  tsc project-reference graph, rslib, Turbo, Biome); relocate the runtime under
  `packages/runtime/*`; extract `@indra/runtime-contracts`; split `effect/` → `@indra/runtime-core`
  and `xstate/` → `@indra/runtime-choreography`; create `@indra/runtime-host`. Its
  `package-boundaries` capability makes the inward-only rule structural.
- **`extract-inference-adapter`** (deps: change 1) — move the live adapter, `baml_src/`, and the
  generated client into `@indra/runtime-inference-baml`; formalize the `Inference` port as a
  core-owned module; move `WelcomeResult` into `@indra/runtime-contracts` (forced by the
  result-type leak). It extends `package-boundaries` with the inference-specific invariants.

Beyond the two bootstrap cuts, the ladder continues:

- **`validate-program-at-load`** — the load-time validation spine salvaged from the dissolved
  `define-program-ir`. It builds on `framework-native-contracts`: the typed structure and typed
  inference references reduce validation to a residue — structural well-formedness, branch totality,
  actor-reference resolution, and initial-state completeness — checked before the conductor spawns.
  The versioned IR document, name registry, and serializability invariant are dropped as
  language-era framing.
- **`own-inference`** — swaps BAML for an Effect-Schema adapter behind the same port; it builds on
  `extract-inference-adapter`.
- **Docs** — a central `docs/` page documenting every boundary and contract, retiring the word
  "substrate" in `runtime/ARCHITECTURE.md` and `docs/architecture.md`, with a ledger entry per cut.

## The lens: problems solved and problems created

Every cut buys something and costs something. This initiative tracks both, because the cost is
where the next problem hides. Each proposed package earns an entry: what it makes legible, and what
new seam or boundary it introduces. The seed of that ledger is the frame above — INDRA solves the
blackboard's three failures by refusing opportunistic control, and pays for it in flexibility and in
the work of authoring structure by hand. The cuts below grow the ledger as they land.

- **Contracts extraction** — *solves:* the contract is a real boundary nothing can reach behind, and
  the inward-only rule is a compiler-enforced fact. *costs:* a shared package every other package
  depends on, so a change to the contract ripples widest.
- **Core/choreography split** — *solves:* chunks the executor along its true cognitive joint — the
  state model versus the turn loop. *costs:* freezes a still-moving contract into a package line
  (mitigated: the core↔choreography contract is marked provisional, so the package boundary is not
  read as a frozen contract).
- **Inference adapter extraction** — *solves:* the deterministic core stops depending on a
  Rust-backed codegen DSL, and typechecks without running the adapter's codegen. *costs:* the host
  must wire the concrete adapter, and the result shape must be owned by the contract rather than the
  generated client.

### Landed: `bootstrap-workspace-and-contracts`

The first cut landed the workspace and the two boundaries it set out to make structural. Each entry
below rests on the verification gates that close the change, so the claims are checkable rather than
asserted.

- **Contracts extraction (landed)** — `@indra/runtime-contracts` now sits at the root of the
  dependency graph and imports no workspace package. Its source carries no `@indra/runtime-*` import,
  and its manifest depends only on `effect`. The inward-only rule is a compiler-enforced fact rather
  than a comment now: `tsc -b` is green across the project-reference graph from the repo root. *Cost
  realized:* every other runtime package depends on contracts, so the widest-rippling change in the
  workspace is a change to the contract — the price the hourglass waist charges for being the waist.
- **Core/choreography split (landed)** — `@indra/runtime-core` (the world store, the turn evaluator,
  validation, and assembly) and `@indra/runtime-choreography` (the XState conductor) are separate
  packages cut along the verified one-directional joint. The core carries no edge to the
  choreography, confirmed in both the manifest and the source, and the choreography depends inward on
  the core. The shared core↔choreography contract — `TurnOutcome`, the events, the leaf signatures —
  lives in the contract package marked provisional, so the package line is not read as a frozen
  contract. The offline suite stays green across both packages. *Cost realized:* that provisional
  contract now spans a package boundary, so the unbuilt `say:`-routing and `await:`-resume seams will
  reshape a cross-package type rather than an in-package one.

## Status

Living document. `bootstrap-workspace-and-contracts` has landed — the workspace stands, the contract
package is at the root of the graph, and the core/choreography split holds (see the landed entries
above). `extract-inference-adapter` is the immediate next cut, and it extends the workspace this
change created. Each cut grows the ledger with what it actually made legible and what new boundary it
introduced.
