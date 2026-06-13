## Why

Today an LLM role-plays the INDRA interpreter: it is asked to be *both* the deterministic virtual machine (parsing, the turn loop, state staging and commit, import resolution, schema validation, signal dispatch) *and* the inference engine. Models are unreliable at the former. The protocol spec itself leans on the model's "working memory" and judgment in places that are supposed to be identical every run (see the design seam log).

Pulling the deterministic machinery out into real code lets the runtime own everything that must behave the same way every time, and frees the model to do only the one thing it is actually good at: the bounded inference inside the `<...>` direct-prompt channel. This is the project's own principles — *determinism serves inhabitation* and *weak models suffice* (`docs/principles.md` 1 and 7) — expressed as an architecture.

## What Changes

Introduce a real TypeScript runtime that executes INDRA `.in` programs, replacing the "LLM pretends to be the VM" model. Ownership splits cleanly across three libraries:

- **XState v5** owns the choreography: actors, the turn loop, the delegation call stack (`await`/`return`/`store_in`), `say:` control transfer, `when:`/`otherwise:` guards, and signal interception at turn boundaries. A single conductor actor holds the turn baton and the commit boundary.
- **Effect** owns the substrate: file IO for imports, the typed error taxonomy, dependency injection for MCP tools, and the shared `&context` world. State uses **Effect STM** so multiple actors can run in parallel against a shared transactional whiteboard.
- **BAML** owns inference: every `<...>` direct-prompt becomes one typed `function`; personas (`identity`/`rules`/`understands`) become reusable system-role `template_string`s; output shapes become `bool`/`enum`/`class`/`string[]` return types.

The concurrency model is **BEAM-shaped**: each actor is internally sequential (a turn is one message handled to completion), many actors run in parallel, and signals are delivered to a mailbox and observed at turn boundaries rather than as mid-turn preemption. The one thing pure BEAM lacks — shared mutable state — is supplied by the STM whiteboard.

The first delivered change is a **walking skeleton**: the thinnest end-to-end vertical that exercises all three layers on one real command, proving the seams connect before generalizing.

## Capabilities

### New Capabilities
- `interpreter-runtime`: the deterministic execution engine — conductor, turn loop, terminating actions, delegation call stack, control flow.
- `context-state`: the `&context`/`&user`/`&signals` namespaces, STM-backed, with the staged-vs-immediate `set:` semantic and atomic turn-boundary commit.
- `module-resolution`: static and dynamic import resolution and strict initial-context schema validation.
- `inference-layer`: the BAML-backed generative surface — `<...>` functions, persona templates, typed output shapes.
- `signal-system`: actor `emit:` and user `*command` handling, delivered to a mailbox and dispatched at turn boundaries.

### Modified Capabilities
<!-- None yet; the project has no captured specs. The protocol spec at core/indra-protocol is the source of truth this port must honor. -->

## Impact

- New TypeScript codebase (runtime), new dependencies: `effect`, `xstate`, BAML toolchain.
- The protocol spec `core/indra-protocol` becomes an executable specification rather than a prompt the model inhabits. Several spec ambiguities must be resolved into explicit decisions (see `design.md` seam log).
- The `.in` library under `lib/prism/` and `commands/` becomes the runtime's input language; its generative operators become BAML functions.
- No existing functionality is removed; the prompt-based interpreter remains usable until the runtime reaches parity.
