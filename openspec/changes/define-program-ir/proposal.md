## Why

The runtime consumes a hand-authored AST that its own header calls "the parser's eventual output" (`runtime/src/ast/types.ts:10-11`) — an internal detail with no contract. We have decided to target the runtime with multiple front-ends, starting with a TypeScript eDSL rather than a `.in` parser, which only works if the AST is promoted to a stable, versioned, validated intermediate representation: the public artifact every front-end compiles to and the only thing the runtime executes. Promoting it now also closes validation gaps the extraction change recorded but deferred — no-branch turns fall through to an implicit `return: null` (S16), a dangling `await:` target spawns `null` silently (`runtime/src/xstate/indra-actor.machine.ts:138-139`), and inference dispatch is a hand-coded string check (`runtime/src/effect/turn.ts:92`).

## What Changes

- Define the **IR document format**: a versioned, JSON-serializable `Program` document — actors, branches, guards, set statements, terminators, value expressions — with an explicit extension policy for constructs the language has but the runtime does not yet execute (`each`, `until`, `sequence`, operators, `become`, templates). The serializability invariant (no functions, no class instances) becomes a spec requirement rather than a code comment.
- Add **load-time validation**: a Program is validated before the conductor starts — schema conformance, branch totality (closing S16), actor-reference resolution (no dangling `await:` targets), namespace write-protection checked statically where possible, and every inference reference resolved against the registry. Rehydration revalidates persisted documents against the live registries before resuming.
- Define the **registry contract**: registries hold only the non-deterministic, host-bound leaves — inference functions now, MCP tools later — referenced by string name in the IR and bound to implementations at load time, replacing the hand-maintained dispatch in `turn.ts`. Everything deterministic stays out of registries: guards and expressions are IR data evaluated by the runtime's specified evaluator (S6), operator definitions are a table in the Program document like actors, and the D9 pure-function leaves (`count`, `has_content`, `get_first`) are runtime builtins versioned with the runtime, not host-swappable entries.
- Specify **versioning**: a version field on the root document, a compatibility policy for persisted documents (validate-and-reject or migrate, never silently reinterpret).
- Finalize the **namespace surface** the IR can address, resolving the decisions parked at the parser seam: `&dialogue` disposition (S15) and `&result` membership (S19).

## Capabilities

### New Capabilities

- `program-ir`: the IR document format — node forms, the serializability invariant, the registry-reference model (names in data, behavior in registries), the version field, and the extension policy for not-yet-executable constructs.
- `program-validation`: what makes a Program acceptable — load-time checks (schema, branch totality, actor refs, namespace rules, registry resolution), rehydration-time revalidation, and the error taxonomy for rejection.

### Modified Capabilities

- `inference-layer`: inference functions are resolved through a host-supplied registry keyed by function name; an unresolved reference is a load-time validation error, not a call-time `ToolInvocationError`.
- `context-state`: the namespace surface is finalized — disposition of `&dialogue` (S15) and addition of `&result` (S19) — so `ContextPath` in the IR is closed over a declared namespace set.

## Impact

- The AST types become the IR contract's reference implementation in `@indra/runtime-contracts` (the package `bootstrap-workspace-and-contracts` extracts from `runtime/src/ast/types.ts`), paired with a runtime schema (Effect Schema) for boundary validation.
- New validation module invoked by the conductor before `validating`/`spawning` (`runtime/src/xstate/conductor.machine.ts:47-71`) and at snapshot rehydration.
- `runtime/src/effect/turn.ts` inference dispatch moves from a hand-coded check to registry lookup; `runtime/src/baml/inference.layer.ts` becomes the first registry supplier.
- Unblocks the TypeScript eDSL as a separate, later change: the eDSL is a typed builder emitting this IR, and the deferred `.in` parser becomes a second producer of the same artifact.
- The interpreter-runtime spec's pending totality requirement (S16) is implemented by `program-validation` rather than re-specified; no `.in` library changes.

## Sequencing

This change is no longer the first extraction. It hard-depends on `bootstrap-workspace-and-contracts`, which stands up the workspace and extracts `@indra/runtime-contracts` and `@indra/runtime-core`. The decomposition pass that initiative called for is complete, and it found cleaner first cuts (the contract, the core/choreography split, the inference adapter), so this change now follows them rather than leading.

Against the workspace those changes create, this change homes as follows:

- The **IR document format and the serializability invariant** (`program-ir`) extend `@indra/runtime-contracts` — the package already holds the AST/IR types and the error taxonomy, so promoting them to a versioned, schema-validated contract is an in-package evolution, not a new extraction.
- The **Effect-Schema validator and the load-time checks** (`program-validation`) land in `@indra/runtime-core`, evolving the existing validation pass (`validation/initial-state.ts`) into the broader `validateProgram` the design describes.
- The **registry contract and inference dispatch** (IR5) compose with `extract-inference-adapter`: the inference port lives in `@indra/runtime-core` and the BAML adapter in `@indra/runtime-inference-baml`, so the first registry supplier is the adapter behind the port rather than a module inside the core.
