# Familiarization digest — `define-program-ir`

A map of the change artifacts, the runtime facts they cite, the inherited seam log, and the baseline specs the deltas modify. Every factual claim carries a `path:line` citation. Reviewers (why / what-if / what) read this in place of the files.

## 1. The change in one paragraph

`define-program-ir` promotes the runtime's hand-authored AST — whose own header calls it "the parser's eventual output" (`runtime/src/ast/types.ts:10-11`) — into a versioned, JSON-serializable `Program` document that is the single public artifact every front-end compiles to and the only thing the runtime executes (`proposal.md:7`, `design.md:21`). It adds a load-time validation pass that rejects a Program before the conductor spawns (schema conformance, branch totality, actor-reference resolution, initial-context completeness, namespace write-protection, inference-reference resolution), revalidates rehydrated snapshots against live registries, and replaces the hand-coded inference dispatch with a host-supplied registry keyed by function name (`proposal.md:8-9`, `design.md:22-24`). It also finalizes the namespace surface — adds `&result`, removes `&dialogue` (`proposal.md:11`, `design.md:112-120`). It defines node forms for not-yet-executable constructs (`each`, `until`, `sequence`, operators, `become`, templates) but gates their execution by an advertised capability set (`design.md:104-110`). Non-goal: it builds neither the eDSL nor the `.in` parser nor the `await:`/`say:` resumption semantics; it defines the artifact those will emit and the targets they will write (`design.md:30-35`).

## 2. Per artifact — what it decides or requires

### proposal.md

Five "What Changes" bullets (`proposal.md:7-11`): IR document format with extension policy; load-time validation closing S16, dangling-spawn, and registry-resolution gaps; the registry contract (non-deterministic leaves by name, deterministic constructs as data/builtins); versioning with validate-and-reject; namespace finalization (S15, S19). Capabilities (`proposal.md:15-22`): **New** — `program-ir` (document format) and `program-validation` (acceptance rules). **Modified** — `inference-layer` (registry resolution, unresolved = load-time error) and `context-state` (closed namespace surface).

### design.md — Decisions IR1–IR8

- **IR1** (`design.md:39-47`): IR is the AST promoted to a contract; `types.ts` is the normative TS reference paired with an Effect `Schema` that decodes unknown values at the boundary. Effect Schema chosen over zod/JSON-Schema/io-ts because `effect@3.21.3` already ships it (`design.md:45`, confirmed `runtime/package.json:18`). Drift resolved by deriving the TS type from the schema (schema normative).
- **IR2** (`design.md:49-53`): serializability is a contract requirement enforced at the schema boundary — a function, class instance, `Date`, `Map`, or `undefined` leaf fails to decode.
- **IR3** (`design.md:55-70`): one ordered load-time pass in the conductor's `validating` state, replacing `validateInitial` with a broader `validateProgram`. Six checks, each a stop condition, fail-on-first in fixed order: (1) schema conformance, (2) branch totality, (3) actor-reference resolution, (4) initial-context completeness (kept verbatim), (5) namespace write-protection where statically decidable, (6) inference-reference resolution. Lazy validation rejected.
- **IR4** (`design.md:72-78`): branch totality is structural — a block is total iff it ends in a guardless branch (`otherwise:`). General guard exhaustiveness is undecidable and out of scope; a guard-exhaustive block lacking `otherwise:` is false-rejected, accepted as cheap.
- **IR5** (`design.md:80-94`): registries hold only non-deterministic host-bound leaves (inference now, MCP tools later), referenced by string name. Deterministic things stay out: guards/expressions are IR data (S6), operator definitions are a Program table, and the D9 pure-function leaves (`count`, `has_content`, `get_first`) are runtime builtins. Replaces the `turn.ts` name check with a registry lookup. Flat-registry alternative rejected.
- **IR6** (`design.md:96-102`): root version field; validate-and-reject (or migrate, never silently reinterpret); rehydration revalidates against live registries, so a reference that resolved at persist time but dangles at resume rejects the resume. Migrator deferred until a real version transition with live snapshots arrives.
- **IR7** (`design.md:104-110`): the format defines not-yet-executable node forms; the loaded runtime advertises a capability set; validation rejects use of an unsupported construct, naming it. Omitting the constructs rejected (would make the format a moving target).
- **IR8** (`design.md:112-120`): finalize the namespace surface. **Add `&result`** (S19) and make `await` `storeIn` optional, since as-built `storeIn` is required (`runtime/src/ast/types.ts:93-97`) and `&result` is not in `Namespace` (`runtime/src/ast/types.ts:36`). **Remove `&dialogue`** (S15): the only writer is user-input ingestion (`runtime/src/effect/turn.ts:211-222`), redirected to `&user` or dropped. Closing `ContextPath` is the one breaking change.

**Risks/Trade-offs** (`design.md:124-129`): schema/type drift; totality false-reject; validate-and-reject breaks resume across a version bump; load-time registry resolution surfaces partial-registry hosts immediately; namespace finalization is breaking; Effect Schema is a first use in the runtime — its API surface "should be pinned against the installed version before building" and is marked `[?]` (`design.md:129`).

**Migration Plan** (`design.md:131-142`): six steps, additive until step 6. (1) schema + reference type; (2) broaden validation, rewire `validating`; (3) registry contract + inference dispatch; (4) versioning + rehydration; (5) extension policy; (6) namespace finalization (the one breaking step, sequenced last). Rollback: steps 1–5 revert cleanly; step 6 isolated.

**Open Questions** (verbatim, `design.md:146-149`):

- "`&dialogue` final disposition (IR8, S15). Recommendation is removal, but it edits the live user-input ingestion path (`runtime/src/effect/turn.ts:211-222`), so it needs explicit confirmation: remove entirely, or redirect the `latest_dialogue_entry` write to `&user` before dropping the namespace. Decide before step 6."
- "Schema-versus-type single source (IR1). Derive the TypeScript type from the schema (schema normative) or keep hand-written types as documentation guarded by a parity test. Direction is \"derive\"; the open part is how much of the `types.ts` JSDoc moves into schema annotations versus staying as prose on the derived type."
- "When a migrator becomes necessary (IR6). Validate-and-reject is correct while one version exists. The trigger for building a migrator — a version transition with live persisted snapshots that must survive an upgrade — is not yet on the roadmap; name it when persistence of long-lived sessions lands."
- "Operator-table shape (IR5, IR7). Operators are deterministic and live as a table in the `Program` document, but their executor is not built here. The table's concrete schema is deferred to the change that executes operators; until then the IR carries the construct under the IR7 extension policy and validation rejects its use."

### Delta spec: program-ir (all ADDED)

- "The Program document is the only executable artifact" (`specs/program-ir/spec.md:3`) — runtime executes only a schema-conforming `Program`; TS type derived from the schema; decode-before-read. Includes a scenario that the `store_in`-absent `await` decodes with the return destined for `&result`.
- "Program documents are JSON-serializable" (`specs/program-ir/spec.md:18`) — only plain JSON leaves; non-JSON fails decode; valid Program survives a JSON round trip.
- "Non-deterministic leaves are referenced by name; deterministic constructs are data" (`specs/program-ir/spec.md:32`) — names in IR, behavior in registry; guards/expressions/operator-table/pure-function builtins stay out. Scenarios: same document on stub vs live host; `count`/`has_content`/`get_first` not host-swappable.
- "The root document carries a version field" (`specs/program-ir/spec.md:46`) — missing version fails decode; unrecognized version rejected, never reinterpreted.
- "The format defines constructs ahead of execution" (`specs/program-ir/spec.md:61`) — forward-declared node forms decode; rejection happens at the capability check, not as a parse failure.

### Delta spec: program-validation (all ADDED)

- "A Program is validated before the conductor spawns" (`specs/program-validation/spec.md:3`) — the six-check ordered pass, fail-on-first, conductor halts without spawning.
- "Branch totality is structural" (`specs/program-validation/spec.md:17`) — block must end in a guardless branch; rejection names actor and block; makes the implicit `return: null` unreachable.
- "Actor references must resolve" (`specs/program-validation/spec.md:32`) — every `await:` (and future `become:`) target must be in the actor table; dangling rejected at load.
- "Statically decidable namespace write violations are rejected at load" (`specs/program-validation/spec.md:42`) — a literal `set:` to `&user`/`&signals`/`&result` rejected at load; commit-time check is the backstop.
- "Inference references resolve against the supplied registry" (`specs/program-validation/spec.md:52`) — unresolved reference is a load-time error naming the function, not a call-time error.
- "Use of unsupported constructs is rejected at load" (`specs/program-validation/spec.md:62`) — capability-set check rejects e.g. `until:` when unsupported, naming construct and actor.
- "Validation rejections carry typed errors" (`specs/program-validation/spec.md:72`) — every rejection is a tagged error identifying check and location, so the conductor's error edge can switch on the tag.
- "Rehydration revalidates persisted documents" (`specs/program-validation/spec.md:81`) — revalidate against schema and live registries before resume; unrecognized version rejected; registry drift rejects the resume rather than failing mid-turn.

### Delta spec: inference-layer (all ADDED — note: the delta file uses `## ADDED Requirements`, `specs/inference-layer/spec.md:1`)

- "Inference functions are resolved through a host-supplied registry" (`specs/inference-layer/spec.md:3`) — dispatch through a registry keyed by name, bound at load; IR carries the name, registry carries the behavior; unresolved = load-time error; registry holds only non-deterministic leaves, pure functions stay builtins. Scenarios: dispatch is a lookup not a name check; stub and live bindings interchangeable per host.

### Delta spec: context-state (ADDED + MODIFIED)

- ADDED "The namespace surface is closed" (`specs/context-state/spec.md:3`) — namespace set is exactly `&context`, `&user`, `&signals`, `&result`; `&dialogue` is not a member; ingestion writes land in `&user`.
- ADDED "&result is a runtime-written, program-readable namespace" (`specs/context-state/spec.md:18`) — `&result` is the landing place for a `store_in:`-absent awaited return.
- MODIFIED "Protected namespaces reject program writes" (`specs/context-state/spec.md:29`) — extends the protected set to include `&result`; literal violations rejected at load-time validation while commit-time check remains for non-statically-decidable writes. (Baseline version protects only `&user`/`&signals`; see §5.)

## 3. Runtime ground truth (verified against source)

- **AST node forms and serializability comment** (`runtime/src/ast/types.ts`): the comment "Every type here is plain, serializable data. No functions, no class instances" with the D10 `input` rationale is at `runtime/src/ast/types.ts:4-8`. `Json` leaf type at `:15-21`. `Namespace = "context" | "user" | "signals" | "dialogue" | "args"` at `:36` — confirms `&dialogue` present and `&result` absent. `InferenceRef` (`fn`, `input`, `select`) at `:50-54`. `ValueExpr`/`GuardExpr`/`SetStatement`/`Terminator`/`Branch`/`PerformBlock`/`ActorDef`/`Program` at `:57-139`. The `await` terminator with **required** `storeIn: ContextPath` at `:92-97`. The `Branch.when?` optional (the `otherwise:` model IR4 relies on) at `:105-109`.
- **No-branch fall-through** (`runtime/src/effect/turn.ts`): `selectBranch` returns `otherwise` (possibly `undefined`) at `:133-146`; `runTurnEffect` then does `if (branch === undefined) return { kind: "return", output: null }` at `:180-183`. Matches the S16/IR4 citation exactly.
- **Hand-coded inference dispatch** (`runtime/src/effect/turn.ts`): the comment "Skeleton dispatch is hand-maintained…" at `:90-91` and `if (value.ref.fn !== "WelcomeExplorer") … ToolInvocationError` at `:92-99`. Matches the `:92` citation.
- **User-input ingestion writing `&dialogue`** (`runtime/src/effect/turn.ts:211-222`): `ingestUserInputEffect` writes `&user.latest` and `&dialogue.latest_dialogue_entry` via `setPrivileged`. Matches the S15/IR8 citation.
- **Initial-state walker** (`runtime/src/effect/initial-state.ts`): `collectFromActor` walks branches/guards/sets/terminators at `:70-79`; `findUninitializedContextPaths` at `:96-115`; `validateInitialState` (the leaf IR3 broadens) at `:121-130`. Matches the `:82-115` and `:96-115` citations.
- **Conductor validating state** (`runtime/src/xstate/conductor.machine.ts`): `validating` invokes `validateInitial`, `onDone: spawning`, `onError: halted` at `:47-54`; the `spawning` state with the null-blueprint guard at `:56-71`. Matches the `:47-71` and `:47-54` citations.
- **Dangling-spawn path** (`runtime/src/xstate/indra-actor.machine.ts`): in `awaiting` entry, `const target = context.pending?.actor ?? ""; const blueprint = context.actors[target]; if (blueprint === undefined) return null;` at `:136-143` (the lines `:138-139` cited fall inside this block — the `?? ""` and `actors[target]` lookup). The awaiting actor finalizes after `storing` rather than resuming (`returned` final state at `:185-191`).
- **Stub/live binding** (`runtime/src/baml/inference.layer.ts`): `InferenceLive` binds `welcomeExplorer` to `b.WelcomeExplorer` at `:22-31`; the header notes "Offline-core tests never construct this layer — they use InferenceStub" at `:19-20`. Matches the `:19-20` citation (the comment, not a live `InferenceStub` symbol in this file).
- **`effect` version** (`runtime/package.json:18`): `"effect": "3.21.3"`. Matches IR1's `effect@3.21.3` claim. Also `xstate: 5.32.0` (`:19`), `@boundaryml/baml: 0.222.0` (`:17`).

## 4. The seam log (archive design, `openspec/changes/archive/2026-06-12-extract-deterministic-runtime/design.md`)

Header at `:113-117`: the source set is expected to disagree with itself; governing stance is "repair semantics freely, preserve syntax, drop dead parts with a note." S1–S11 resolved; S12+ carry status inline (`:117`).

- **S1** (`:119`) Result capture: typed BAML return (D4), discard `next_state_assertion`. Drives inference-layer.
- **S2** (`:120`) Two non-isomorphic turn definitions: one canonical conductor-owned cycle. Drives interpreter-runtime.
- **S3** (`:121`) Sequence-vs-staged precedence: staged perform-set wins at commit. Drives context-state.
- **S4** (`:122`) `instruction`-as-data: must parse as a restricted `executable_unit` subset. Drives signal-system.
- **S5** (`:123`) `use_clause` scoping: inline the full file, expose only listed symbols. Drives module-resolution.
- **S6** (`:124`) **[this change touches]** Expression evaluator: specify a total, side-effect-free evaluator (`is` = type-strict deep equality, `exists()`, etc.). Drives interpreter-runtime. — IR5 leans on this: guards/expressions are IR data evaluated by "the runtime's specified evaluator (S6)" (`design.md:88`).
- **S7** (`:125`) `become:` vs personas: persona supplies constraints as data, become-site `perform:` supplies turn logic; one registered interpreter (D10). Drives interpreter-runtime, inference-layer.
- **S8** (`:126`) Import dedup/cycle: visited-set keyed by absolute path; cycle halts with `ImportCycleError`. Drives module-resolution.
- **S9** (`:127`) Loop continuation: reify the `until:` loop as an explicit frame at `&context._loop.…`. Drives interpreter-runtime.
- **S10** (`:128`) Trace gating: separate visibility from control; `grammar_violation` always halts. Drives interpreter-runtime, signal-system.
- **S11** (`:129`) `*help` predicate: replace LLM judgment with a declared help handler convention. Drives signal-system.
- **S12** (`:130`) Self-test violates its own grammar: `output_block` not required in `perform:`. Resolved.
- **S13** (`:131`) `&signals` missing from execution-model namespace list: drift, not intent; `&signals` is protected/runtime-written. Resolved.
- **S14** (`:132`) SOP_05 is structurally broken YAML: content stands as intent, captured in signal-system. Resolved.
- **S15** (`:133`) **[this change claims to resolve]** `&dialogue` is a skeleton artifact, not protocol: kept out of all specs; "Whether it becomes a real namespace or is removed is an open question deferred to the parser seam, when the namespace surface is finalized." — IR8 is that finalization (removal recommended).
- **S16** (`:134`) **[this change claims to resolve]** No-branch turns excluded statically: as-built implicit `return: null` (`runtime/src/effect/turn.ts:180-183`) is a recorded gap; "Program validation requires every `then:` block to be total … the as-built implicit return is a recorded gap until load-time totality validation lands." — IR3/IR4 implement it.
- **S17** (`:135`) **[this change touches]** `await:` resumption and `say:` routing spec'd but unbuilt: awaiting actor finalizes instead of resuming (`runtime/src/xstate/indra-actor.machine.ts:162-191`); conductor ignores `say`'s `to:`. Skeleton gaps. — This change is explicit non-goal on building S17 (`design.md:34`) but makes the targets expressible.
- **S18** (`:136`) **[this change touches]** Tool-failure fatality: non-fatal null-and-continue governs tool-leaf failures (lands with MCP capability); the fatal `ToolInvocationError` ("no inference function registered", `runtime/src/effect/turn.ts:92-99`) stays a programming-error guard. — IR5 replaces that fatal path with registry resolution; the registry contract is "shaped so tools slot in beside inference later; no tool registry ships here (cf. S18)" (`design.md:33`).
- **S19** (`:137`) **[this change claims to resolve]** `&result` default when `await:` carries no `store_in:`: as-built `storeIn` required (`runtime/src/ast/types.ts:93-97`), `&result` not in `Namespace` (`:36`); "implement it with S17." — IR8 adds `&result` and makes `storeIn` optional, but notes the interpreter behavior that fills it (S17) is not built here (`design.md:116`).

**D9** (`:98-101`): inference and composition are separate layers; pure-function `<...>` (`count`, `has_content`, `get_first`) become host functions, never BAML calls — "asking an LLM to count a list" would encode a bug as a contract. IR5 leans on this for the builtins-not-registry line (`design.md:90`).

**D10** (`:103-108`): INDRA actors are interpreted by one generic registered actor parameterized by serializable AST `input`; the serializability constraint exists because inline runtime-built logic cannot auto-rehydrate. IR1/IR2 lean on this — the `ActorDef`-as-`input` rationale is why serializability is load-bearing (`design.md:51`, `runtime/src/ast/types.ts:5-8`).

## 5. Baseline deltas (existing main specs vs the modified deltas)

- **context-state baseline** (`openspec/specs/context-state/spec.md`): purpose names only "`&context`, `&user`, and `&signals` namespaces" (`:4-5`) — no `&result`, no closed namespace set. "Protected namespaces reject program writes" protects "`&user` or `&signals`" only, rejected "before any state cell is modified," with no load-time/commit-time split (`:43-50`). The change's MODIFIED version adds `&result` to the protected set and introduces the load-time-vs-commit-time split (`specs/context-state/spec.md:29-31`). The baseline also already has "Initial context must be fully initialized" (`:62-69`), the check IR3 keeps verbatim as step 4.
- **inference-layer baseline** (`openspec/specs/inference-layer/spec.md`): five requirements — typed return (`:9`), declared output shapes (`:24`), personas-as-data (`:33`), reasoning-first (`:43`), pure-functions-are-host-functions-and-composition-stays-in-language (`:52`). No registry concept exists in the baseline; dispatch is not specified as a registry lookup. The change's ADDED "Inference functions are resolved through a host-supplied registry" is net-new on top of these.
- **interpreter-runtime on totality and `&result`** (`openspec/specs/interpreter-runtime/spec.md`): "Turns settle only through a terminator or a suspension" requires every `then:` block to be total — "carries an `otherwise:` branch or its `when:` guards are exhaustive" — rejected at load "with an error naming the actor and block" (`:24-31`). This is the requirement the proposal says `program-validation` *implements* rather than re-specifies (`proposal.md:29`). "Delegation is a call stack with resumption" requires a `store_in:`-absent awaited return to land "in `&result` when `store_in:` is absent," readable by the resumed actor (`:40`, scenario `:48-51`). This is the target IR8 makes expressible (adding `&result`, making `storeIn` optional) without building the resumption (S17/S19).

## 6. Loose ends

- **Citation precision on the dangling-spawn line.** The artifacts cite `runtime/src/xstate/indra-actor.machine.ts:138-139` for the dangling `await:` spawning `null` (`proposal.md:3`, `design.md:10`). In source the relevant block spans `:136-143`: `const target = context.pending?.actor ?? "";` (`:137`), `const blueprint = context.actors[target];` (`:138`), `if (blueprint === undefined) return null;` (`:139`). Lines 138-139 are the lookup and the `return null`; the cited range is accurate but narrow (the `?? ""` fallback that makes the target empty is at `:137`).
- **`ContextPath` segment naming.** `findUninitializedContextPaths` filters to `path.ns === "context"` (`runtime/src/effect/initial-state.ts:110`); the walker also collects non-`context` paths (e.g. `await` `storeIn`, `:62`) but the initialization check ignores them. The new namespace write-protection check (IR3 step 5) would inspect `set:` targets across namespaces, a wider traversal concern than the existing filter.
- **`args` namespace.** The as-built `Namespace` union includes `"args"` (`runtime/src/ast/types.ts:36`), described as "the current signal/command arguments" (`:33`). The context-state closed-surface delta lists the namespace set as exactly `&context`, `&user`, `&signals`, `&result` (`specs/context-state/spec.md:5`) and does not mention `&args`; the change artifacts do not state its disposition. Recorded, not resolved.
- **Effect Schema as first use.** `design.md:129` marks with `[?]` that no runtime module imports `Schema` today and the API surface should be pinned before building. No `Schema` import appears in any file read here.
