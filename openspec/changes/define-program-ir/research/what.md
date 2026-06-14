# What — definitional-clarity review of `define-program-ir`

Lens: *what, exactly, does each term mean?* A finding is anything two careful readers — an implementer and a test author working only from these specs — could implement differently and both believe they conformed. Findings are ranked by how far the two implementations would diverge. Each names the spec file and requirement heading, quotes the ambiguous phrase, gives the readings, and proposes the question the authors must answer (or candidate wording).

The specs reviewed are the four deltas (`specs/{program-ir,program-validation,inference-layer,context-state}/spec.md`), checked against the two baselines (`openspec/specs/{context-state,inference-layer}/spec.md`), the design decisions IR1–IR8 (`design.md:39-143`), the seam log (`openspec/changes/archive/2026-06-12-extract-deterministic-runtime/design.md:113-137`), and the as-built source.

---

## Major — readers diverge on the artifact itself

### M1. `&args` is in the as-built namespace union but absent from the closed surface — an undefined member

- **Spec / requirement:** `specs/context-state/spec.md` — "The namespace surface is closed".
- **Phrase:** "The context-path namespace set SHALL be exactly `&context`, `&user`, `&signals`, and `&result`. A path addressing any other namespace SHALL fail validation."
- **The hole.** The as-built `Namespace` union is `"context" | "user" | "signals" | "dialogue" | "args"` (`runtime/src/ast/types.ts:36`). The change explicitly disposes of two of these five — adds `&result`, removes `&dialogue` (IR8, `design.md:112-120`) — but says nothing about `&args`, which is described in source as "the current signal/command arguments" (`runtime/src/ast/types.ts:30-36`). "SHALL be exactly" four namespaces, with "any other namespace SHALL fail validation," makes the literal reading: a path addressing `&args` fails validation. Yet the union carries it, and no requirement, scenario, design decision, open question, or seam entry records its removal.
- **Readings a careful reader could take.**
  1. *Removed by omission.* `&args` is gone; any `&args.…` path fails the closed-surface check. An implementer writes the namespace enum as a four-member union and a test author writes a "`&args` rejected" scenario — and both have invented a breaking change the design never sanctioned.
  2. *Out of scope, retained.* `&args` survives as a runtime-internal namespace not addressable by program `ContextPath` data, so the "closed surface" governs only program-authored paths and `&args` is simply outside that surface's jurisdiction. An implementer keeps it in the union; the test author writes no rejection test.
  3. *Deferred.* Its disposition is parked like `&dialogue` once was, pending the signal/command-args seam — but unlike `&dialogue` (S15) there is no entry saying so.
- **Why this is the lead finding.** The two readings produce *opposite* enum definitions and opposite test suites, and one of them silently ships a second breaking change to `ContextPath` beyond the one IR8 declares ("Closing `ContextPath` is the one breaking change," `design.md` / familiarization §2). The whole value of the IR is that `ContextPath` is closed over *exactly* the namespaces the runtime addresses (`design.md:120`); an undefined fifth member defeats that claim at the seam it is meant to seal.
- **Question for the authors.** Is `&args` (a) removed from the namespace surface, (b) retained as a runtime-internal namespace outside the program-addressable closed set, or (c) deferred to a named later seam? If retained, the requirement's "exactly `&context`, `&user`, `&signals`, and `&result`" must either list it or state in prose that the closed set governs only program-authored paths and names the runtime-internal namespaces it excludes. *Recorded as a hole in the familiarization loose ends (§6); I agree it is one and lead with it.*

### M2. "The root document carries a version field" never says what a version *is*, so "recognize" is undefined

- **Spec / requirement:** `specs/program-ir/spec.md` — "The root document carries a version field"; and `specs/program-validation/spec.md` — "Rehydration revalidates persisted documents".
- **Phrases:** "carry a version field on its root"; "a version the runtime does not recognize SHALL be rejected"; "naming the version."
- **The hole.** Neither the format of the version value nor the predicate "recognize" is defined. Nothing says whether the field is a semantic version string (`"1.0.0"`), a bare integer (`1`), a date, or an opaque tag; nothing says whether "recognize" means string-equality against a single supported constant, membership in a supported set, or a semver range/compatibility comparison.
- **Readings.**
  1. *Integer, exact-match.* The runtime supports one integer and rejects anything `!==` it. Simplest; matches "one version exists" (IR6, `design.md:96-102`).
  2. *Semver, range-compatible.* The field is a semver string and "recognize" means "satisfies the runtime's supported range," so a `1.0.1` document loads on a `1.0.0` runtime. The word "migrate" and the phrase "validate-and-reject or migrate" (`specs/program-ir/spec.md:48`) hint at a richer policy that a range comparison would serve.
  3. *Opaque tag, set-membership.* Any string; recognized iff in a known set.
- **Divergence.** The schema field type differs (`Schema.Number` vs `Schema.String` vs a branded literal union), the decode-failure scenario differs ("missing version fails decode" tests a different absent value), and the "unrecognized version" comparison logic differs entirely. A test author cannot write "an unrecognized version is rejected" without knowing what makes a version recognized.
- **Question.** Specify the version field's type and the exact "recognize" predicate. Candidate: "The version field SHALL be a non-negative integer. The runtime recognizes exactly the integer(s) in its declared supported-version set; any other value is rejected." (If semver with ranges is intended, say so — it changes the schema and every version scenario.)

### M3. "Equivalent Program" after a JSON round trip is asserted but not defined

- **Spec / requirement:** `specs/program-ir/spec.md` — "Program documents are JSON-serializable".
- **Phrase:** "A valid Program SHALL survive a JSON round trip unchanged" and the scenario "the parsed value decodes to a Program **equivalent** to the original."
- **The hole.** "Unchanged" and "equivalent" are not the same predicate, and neither is defined. `JSON.stringify`/`parse` is not identity-preserving for several values the schema may admit or transform: key ordering is not guaranteed equal, `Schema` decode may apply transformations (defaults, branding, coercion) so the decoded value is deliberately *not* byte-equal to the input, and `-0`/`NaN`/`Infinity`/`undefined` members have lossy or rejecting round trips.
- **Readings.**
  1. *Structural deep-equality after decode* — the decoded-then-re-decoded values compare deep-equal (the project already has a definition of this for guards: "type-strict structural deep-equality," S6, archive `design.md:124`). This is the likely intent.
  2. *Byte-identity of the serialized form* — `stringify(p) === stringify(parse(stringify(p)))`. Stricter; fails the moment the schema applies any transform or key order shifts.
  3. *Encoded-form equality* — equality at the schema's *Encoded* type, distinct from the *Type* if any transformation exists.
- **Divergence.** The round-trip test asserts a different equality each way; reading 2 fails for any schema that decodes to branded or defaulted values, which the IR1 "derive the type from the schema" direction (`design.md:47`) makes plausible.
- **Question.** Define "equivalent." Candidate: "equivalent" means deep-structural equality of the decoded `Program` values (the S6 equality), not byte-identity of the serialized text, so schema-applied defaults and key reordering do not break the round trip.

### M4. The registry interface shape is never specified — sync vs Effect, and the key/lookup contract

- **Spec / requirement:** `specs/inference-layer/spec.md` — "Inference functions are resolved through a host-supplied registry"; `specs/program-validation/spec.md` — "Inference references resolve against the supplied registry."
- **Phrases:** "a registry keyed by function name, supplied by the host and bound at load time"; "resolve to a key in the host-supplied registry."
- **The hole.** The registry is described only by what it *holds* and *keys on*, never by its *interface*. Open questions a reader must answer to implement either the supplier or the resolver: is a binding a synchronous function, an `Effect`, or a BAML-style typed call? Is the registry a plain record `{ [name]: Binding }`, a `Map`, an Effect `Context`/`Layer` service (the existing inference layer is a `Layer`, `runtime/src/baml/inference.layer.ts`), or an interface with a `resolve(name)` method? Does "resolve to a key" mean key-set membership only (validation needs no value) or fetching the binding (dispatch needs the value)? What does a binding return — the typed BAML result, or a wrapped value?
- **Readings.** A test author writing "an unbound inference function is rejected at load" (`specs/program-validation/spec.md:56-60`) must construct a registry to test against. With a plain-record reading they write `{}`; with a `Layer` reading they must build an Effect service; with a `resolve(): Option` reading they stub a method. These are mutually incompatible test fixtures.
- **Why major.** The design says "Introduce the registry abstraction" (`design.md:137`) but the *abstraction's signature* is exactly what the implementer must invent, and the spec gives no shape to conform to. Two implementers will produce incompatible registry types, and a Program that loads against one host's registry will not type-check against the other's.
- **Question.** Specify the registry's interface: (a) the binding type (sync function / `Effect` / typed inference call), (b) the container (record / `Map` / Effect service), and (c) whether validation-time resolution is key-membership or value-fetch. Candidate minimum: "A registry is a value supporting `has(name): boolean` for load-time resolution and `get(name): Binding` for dispatch, where a `Binding` is an `Effect`-returning inference call; validation uses `has` only."

---

## Moderate — readers diverge on a check's scope or trigger

### M5. "Statically decidable" / "literal IR data" has no boundary

- **Spec / requirement:** `specs/program-validation/spec.md` — "Statically decidable namespace write violations are rejected at load"; mirrored in `specs/context-state/spec.md` MODIFIED "Protected namespaces reject program writes."
- **Phrases:** "A `set:` whose **literal target path** addresses a runtime-owned namespace"; "**statically decidable**"; "any write that is **not statically decidable**."
- **The hole.** The `SetStatement.target` is a `ContextPath` with `ns` and `segments` (`runtime/src/ast/types.ts:78-82`). The `ns` is *always* a literal enum member in the current AST — there is no computed-namespace form — so under the as-built type *every* `set:` namespace is statically decidable, and the "commit-time backstop" clause has no inhabitants. The clause only earns its keep if some future construct makes the target namespace dynamic (a computed path, an interpolated segment). The spec neither names that construct nor says the split is forward-looking.
- **Readings.** (1) *Vacuously total today* — every `set:` is statically checked, the backstop is dead code kept for a future dynamic-path construct. (2) *Segments count* — "statically decidable" includes reasoning about `segments`, not just `ns`, so a `set:` to `&context.<computed>` is the non-decidable case. (3) *Some paths are already dynamic* — the reader assumes a dynamic-path form exists and writes a backstop test with no way to construct an input for it.
- **Divergence.** A test author cannot write the "not statically decidable" scenario because no AST form produces one; they either skip it (reading 1) or fabricate an input the schema rejects (readings 2–3).
- **Question.** State whether, under the current IR, *every* namespace write is statically decidable (making the load-time check total and the commit-time check a forward-compatibility backstop for a named future construct), or name the construct that produces a non-statically-decidable target.

### M6. "Capability set" is named as a contract but given no concrete form, naming convention, or construct vocabulary

- **Spec / requirement:** `specs/program-ir/spec.md` — "The format defines constructs ahead of execution"; `specs/program-validation/spec.md` — "Use of unsupported constructs is rejected at load."
- **Phrases:** "the runtime's advertised capability set"; "the constructs it executes"; "a construct the format defines but the capability set excludes"; "naming the construct."
- **The hole.** What *is* a capability set concretely — a `Set<string>` of construct names, a record of booleans, a typed enum? And how is a "construct" named so a validator can match a node against the set? The seeds are `each`, `until`, `sequence`, operators, `become`, prose templates (`specs/program-ir/spec.md:63`) — but those are surface-language words. The AST has `Terminator.kind` values (`say`/`await`/`return`), `GuardExpr.kind`, `ValueExpr.kind`. The mapping from "construct" to a checkable node predicate is unstated. Does `until` correspond to a node `kind: "until"` not yet in the union? Is `sequence` (already a `SetLevel`, `runtime/src/ast/types.ts:76`) a construct or not?
- **Readings.** An implementer might key the capability set on terminator/expression `kind` strings, on a new top-level "construct" discriminant, or on surface keywords mapped by a table they must invent. The error "naming the construct" then prints different identifiers depending on the choice.
- **Question.** Specify the capability set's representation (e.g. `ReadonlySet<ConstructName>`) and the closed vocabulary of `ConstructName` values, and state how a validator maps an IR node to its construct name. Note the live tension: `sequence` is already a `SetLevel` in the executing AST, so it cannot be both "executed today" and "a not-yet-executable construct."

### M7. "Recognize" appears in two requirements with possibly two meanings

- **Spec / requirement:** `specs/program-ir/spec.md` "version field" and `specs/program-validation/spec.md` "Rehydration revalidates."
- **Phrase:** "a version the runtime does not recognize" (load) vs "a Program version the running runtime does not recognize" (rehydration).
- **The hole.** Same word, two call sites. A reader could assume one shared predicate or two (e.g. load-time recognizes the current version only; rehydration recognizes a wider compatibility window pending a migrator). IR6 says rehydration "re-runs IR3's resolution checks" (`design.md:100`) but is silent on whether the *version* predicate widens.
- **Question.** Confirm "recognize" is one predicate used in both places, or specify the difference. Subsumed by M2 if M2 defines "recognize" once for both.

### M8. `&result` overwrite/lifetime semantics — global or per-actor, and when clobbered — are undefined

- **Spec / requirement:** `specs/context-state/spec.md` — "&result is a runtime-written, program-readable namespace."
- **Phrase:** "the destination for an awaited return that carries no `store_in:` target."
- **The hole.** `&result` is a single namespace. With nested or sequential `await:` delegations each defaulting to `&result`, the spec never says whether `&result` is one global cell overwritten by the most recent storeless await, or scoped per resumed actor, or whether a read must occur before the next await overwrites it. The seed question — "whether `&result` is global or per-actor and when overwritten" — has no answer in any artifact; IR8 explicitly defers the *interpreter behavior that fills it* to S17 (`design.md:116`), but the *namespace's scoping contract* is a definitional property of `&result` itself, separable from the resume mechanics.
- **Readings.** (1) *Global, last-write-wins* — one cell; a second storeless await clobbers the first before the resumed actor reads it. (2) *Per-actor frame* — `&result` resolves relative to the awaiting actor's resume context, so concurrent delegations do not collide. These produce observably different programs once two awaits coexist.
- **Caveat.** This is partly out of scope: the change "makes the target expressible" without building resumption (S17/S19). But "program-readable" is a property of *this* change's namespace surface, so a guard reading `&result` (the scenario at `specs/context-state/spec.md:23-25`) needs a defined value-lifetime even before resumption is built.
- **Question.** State `&result`'s scoping: a single global runtime-written cell (and accept last-write-wins across delegations), or a per-resume-frame value. If the answer is "deferred with S17," say so explicitly in the requirement so a test author does not assert a lifetime.

---

## Minor — cosmetic or resolved-once-traced

### m1. "Recognize" / SHALL-MUST consistency. The specs use SHALL throughout (OpenSpec convention); no stray MUST appears in the four deltas. *Checked — consistent. Counted resolved.*

### m2. Error-taxonomy tags are unspecified but consistent with intent. "Validation rejections carry typed errors" (`specs/program-validation/spec.md:72`) requires "a tagged error identifying the failed check," and rehydration/inference scenarios name functions and paths, but the spec does not enumerate the tags. The as-built taxonomy (`runtime/src/effect/errors.ts`) has four `Data.TaggedError` classes — `IncompleteInitialStateError`, `ReadOnlyViolationError`, `ToolInvocationError`, `InferenceParseError` — covering checks 4 and 5 and the old fatal dispatch path. The new checks (schema conformance, totality, actor-reference resolution, capability, version) have *no* corresponding tag today, and `ParseError` (from Effect) covers schema decode. The design says "define the rejection error taxonomy" (`design.md:136`) as implementation work, so this is a known gap rather than an ambiguity — but a test author asserting "halts with a tagged error" cannot name the tag. *Recommend the spec list the required tags, or state the taxonomy is defined by the implementation step and tests assert only `_tag` presence + location fields.* Borderline moderate; placed here because the design already owns it as a build task

### m3. "before any walker or interpreter reads it" vs "before any interpretation begins" — two phrasings of the decode-before-read gate across `specs/program-ir/spec.md:5` and `:10`. Same intent; harmless. *Resolved on trace.*

### m4. `&dialogue` removal disposition ("redirect to `&user`" vs "drop") is an open question by design (`design.md:118`, archive S15). Not a spec ambiguity — it is a flagged decision awaiting user confirmation. The spec already states both the closed set and "any retained ingestion write lands in `&user`" (`specs/context-state/spec.md:5`), which is coherent whichever way the open question resolves. *Counted resolved — traced to the open question.*

### m5. "Operator definitions are a table in the Program document" (`specs/program-ir/spec.md:34`) with no schema. Explicitly deferred by Open Question "Operator-table shape" (`design.md:34` / familiarization §2): the table's concrete schema lands with the change that executes operators, carried under IR7 meanwhile. *Counted resolved — traced to a named deferral.*

### m6. Citation precision on the dangling-spawn line (`indra-actor.machine.ts:138-139` vs the `:136-143` block). A documentation nit in the design, not a spec-conformance ambiguity. *Noted; resolved per familiarization §6.*

---

## Effect Schema API verification

**Verdict: all four cited API names are current in the installed `effect@3.21.3`. None has drifted.** One precision note on where `ParseError` lives.

Verified locally by grep over `runtime/node_modules/effect/dist/dts/` (installed version confirmed `effect@3.21.3` at `node_modules/effect/package.json` and `runtime/package.json:18`). The design's API-surface claim is at `design.md:129`, marked `[?]`, and IR1 cites the specific names at `design.md:45,47`.

| Cited name (`design.md`) | Local evidence | Status |
| --- | --- | --- |
| `Schema.decodeUnknown` | `Schema.d.ts:337` — `decodeUnknown: <A, I, R>(schema) => (u: unknown) => Effect.Effect<A, ParseResult.ParseError, R>` | Current. Returns an `Effect` with `ParseResult.ParseError` in the error channel, exactly as IR1 describes ("a `Schema.decodeUnknown` failure is an `Effect` with a typed `ParseError`"). |
| `Schema.Schema.Type<typeof Program>` | `Schema.d.ts:155` `export declare namespace Schema`, containing `type Type<S> = S extends Schema.Variance<infer A,…> ? A : never` at `:169` | Current. The module exports a `Schema` namespace whose `Type` extractor resolves `Schema.Schema.Type<…>`. |
| struct / union combinators | `Schema.d.ts:1363-1364` `export declare function Struct<…>`; `:652-655` `export declare function Union<…>` | Current. Both are exported function combinators. |
| `ParseError` in the error channel | `ParseResult.d.ts:203` `export declare class ParseError`, `_tag: "ParseError"` (`:198`); referenced as `ParseResult.ParseError` in every `decode*` signature in `Schema.d.ts` | Current, with a **precision note**: `ParseError` is exported from the `ParseResult` module, surfaced as `ParseResult.ParseError`. There is no `Schema.ParseError` export. The design's prose "`ParseError` in the error channel" is accurate; any code should import it as `ParseResult.ParseError` (or via `import { ParseResult } from "effect"`), not as a member of `Schema`. |

The matching documentation page confirms `Schema.decodeUnknown` ("returns an Effect"), the `Schema.Type` extractor ("extract the inferred type `Type` … using the `Schema.Type` utility"), `Schema.Struct` ("the `Struct` constructor … create a new schema that outlines an object"), and `ParseError` ("a failed parse results in a `Left` value containing a `ParseError`"): <https://effect.website/docs/schema/getting-started/> . `Schema.Union` is documented on the basic-usage page rather than getting-started; its declaration is verified locally (`Schema.d.ts:652`).

**Recommendation for the design.** The `[?]` on `design.md:129` can be discharged: the four names are pinned to `effect@3.21.3`. One amendment — write the error-channel type as `ParseResult.ParseError`, not `Schema.ParseError`, since the class is exported from `ParseResult`.

---

## The most consequential ambiguities (summary)

1. **`&args` (M1)** — an as-built namespace the closed-surface requirement neither lists nor disposes of; readers ship opposite enum definitions and one invents an undeclared breaking change.
2. **Registry interface (M4)** — the abstraction's signature (sync vs Effect, record vs Layer vs `resolve()`, membership vs fetch) is exactly what each implementer must invent, with no shape to conform to.
3. **Version format + "recognize" (M2)** — integer-exact vs semver-range changes the schema field type and every version scenario.
4. **"Equivalent Program" after round trip (M3)** — deep-structural equality vs byte-identity; the stricter reading fails any schema that decodes to defaulted or branded values.

---

## Sources

- Effect Schema getting-started (decodeUnknown, Schema.Type, Struct, ParseError): <https://effect.website/docs/schema/getting-started/>
- Local API evidence: `runtime/node_modules/effect/dist/dts/Schema.d.ts` (lines 155, 169, 337, 652–655, 1363–1364), `runtime/node_modules/effect/dist/dts/ParseResult.d.ts` (lines 198, 203); installed version `effect@3.21.3` (`runtime/node_modules/effect/package.json`, `runtime/package.json:18`).
- Specs reviewed: `openspec/changes/define-program-ir/specs/{program-ir,program-validation,inference-layer,context-state}/spec.md`; baselines `openspec/specs/{context-state,inference-layer}/spec.md`; `openspec/specs/interpreter-runtime/spec.md` (totality and `&result` targets).
- Design and seam log: `openspec/changes/define-program-ir/design.md:39-143`; `openspec/changes/archive/2026-06-12-extract-deterministic-runtime/design.md:113-137`.
- As-built source: `runtime/src/ast/types.ts` (`:36` namespace union, `:78-82` `SetStatement`, `:90-98` `Terminator`/`await storeIn`, `:105-109` optional `when`), `runtime/src/effect/errors.ts` (the four tagged errors), `runtime/src/effect/turn.ts:92-99,211-222`, `runtime/src/baml/inference.layer.ts`.
