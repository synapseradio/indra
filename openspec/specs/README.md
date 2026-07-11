# INDRA specs

**These specs are in flux.** INDRA is in exploratory phases.

INDRA is a TypeScript agentic framework with a deterministic runtime. The invariants that make it worth using — determinism, protection of runtime-owned state, the typed inference boundary, and isolation between actors — live in the **framework**, never in any surface a program is written in. A developer writes against a typed actor model: actors, their guarded turn logic, the typed values they hold, and the typed inference points where a model supplies judgment. A surface language, were one added later, would be a front-end that constructs that same typed actor model and inherits whatever guarantees the model carries; the framework runs the model, not the surface.

The capabilities below are grouped by the distinction between the framework and the surface a program is authored in. The grouping is an organizing principle, not a directory structure — OpenSpec discovers each capability as a flat `specs/<id>/spec.md`, and capabilities introduced by changes under `openspec/changes/` are placed in the same groups. Not every invariant named above is fully specified yet; the capability specs are the source of truth for what the framework enforces today, and the changes under `openspec/changes/` are where the rest is being defined.

## Framework — runtime semantics

The execution model and the invariants it enforces.

- **framework-core-runtime** — the deterministic execution core: the single canonical turn cycle, the deterministic dispatch rule that orders turns, supervision through assertion retraction, total side-effect-free expression evaluation, and the one generic interpreter actor parameterized by data.
- **context-state** — the state model: the staged-versus-immediate write semantics, the atomic turn-boundary commit, and the protection of runtime-owned state from program writes.
- **signal-system** — how signals and user `*commands` are received, delivered to a mailbox, and observed at turn boundaries, including the classification of every user input as a signal, an awaited response, or an interjection.

## Framework — workspace and build

How the framework itself is physically decomposed and tested. Internal architecture, not runtime behavior and not an authoring surface.

- **package-boundaries** — the decomposition into a Bun workspace of `@indra/runtime-*` packages and the inward-only dependency invariants enforced across the cuts.
- **package-scaffold** — what the manifest-driven scaffold produces per package and how the offline test suite resolves and runs against source with no build step.

## Surface — authoring and composition

How a program is assembled from files. The framework runs whatever a program compiles to; a dedicated surface language is a front-end the framework does not require.

- **module-resolution** — how programs assemble from files: static imports resolved deepest-first before the first turn, `use` clauses that narrow the exposed surface, deduplication by canonical path, and cycle detection.
