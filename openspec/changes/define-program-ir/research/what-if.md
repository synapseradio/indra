# What-if — adversarial edge cases for `define-program-ir`

An adversarial pass over the four delta specs (`specs/program-ir`, `specs/program-validation`,
`specs/inference-layer`, `specs/context-state`) and the inherited seam log. Each case names the
requirement it stresses, states the scenario, says what the spec currently implies or omits, and
what could go wrong. Cases are ranked by likelihood to bite, strongest first. A short long-tail
section keeps the rest. Web-drawn claims carry inline URLs; unsourced reasoning ends with `[?]`.

The lens throughout: the IR is a *contract between producers and one runtime*, persisted and
rehydrated, and "rejected at load with a typed error" is the promise. The sharp cases are where two
honest readings of the contract diverge, or where a document the spec calls valid produces a
surprising runtime, or where a document the spec calls equivalent is not.

---

## Ranked cases

### 1. `&args` is orphaned by the closed namespace set — a live path with no stated disposition

**Stresses:** context-state, "The namespace surface is closed" (`specs/context-state/spec.md:3`);
program-validation, "A Program is validated before the conductor spawns" check 5
(`specs/program-validation/spec.md:42`).

**What if** a Program addresses `&args.command` — the way the as-built `Namespace` union still
admits (`"args"` is a member at `runtime/src/ast/types.ts:36`, documented as "the current
signal/command arguments" at `:33`)?

**What the spec says:** The closed set is "exactly `&context`, `&user`, `&signals`, and `&result`"
and "a path addressing any other namespace SHALL fail validation" (`specs/context-state/spec.md:5`).
So `&args` fails validation. But the delta never *names* `&args`, never says it was considered, and
never says ingestion or signal-handling has a replacement landing place for command arguments. The
digest records this as a live loose end (familiarization §6); the seam log shows `&args` was a
real namespace in the legacy execution model (S13, `core/indra-protocol:961-982`).

**What goes wrong:** Two failure shapes. First, a *silent semantic gap*: `&dialogue` got an
explicit removal decision with a redirect (S15/IR8), but `&args` gets removed by omission — the
closed set rejects it without any author having decided what signal/command arguments now read from.
Signal-system is the spec that needs `&args` (S4 instruction payloads, S11 `*help` argument
routing), and it is "captured ahead of build" (archive design §status). A program that today
legitimately reads `&args` becomes unloadable with no migration note. Second, a *spec-internal
contradiction the reviewer can exploit*: is `&args` "removed like `&dialogue`" or "never was in
scope"? The delta supports neither reading explicitly, so the first producer to emit `&args` gets a
rejection the spec cannot explain by citing a decision. **This is rank 1 because it is reachable in
the current type system, it is the one namespace the closing decision forgot, and it converts a
"closed set" promise into an undocumented breaking removal.** Recommend: an explicit disposition
clause for `&args` mirroring the `&dialogue` treatment (remove-with-redirect, or admit it to the
closed set), decided before namespace finalization (migration step 6).

### 2. A guardless branch that is not last passes totality but reorders runtime semantics

**Stresses:** program-validation, "Branch totality is structural" (`specs/program-validation/spec.md:17`).

**What if** a `then:` block places a guardless branch in the *middle* of the list, with guarded
branches after it — e.g. `[when A → x, otherwise → y, when B → z]`?

**What the spec says:** Totality is "the block ends in a branch with no `when:`"
(`specs/program-validation/spec.md:19`). The `Branch` type comment asserts the `otherwise:` "must
come last" (`runtime/src/ast/types.ts:105-106`), but nothing in the *type* or the totality check
enforces position — the check as worded only asks whether the block *ends* in a guardless branch.

**What goes wrong:** The runtime's `selectBranch` does not honor order for guardless branches: it
loops, and on *any* `when === undefined` branch it sets `otherwise = branch` and `continue`s, only
returning the otherwise after the whole loop (`runtime/src/effect/turn.ts:137-145`). So in
`[when A, otherwise, when B]`, branch `B` is still evaluated, and if `B`'s guard matches it wins over
the earlier `otherwise`. The guardless branch in the middle does **not** short-circuit — it becomes a
*default that the later guarded branch overrides*, the opposite of first-match-wins intuition that
the `Branch` comment ("the first branch whose `when` passes runs") sets up. Two divergences fall out:
(a) a block like `[otherwise → y, when B → z]` decodes, and if totality only checks "ends in
guardless" it is *rejected* (ends in guarded `B`) even though it is total in the runtime's actual
semantics; (b) a block `[when A, otherwise, when B]` *passes* totality (does not end guardless — so
actually rejected too) — meaning the structural check and the runtime's branch selection disagree on
which programs are well-formed. The cheap, defensible fix the spec already gestures at (IR4) is to
require the guardless branch to be **last and unique**, and make `selectBranch` short-circuit on it,
so structural totality and runtime selection define the same set. As written, "ends in a guardless
branch" plus a selector that treats *any* guardless branch as the default leaves a seam. **Rank 2
because the divergence is in already-built code (`turn.ts:137-145`), not hypothetical, and totality
is the check the whole no-fall-through guarantee (S16) rests on.**

### 3. Capability-set narrowing between persist and resume is unguarded — only registry drift is checked

**Stresses:** program-validation, "Rehydration revalidates persisted documents"
(`specs/program-validation/spec.md:81`); program-ir, "The format defines constructs ahead of
execution" (`specs/program-ir/spec.md:61`).

**What if** a snapshot persisted under a runtime whose capability set included `until` is resumed on
a runtime build that no longer advertises `until` (a rollback, or a host that loads a leaner
capability profile)?

**What the spec says:** Rehydration "SHALL revalidate the persisted Program against the schema and
against the live registries" and rejects unrecognized *versions* and unresolvable *inference
references* (`specs/program-validation/spec.md:83`). The capability check is check 6's sibling at
*initial* load (`:62`), but the rehydration requirement enumerates only schema, version, and
registry — it does **not** name the capability set. Yet a Program's executable constructs are gated
by capability, not version (`specs/program-ir/spec.md:63`): the same version can be executed by two
runtimes with different capability sets.

**What goes wrong:** A snapshot whose version matches but whose *running runtime can no longer
execute a construct the in-flight Program uses* would pass rehydration revalidation as specified
(version recognized, registry resolves, schema conforms) and then drive the interpreter into a
construct it has no semantics for mid-resume — exactly the failure the load-time capability check
exists to prevent, but after restore. This is the persisted-snapshot analog of Temporal's core
hazard: a workflow is non-deterministic when "its execution does not match its previously recorded
history," and the canonical trigger is "a code change happened that took a different path"
(<https://medium.com/@sanhdoan/understanding-non-determinism-in-temporal-io-why-it-matters-how-to-avoid-it-3d397d8a5793>).
Temporal's answer is Worker Versioning — pin a workflow to a worker revision so old code runs old
paths (<https://docs.temporal.io/develop/go/versioning>) — which is precisely the capability-vs-version
distinction this spec already draws but does not carry into rehydration. **Rank 3 because the spec
explicitly separates capability from version (IR7) and then drops capability from the rehydration
checklist, so the gap is a one-line omission with a mid-resume crash behind it.** Recommend:
rehydration revalidates the capability set too, rejecting a resume whose Program uses a construct the
current capability set excludes, with the same typed error as the load-time check.

### 4. "Equivalent Program after a round trip" is undefined against IEEE-754 and key-order hazards

**Stresses:** program-ir, "Program documents are JSON-serializable" (`specs/program-ir/spec.md:18`),
scenario "A Program survives a JSON round trip" (`:27`).

**What if** a Program's `initialContext` (a `World` of arbitrary `Json`,
`runtime/src/ast/types.ts:14-21,28`) carries `-0`, an integer past 2^53, a very long decimal, or
relies on object key ordering — then is serialized with `JSON.stringify` and parsed back?

**What the spec says:** "A valid Program SHALL survive a JSON round trip unchanged" and "the parsed
value decodes to a Program **equivalent** to the original" (`specs/program-ir/spec.md:20,30`).
"Equivalent" and "unchanged" are undefined. The schema admits any JSON leaf (the `Json` union is
fully general).

**What goes wrong:** JSON round-tripping is not identity for several values the schema admits.
`JSON.stringify(-0)` yields `"0"`, so `-0` round-trips to `+0` — "unchanged" is already false for a
leaf the type allows. Numbers past 2^53 or with more precision than a double holds silently lose
precision; the project's own thesis ("deterministic assembly") makes a silent numeric drift in a
guard literal a determinism bug. RFC 8785, the canonicalization standard, has to *define* number
serialization via ECMAScript/IEEE-754 and *forbid* NaN and Infinity precisely because naive
round-tripping is not stable
(<https://www.rfc-editor.org/info/rfc8785/>). Two Programs that differ only in object key order
serialize to different byte strings but should presumably be "equivalent" — yet the spec's
round-trip scenario compares the *parsed value*, not bytes, leaving "equivalent" to mean structural
equality, which then contradicts the byte-identity a snapshot hash or a `===` on serialized form
would use. **Rank 4 because it does not crash — it silently violates the "unchanged" promise for
`-0` and large numbers, and a runtime that trusts round-trip stability for snapshot integrity inherits
a determinism hole.** Recommend: define "equivalent" as type-strict structural equality (the same
`is`-equality S6 already specifies, `archive .../design.md:124`), state that snapshot integrity does
*not* depend on byte-identical re-serialization, and either forbid `-0` / non-I-JSON numbers at the
schema boundary or document that they normalize.

### 5. `__proto__` and other reserved keys in a Program object reach the runtime via plain JSON decode

**Stresses:** program-ir, "Program documents are JSON-serializable" (`specs/program-ir/spec.md:18`);
context-state, "&result is a runtime-written, program-readable namespace"
(`specs/context-state/spec.md:18`) and the `World`/`&context` substrate
(`runtime/src/ast/types.ts:14-28`).

**What if** a Program's `initialContext` or a `set:` literal carries an object with the key
`"__proto__"`, `"constructor"`, or `"prototype"` — all valid JSON strings?

**What the spec says:** "Every value SHALL be plain JSON data: strings, numbers, booleans, null,
arrays, and **string-keyed objects**" (`specs/program-ir/spec.md:20`). `__proto__` is a legal
string key, so the schema accepts it. The spec says nothing about reserved keys.

**What goes wrong:** `JSON.parse` "treats any key … as an arbitrary string, including `__proto__`"
(<https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution>), and a parser or
a downstream deep-merge that writes parsed keys onto a host object can pollute `Object.prototype`
(the JSON5 CVE-2022-46175 is the canonical instance,
<https://github.com/json5/json5/security/advisories/GHSA-9c47-m6qq-7p4h>). Whether INDRA is reachable
depends on how the `&context` world is stored and read: if cells are looked up by `obj[segment]` on
a plain object, a `&context.__proto__.x` read or a `set:` with a `__proto__` segment could traverse
or pollute the prototype chain rather than data. The runtime stores the world as `Json`
(`runtime/src/ast/types.ts:14`) and reads via `getAt`/`get` (`initial-state.ts:110`,
`turn.ts:126-127`); whether those use a prototype-safe map (`Object.create(null)` / `Map`) is not
visible in the files read here, so I mark the *exploitability* uncertain [?]. The *spec gap* is not
uncertain: the JSON-serializable requirement defines the leaf grammar but says nothing about reserved
object keys, so a hostile or buggy producer's `__proto__` key is "valid IR." **Rank 5 because it is a
real, well-documented JSON hazard the spec's leaf grammar admits by silence; reachability hinges on
runtime storage details not yet pinned.** Recommend: the schema-conformance check (`program-validation`
check 1) reject object keys in `{__proto__, constructor, prototype}` anywhere in the document, or the
spec mandate a prototype-free store for the world.

### 6. The entry actor is not covered by actor-reference resolution

**Stresses:** program-validation, "Actor references must resolve" (`specs/program-validation/spec.md:32`).

**What if** a Program sets `entry: "Greeter"` but `actors` has no `"Greeter"` key
(`Program.entry` and `Program.actors` are independent fields, `runtime/src/ast/types.ts:135-139`)?

**What the spec says:** Actor-reference resolution covers "every `await:` target — and the target of
any construct that names an actor, such as `become:`" (`specs/program-validation/spec.md:34`). The
**entry** field is an actor reference too, and it is not named. The conductor spawns the entry actor
first; a dangling entry is the earliest possible dangling reference.

**What goes wrong:** A Program whose entry names a missing actor passes the actor-reference check as
worded (no `await:`/`become:` names it) and then fails at spawn time — the exact "no `null` spawn"
failure (`:40`) the check exists to prevent, but for the *first* actor rather than a delegated one.
The conductor's `spawning` state has a null-blueprint guard (`conductor.machine.ts:56-71` per digest),
so it may halt cleanly rather than crash, but it halts *after* validation said the Program was valid,
defeating the "rejected before anything spawns" promise. **Rank 6 because it is a clean,
certain spec omission — the entry is an actor reference the resolution check forgot — with a
bounded blast radius (one extra check).** Recommend: add `entry ∈ actors` to check 3.

---

## Long-tail (kept so nothing is lost)

- **Self-awaiting / cyclic await chains.** What if actor A's `await:` targets A, or A→B→A? Both
  resolve fine under "actor references must resolve" (`specs/program-validation/spec.md:32`) — the
  target exists. Nothing in the validation pass detects await *cycles*. The seam log reified `until:`
  loops as explicit frames (S9, archive `:127`) and import cycles halt with `ImportCycleError` (S8,
  `:126`), but await-recursion has no analog. Reachability is low until S17 await-resumption is built
  (this change is explicit non-goal on S17, `design.md:34`), so unbounded spawn is not yet
  possible — record as a scenario for the change that builds resumption, not a gap here.

- **Duplicate actor names.** The actor table is a JSON object keyed by id (`runtime/src/ast/types.ts:138`),
  so two actors with the same id cannot coexist post-decode — `JSON.parse` keeps the last duplicate
  key, silently. If a *producer* (front-end) emits two `@Greeter` definitions, the IR layer never
  sees the collision; it is the producer's parser that must reject it. Worth a note that duplicate-id
  detection belongs to the parser seam, not load-time IR validation, so the spec should not be read
  as catching it.

- **Registry binding more names than referenced.** "Inference references resolve against the supplied
  registry" (`specs/inference-layer/spec.md:3`) checks the IR→registry direction only. A registry
  binding `{A, B, C}` for a Program referencing only `A` passes. That is correct and intended
  (hosts share one registry across Programs) — noting it so the spec gets credit: over-binding is not
  an error, only under-binding is. The reverse (a Program referencing a name the registry omits) is
  the load-time error at `:54`. Covered.

- **`&result` overwritten between awaits.** `&result` is "the destination for an awaited return that
  carries no `store_in:`" (`specs/context-state/spec.md:20`), runtime-written, single-celled. Two
  successive store-in-absent awaits both land in `&result`; the second clobbers the first before a
  guard can read it. The spec gives `&result` a landing place but not a lifetime — is it
  per-await, per-turn, or persistent? This is a real ambiguity, but its resolution lives in S17/S19
  resumption semantics (not built here, `design.md:116`), so it is a scenario to carry forward rather
  than an IR-layer gap. Flagging the lifetime question explicitly so it is not lost.

- **Lone surrogates in string leaves.** A Program string containing an unpaired UTF-16 surrogate
  (U+D800–U+DFFF) round-trips through `JSON.stringify` as an escaped `\ud800` under ES2019 well-formed
  stringify (<https://2ality.com/2019/01/well-formed-stringify.html>), but the *parsed* string still
  holds a lone surrogate, and downstream consumers (an API request body, a hash) can reject it — this
  has bitten real tooling (<https://github.com/anthropics/claude-code/issues/44230>). The round-trip
  "unchanged" scenario (`specs/program-ir/spec.md:27`) would pass (the string is preserved) yet a
  later boundary fails. Same root as case 4: "survives a round trip" is necessary but not sufficient
  for "is transmissible." Low rank because it needs a hostile/garbled producer.

- **Concurrent rehydration.** Two conductors rehydrating the same snapshot against the same live
  registries — "rehydration revalidates" (`specs/program-validation/spec.md:81`) is specified as a
  pure check over schema/version/registry, so it is idempotent and order-independent by construction.
  No shared mutable state is named in the requirement. I see no hazard at the *spec* level; if the
  registry itself is mutated concurrently with a resume, that is a host-side concern outside the IR
  contract. Recording that I looked and found it covered by the check's purity. [?] (purity is
  inferred from the requirement text, not proven against an implementation, which does not exist yet.)

- **Snapshot whose version matches but registry *shrank*.** This is the case the spec *does* cover
  well: "an inference reference that resolved at persist time but is unresolvable against the current
  registries SHALL reject the resume" (`specs/program-validation/spec.md:83`, scenario `:90`).
  Credit to the spec — registry drift is the one rehydration hazard handled head-on. The gap is the
  *capability* sibling (case 3), not the registry one.

- **Schema/type drift (IR1).** The TS type is "derived from the schema" so the schema is normative
  (`specs/program-ir/spec.md:5`), which closes drift by construction — *if* the derivation is real.
  The digest records that no runtime module imports `Schema` yet and IR1 marks the Effect Schema API
  surface `[?]` (`design.md:129`, familiarization §6). So the drift-closure is **designed, not
  exercised**: readiness rests on the unbuilt schema. Not an edge case in the document, but the
  load-bearing assumption behind cases 1, 4, and 5 (the schema is where leaf-grammar and
  reserved-key rejection would live) is itself unproven. Naming it so the "schema rejects X"
  recommendations are read as "the schema, once built, should reject X."

---

## What the spec already handles well (credit)

- Registry *under*-binding rejected at load, not call time (`specs/inference-layer/spec.md:5`,
  `specs/program-validation/spec.md:52`) — the partial-registry host surfaces immediately.
- Registry drift on resume rejected at rehydration, not mid-turn
  (`specs/program-validation/spec.md:90`) — the one rehydration hazard handled directly.
- Forward-declared constructs decode but reject at the capability check, not as parse failures
  (`specs/program-ir/spec.md:61`) — the format stays stable while execution lags.
- Unrecognized version rejected, never reinterpreted (`specs/program-ir/spec.md:46`) — matches
  protobuf's lesson inverted: where protobuf *preserves* unknown fields for forward compatibility,
  this IR *rejects* unknown versions, the correct stance while exactly one version exists (IR6).

---

## Sources

- XState v5 persisted-snapshot / stale-actor pitfalls: <https://github.com/statelyai/xstate/discussions/4226> ; <https://github.com/statelyai/xstate/issues/5178> ; <https://stately.ai/blog/2023-10-02-persisting-state>
- Temporal determinism and worker versioning: <https://medium.com/@sanhdoan/understanding-non-determinism-in-temporal-io-why-it-matters-how-to-avoid-it-3d397d8a5793> ; <https://docs.temporal.io/develop/go/versioning> ; <https://docs.temporal.io/workflow-definition>
- JSON canonicalization (RFC 8785, number/`-0`/NaN handling): <https://www.rfc-editor.org/info/rfc8785/> ; <https://datatracker.ietf.org/doc/rfc8785/>
- Prototype pollution via `__proto__` in parsed JSON: <https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution> ; <https://github.com/json5/json5/security/advisories/GHSA-9c47-m6qq-7p4h> (CVE-2022-46175)
- Lone surrogates through `JSON.stringify`: <https://2ality.com/2019/01/well-formed-stringify.html> ; <https://github.com/anthropics/claude-code/issues/44230>
