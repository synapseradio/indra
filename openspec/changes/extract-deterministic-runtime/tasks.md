## 1. Scaffold

- [x] 1.1 Init TypeScript project (runtime/) with `effect`, `xstate`, and the BAML toolchain; pin versions and record them (resolves the API-churn risk in design.md).
- [x] 1.2 Decide and document the thinning move: the skeleton **hand-authors the parsed program (AST) for one `.in` file** rather than building the EBNF parser. The parser is a later capability; the skeleton proves execution, not parsing.

## 2. Effect substrate (context-state)

- [x] 2.1 Define the `&context` world type and the `ContextStore` interface: `get`, `setImmediate` (sequence), `setStaged` (perform), `beginTurn`, `commitTurn`.
- [x] 2.2 Implement `ContextStore` over STM `TRef`s: committed world + per-turn staging overlay; `commitTurn` folds overlay into the world in one transaction. Reads resolve committed-only.
- [x] 2.3 Reject any `set:` targeting `&user`/`&signals` with a `ReadOnlyViolationError` before touching a cell.
- [x] 2.4 Define the `Data.TaggedError` union: at minimum `IncompleteInitialStateError` (fatal), `ReadOnlyViolationError`, `ToolInvocationError`.
- [x] 2.5 Strict initial-context validation: trace the AST's `&context` references, verify the root `dialogue … with:` initializes every path, HALT with `IncompleteInitialStateError` otherwise.

## 3. XState choreography (interpreter-runtime)

- [x] 3.1 Conductor actor: holds the turn baton, owns the commit boundary, dispatches `TURN` to the active actor, performs `commitTurn` between turns.
- [x] 3.2 The generic INDRA-actor interpreter (D10): one registered actor that takes an actor definition (AST) as serializable `input`, activates on `TURN`, runs its turn, terminates. Dispatch is `spawn('indraActor', { input: blueprint, systemId: name })`. Implement the three terminators: `say:` (idle + `PASS_CONTROL`), `await:` (spawn child + `onDone` + `assign` into `store_in`), `return:` (final-state `output`).
- [x] 3.3 Wire each effectful leaf (validation, store reads/writes, inference) as `fromPromise` calling `runtime.runPromise(effectProgram)`.

## 4. BAML inference layer (inference-layer)

- [x] 4.1 One real BAML `function` translated from a `<...>` in the chosen `.in` (typed return — pick a `class` or `enum` shape to exercise `{{ ctx.output_format }}`).
- [x] 4.2 One persona as a `template_string` emitting `{{ _.role("system") }}`, referenced by the function.
- [x] 4.3 Wrap the BAML client as an Effect service (`Layer`), so inference gets the same typed-error + DI treatment; failures become `ToolInvocationError`.

## 5. Wire the vertical

- [ ] 5.1 Choose the skeleton program: a minimal actor that awaits `@user`, runs the one inference, stages one `set:`, and `say:`s the result. (Derived from `commands/explore.in`'s entry actor, stripped of the `tree_of_thought` delegation.)
- [ ] 5.2 Run it end to end against a real model; observe one full turn cycle.

## 6. Prove the seams

- [x] 6.1 **D3 staging invisibility:** a test where a `perform`-set to `&context.x` is NOT visible to a `when:` guard in the same turn, but IS visible on the next turn.
- [x] 6.2 **D3 sequence immediacy:** a test where a `sequence`-set IS visible to a later step in the same sequence.
- [x] 6.3 **D2 parallel STM:** two actors committing to the same `&context` path in parallel serialize correctly (one retries), no lost update.
- [x] 6.4 **D4 typed return:** the BAML function's typed output lands in `store_in`/`&context` with no free-text parsing.

## 7. De-risking experiments

- [ ] 7.1 **D10 dynamic dispatch:** instantiate an actor mid-run by passing a blueprint as `input` to the registered interpreter actor; confirm input/output/stop and that a persisted snapshot rehydrates (logic by `src`, data by `input`).
- [ ] 7.2 **D2 STM under concurrency:** instrument commit-retry counts; confirm the staged-commit folds correctly when two actors contend on a path. Establishes the mechanism is correct ahead of the parallel runtime.
- [ ] 7.3 **D8/D9 inference fidelity:** port the two adversarial files (`query_analysis.in` multi-splice, `thinking_primitives.in` same-stream back-reference) two ways — bare-typed vs reasoning-field-first — across two model families; blind-rate synthesis quality and measure how much composition logic leaves the protocol.
