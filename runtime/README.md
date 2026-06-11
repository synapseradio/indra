# INDRA runtime

This is the deterministic TypeScript runtime that executes INDRA `.in` programs. It replaces the older model where a single LLM role-played the whole interpreter. The work that must behave identically every run now lives in real code, and the model is left with only the bounded inference inside the `<...>` direct-prompt channel.

Three libraries split the ownership, and the boundaries do not overlap:

- **XState v5** owns the choreography — actors, the turn loop, the delegation call stack, and `say:`/`await:`/`return:` control transfer. A single conductor actor holds the turn baton and owns the commit boundary.
- **Effect** owns the substrate — file IO, the typed error taxonomy, dependency injection, and the shared `&context` world. State lives in Effect STM so actors can run in parallel against one transactional whiteboard.
- **BAML** owns inference — every `<...>` becomes one typed function, and personas become reusable system-role templates.

The full reasoning behind this split, and the resolution of every place the protocol spec disagreed with itself, is in the change design at `../openspec/changes/extract-deterministic-runtime/design.md`.

## What runs today

The offline core is complete and green. The generic actor interpreter, the conductor turn cycle, the STM-backed context store with staged-versus-immediate `set:` semantics, the typed BAML return path, and `await:` delegation all run and are covered by tests against a stub inference layer.

The live seam is proven too: the gated live test drives one full turn against the real Anthropic model — typed inference return, STM commit, `say:` output, conductor back at idle.

## Prerequisites

The package manager is **Bun**. Tests run under **vitest**, not `bun test` — the `test` script wires that up for you, so reach for the scripts below rather than calling the test runner directly.

A real model call needs an `ANTHROPIC_API_KEY` in the environment. You only need it for the live entrypoint and the live test. The entire offline suite runs without any key, because those tests substitute a stub inference layer and never touch the network.

## Setup

Install dependencies once:

```
bun install
```

The BAML client under `baml_client/` is generated code, not checked in. Generate it before anything that imports it:

```
bun run generate
```

You rarely call `generate` by hand, because the `pretest` and `build` scripts run it for you. It is here for the first checkout and for when you change a `.baml` file.

## The scripts

| Command | What it does |
|---|---|
| `bun run generate` | Regenerate the BAML client from `baml_src/` into `baml_client/`. |
| `bun run typecheck` | Type-check the source and the generated BAML client against the strict config. |
| `bun run build` | Generate, then type-check. The full offline gate. |
| `bun run test` | Generate, then run the offline suite under vitest. No key needed. |
| `bun run test:watch` | The offline suite in watch mode. |
| `bun run test:live` | The gated live tests that make a real model call. Needs `ANTHROPIC_API_KEY`; skips cleanly without it. |

## Running the offline suite

```
bun run test
```

This is the one to reach for while developing. It regenerates the BAML client, then runs every `*.test.ts` file except the live ones. A clean run is eight files, eighteen tests. Four of those files are the seam proofs — staging invisibility, sequence immediacy, parallel STM commit, and typed return — that pin the semantics the design depends on.

## Running a real turn

Two ways to fire a real model call, both gated on the key.

The live test drives exactly one turn against the model and asserts the machine settles back to idle rather than halting. It is the cheapest way to confirm the network seam works:

```
ANTHROPIC_API_KEY=sk-... bun run test:live
```

The interactive entrypoint at `src/index.ts` assembles the same system with the real inference layer, prints each `say:` to stdout, and feeds your stdin lines in as user input:

```
ANTHROPIC_API_KEY=sk-... bun run src/index.ts
```

The entrypoint runs the walking-skeleton program — a single actor derived from `commands/explore.in`, stripped down to await user input, run one inference, stage one `set:`, and say the typed result.

## Layout

```
baml_src/        the .baml sources: clients, the explore function, personas, generators
baml_client/     generated BAML client (gitignored; produced by `generate`)
src/
  index.ts       the live, stdin-driven entrypoint
  ast/           the hand-authored program AST and its types (the parser is a later capability)
  effect/        the STM context store, the turn anatomy, errors, the Effect runtime
  xstate/        the conductor machine, the generic INDRA-actor interpreter, the wiring
  baml/          the inference service and its Effect layer
  test/          offline seam and unit tests, plus the gated *.live.test.ts
experiments/     de-risking experiments with their own BAML projects; each
                 carries a findings.md (see inference-fidelity/ for 7.3)
```

The program the runtime executes is an AST hand-authored in `src/ast/`, not parsed from a `.in` file yet. The skeleton proves execution; parsing is a separate capability that comes later. See the change tasks at `../openspec/changes/extract-deterministic-runtime/tasks.md` for what is done and what remains.
