# INDRA toolchain roadmap

This document is a roadmap. It describes what the INDRA toolchain will become and the order in which the pieces arrive, and it marks plainly what is already built versus what is still planned. Unlike [architecture.md](./architecture.md), which describes the runtime as it exists today, this document is allowed to talk about the future, because sequencing is the whole point: the order the pieces come in is not arbitrary, and the reasons for the order are as much the subject here as the pieces themselves.

The short version of the state of things. The deterministic runtime is built and runs — see architecture.md for how. The program it executes is still hand-authored as an in-memory AST rather than parsed from a `.in` file. Everything between a `.in` file on disk and that AST, and everything that would let a person or an agent drive the runtime interactively, is planned. This roadmap is about that gap and how it closes.

## The sequence, and why it is this sequence

The toolchain is planned in a deliberate order, and the order is driven by one structural fact: several tools all need the same thing, so that thing comes first.

The parser comes first because it is not just the runner's front end. A spanned, lossless syntax tree is consumed by the language server, by the interactive REPL, and by the module linker as well as by the runner. Building it as a private detail of the runner would mean rebuilding it three more times. So the parser is planned as a standalone language core with source spans from its first day, before any of its consumers.

Module resolution follows the parser, because resolving imports means parsing the files you import. The semantics of resolution are already captured — the open specs settle how a `use` clause scopes names, how diamonds and cycles are handled, and that resolution happens before execution — so this step is specification-complete and waiting on the parser, not on more design.

The command-line runner comes next, because once a `.in` file can be parsed and its imports resolved, `indra run` is the thinnest thing that turns the existing runtime into a tool a person can point at a file.

The REPL and the language server come after the runner, and both are consumers of the same language core the parser produced. The REPL is the more interesting of the two, because making a human utterance a first-class turn inside a running program is an open architectural question, not a settled feature.

Binary distribution comes last, and it is deliberately gated rather than merely late. It is in tension with the inference pipeline, and until that tension resolves, shipping a compiled binary would commit to an answer the project has not yet chosen. That gate is explained in its own section below.

## The parser and the shared language core (planned)

The plan is a grammar formalization and a parser that produces a spanned, lossless abstract syntax tree, packaged as a standalone library — the shared language core. "Spanned" means every node remembers where in the source text it came from, down to byte offsets. "Lossless" means the tree preserves enough of the original — including whitespace and comments — that the source can be reconstructed from it. Neither property matters much to a runner that only wants to execute a program, but both are essential to the other consumers, which is exactly why they are required from the start rather than retrofitted.

The language server needs spans to map a diagnostic back to the range of text it underlines. The REPL needs spans to highlight and to report errors against what the user just typed. The linker needs spans to point at the exact import that formed a cycle. A parser built for the runner alone would throw this information away; a parser built as the shared core keeps it because its other consumers depend on it.

The eventual output of this parser already has a fixed shape. The runtime's AST types in `runtime/src/ast/types.ts` are, by their own comment, "the parser's eventual output" (`runtime/src/ast/types.ts:11-12`), and the hand-authored skeleton program in `runtime/src/ast/programs/skeleton.ts` is a worked example of what the parser must one day emit. So the parser is not designing a target from scratch; it is producing data the runtime already knows how to interpret. The canonical grammar and the meaning of each construct are the language's own, described in the language overview; this roadmap treats that overview as the authority for what the grammar *is* and concerns itself with the tool that reads it.

One grammar repair lands with the parser rather than before it. The legacy protocol's grammar required a leading output block inside every `perform:`, but the protocol's own examples and the whole existing library treat it as optional, and the runtime AST already encodes the optional reading (`runtime/src/ast/types.ts:111-116`, where `output` is an optional member). The parser is where that repair becomes real grammar.

## Module resolution (planned, specified)

The plan is a resolver that takes an entry `.in` file and produces a single resolved program by inlining its imports, run before execution begins. The semantics are already captured in the open specs, so this step waits on the parser and on nothing else.

A `use` clause scopes which names an import exposes. A file is inlined whole — its transitive imports must resolve — but when a `use` clause names specific symbols, only those symbols are bound and visible; absent a `use` clause, all of a file's top-level components are visible. Resolution tracks a visited set keyed by canonical absolute path, so a diamond import inlines once and later references to it are no-ops, while a true cycle halts with a fatal error that names the cycle. These rules are settled; what remains is to build the resolver on top of the parser.

The resolved program this step produces is the `Program` the runtime already consumes (`runtime/src/ast/types.ts:135-139`): an entry actor id, an initial world that seeds every namespace, and an actor table keyed by id. Today that `Program` value is hand-authored; the resolver is what will produce it from files on disk.

## The command-line runner (planned)

The plan is `indra run`, a command that takes a `.in` file, parses and resolves it into a `Program`, and drives the existing runtime to execute it. The runtime side of this already exists: `runtime/src/index.ts` assembles the actor system over a program, prints each `say:` to stdout, and feeds stdin lines in as user input (`runtime/src/index.ts:16-34`). What the runner adds in front of that is the parse-and-resolve front end the parser and module resolver provide. Once those two land, `indra run path/to/program.in` is a small step, which is why it is the first tool to ship on top of the language core.

## The agent-integrated REPL (planned, with an open question)

The plan is a read-eval-print loop in which a human utterance is a first-class turn, not a side channel. This is the part of the toolchain where a real architectural question is still open, and the roadmap's job is to name it rather than to pretend it is settled.

The settled part is the principle. A human utterance must enter the runtime the same way an actor's turn does: by acquiring the conductor's baton, being ingested through the privileged user-input path, and settling through the one commit boundary. The runtime is already built for exactly this. Its conductor sits idle waiting for a `USER_INPUT` event, ingests the text into the read-only `&user` namespace through the privileged path, dispatches a turn, and commits at the boundary (`runtime/src/xstate/conductor.machine.ts:73-108`, `runtime/src/effect/turn.ts:206-222`). A `say:` whose target is `@user` is the runtime yielding the baton back. So the REPL does not need a new way for humans to participate; the human is already a first-class actor in the loop, as architecture.md describes. The REPL is the surface that lets a person occupy that seat live.

The open question is interjection. A REPL user will sometimes want to interrupt — to say something while an actor is mid-turn, or between turns, out of the normal request-response rhythm. The runtime's discipline is that turns are not preempted mid-flight and signals are observed only at turn boundaries, which is what keeps execution deterministic and parallel-safe. So an interjection cannot reach in and interrupt a turn. The design direction is an out-of-band input channel that is serialized into proper turns at the boundary — the interjection is captured when the user types it but only enters the loop as a real turn at the next boundary, never bypassing the commit. How exactly that out-of-band channel is modeled, and how it presents to the user when their input is captured but not yet acted on, is the open question this part of the roadmap carries. It is documented as open because naming it is part of the work; it is not yet decided.

## The language server (planned)

The plan is a language server implementing the Language Server Protocol, and its place in the roadmap is simple: it is another consumer of the shared language core. It does not parse INDRA its own way. It reads the same spanned, lossless tree the parser produces, which is why that tree's spans are a requirement from day one and not an afterthought. The language server turns a parse error into an underlined range, a name into a go-to-definition, an import into a resolvable link — all of which are projections of the same parsed-and-resolved program the runner executes. Building the parser as a shared core rather than a runner-private detail is what makes the language server cheap to add later instead of a second parser to maintain.

## Binary distribution (planned, gated)

The plan is to distribute INDRA as a compiled binary, and it is deliberately the last step, gated on how the inference pipeline resolves. The gate is a real tension, not caution for its own sake.

The inference pipeline (described next) leans toward generating BAML at build time and compiling it into typed inference functions. Runtime code generation and a single shipped binary pull in opposite directions: if the inference functions are generated from a program's constructs, then either that generation happens ahead of time and is baked into a binary that cannot accept new programs without regenerating, or it happens at runtime and the thing shipped is not really a self-contained binary. Until the project chooses how the inference pipeline resolves — how much is generated ahead of time and how much at runtime — committing to a binary distribution would commit to one horn of that tension by accident. So binary distribution waits on that decision rather than racing ahead of it.

## The inference pipeline

This section is design intent. Some of it describes a build step that does not exist yet, and that is said plainly where it applies. But the intent is firm enough to state as the shape the pipeline is meant to take.

BAML is never written by hand. That is the governing principle. The `.baml` sources are an output, not an input. An INDRA author writes INDRA — the `<...>` direct-prompt channel and personas — and those constructs compile into generated BAML, which the BAML compiler then expands into typed inference functions the runtime calls. There are three stages in the intended pipeline: INDRA constructs, then generated BAML as an intermediate representation, then the typed functions BAML's own compiler produces from it.

The mapping from INDRA construct to BAML is already worked out in shape. A `<...>` inference point becomes one BAML `function` with a typed return. A persona — its identity, rules, and what it understands — becomes a reusable system-role template the function renders, never an actor and never something that drives a turn. The typed return is what replaces the legacy protocol's free-text result capture: instead of asking a model to answer and then parsing its prose, the function declares the shape of its answer and BAML's parser enforces it, retrying on a malformed result and failing the turn with a tagged `InferenceParseError` before any commit if retries are exhausted (`runtime/src/effect/errors.ts:43-52`). Output shapes map directly — a boolean gate to a `bool`, a rating to an `enum`, a structured answer to a `class`, a list to an array — and every inference class declares a free-form reasoning field first, so the model emits its chain of thought before committing to the typed value.

Today the `.baml` sources under `runtime/baml_src/` are hand-authored. This is a bootstrap, and the comments in those files say so directly: the explore function is "the one genuine inference of the skeleton" (`runtime/baml_src/explore.baml:1-9`), and the persona is a worked example of the persona-as-data rendering (`runtime/baml_src/personas.baml:1-3`). The hand-authored sources exist because the runtime needs real inference functions to run the walking skeleton before the compiler that would generate them exists. The design intent is that the compiler emits these files; the hand-authored versions are the target the generated output should match. You can read the bootstrap today and see exactly what the compiler is meant to produce: a `WelcomeResult` class with `reasoning` declared before `message`, a `WelcomeExplorer` function rendering an `ExplorerPersona` system block, and a single Anthropic client (`runtime/baml_src/explore.baml`, `runtime/baml_src/personas.baml`, `runtime/baml_src/clients.baml`).

The generated BAML client itself is already not checked in. It is produced from `baml_src/` into `baml_client/` by a generate step and treated as build output rather than source (`runtime/baml_src/generators.baml`). So one half of the pipeline — BAML compiler to typed client — is wired and running. The half that is planned is the front of it: the step that takes INDRA constructs and emits the `baml_src/` files that are hand-authored today.

This is also the tension that gates binary distribution. If `baml_src/` is generated from a program's constructs, then the inference functions a binary contains depend on which programs it was built for, and a self-contained binary that accepts arbitrary new programs would have to run the generator at runtime. That is the conflict the binary-distribution gate is waiting on.

## Two open questions the roadmap carries

Naming open questions is part of a roadmap's job, so two are recorded here rather than smoothed over.

The REPL's interjection model is open, as described above: the out-of-band input channel that serializes a human interruption into a proper turn at the boundary is a design direction, not a decided mechanism.

The `&dialogue` namespace is open. The runtime today includes `dialogue` as a writable namespace and lands user input into `&dialogue.latest_dialogue_entry` (`runtime/src/ast/types.ts:36`, `runtime/src/effect/turn.ts:206-222`), but no language source defines a `&dialogue` namespace — it entered as a skeleton-era artifact. Whether `&dialogue` becomes a real, specified namespace or is removed in favor of `&user` is a decision deferred to the parser seam, when the namespace surface is finalized. Until then it exists in the runtime but not in the language, and a reader should treat its presence as provisional.
