## Context

The contract package is the boundary between what a developer authors and what the runtime executes. Today that boundary is a parse tree. The header of `packages/runtime/contracts/src/types.ts` states the premise directly — "the parsed shape of an INDRA `.in` program … the parser's eventual output" (`:1-12`) — and the types carry it through: a string names each inference function (`:50-54`), a dotted path names each piece of state (`:38-42`), and a fixed namespace union enumerates the worlds those paths address (`:36`).

A language needs that indirection. A `.in` file is text, so its inference calls and its state reads can only be names until something resolves them, and its world can only be a bag of paths until something types it. A framework has none of those constraints. The developer writes TypeScript, holds the actual inference function, and works with typed state. The indirection that a parser requires is pure cost in a framework: it discards the type information the developer already had.

This change removes that cost. It does not invent a new execution model; the runtime still runs one generic interpreter over actor definitions it reads as data. It re-types the boundary so the data the interpreter reads is constructed by a typed TypeScript API rather than parsed from a string world.

## Goals / Non-Goals

Goals:

- Make the contract types framework-native: typed, authored in TypeScript, with no string-name or string-path indirection that a parser would need but a framework does not.
- Let the type system carry guarantees the runtime would otherwise check at load: that an inference reference resolves, that a state read is in scope, that an awaited value is used at its real type.
- Keep the execution structure inspectable, so determinism and static validation survive the re-typing.

Non-Goals:

- Changing the interpreter's execution semantics — the turn cycle, staged-versus-immediate writes, the delegation stack. Those are reshaped only where the contract type they read changes.
- Building persistence. Serializability of actor definitions is explicitly surrendered here and handed to the persistence capability.
- The `.in` parser. This change defines the typed model; the parser, if built, is a later producer of it.
- The isolation invariant itself. `scope-context-by-actor-subtree` owns no-meld; this change gives it a typed substrate and is updated alongside it.

## Decisions

### DL1 — The contract is the framework's typed actor model, not a parse tree

The header and the conception of `types.ts` change. The types describe the values the framework's TypeScript API constructs and the runtime executes. The phrase "the parser's eventual output" is removed. A `.in` parser, if it is ever built, is one producer that emits this model; it is not the model's definition, and the model owes it nothing.

### DL2 — Inference leaves are direct typed function references

`InferenceRef.fn: string` becomes a reference to the inference function itself — the typed function the developer holds, today a BAML-generated function. The call carries its typed input and, where it narrows the result, a typed selection of one field. There is no registry and no load-time name resolution, because there is no name: an unbound or misspelled inference reference is a TypeScript error at author time, not a runtime lookup that can miss.

The consequence is that an actor definition holds a function and is therefore not plain JSON. This is the serializability the header called load-bearing for snapshot persistence (`:4-8`). We surrender it knowingly: persistence is deferred, the runtime runs in process, and nothing today serializes an actor definition. When persistence lands, it persists runtime state, and re-supplies actor definitions from code at resume — the standard separation for a host that holds behavior in code.

### DL3 — Awaiting an actor returns its typed value

`Terminator.await` drops `storeIn`. An awaited actor returns a typed value, and the awaiting actor's turn logic receives it as a typed value and binds it where it belongs — into a field of its own private state (DL4), to be read by its later branches. The result namespace that a no-`storeIn` await fell back to does not exist, because nothing falls back: the value has a type and a destination the caller names.

### DL4 — State is typed, scoped values, not a global string-addressed world

`World`, `Namespace`, and `ContextPath` are retired. In their place:

- An actor's **private state** is a typed value the actor declares. Its reads and writes are typed access to that value, not dotted paths into a shared bag.
- A **frame** is a typed immutable value a supervisor establishes for its subtree, readable by descendants (the shared-room half of `scope-context-by-actor-subtree`).
- **Runtime-owned inputs** — what the namespaces `user` and `signals` carried — become typed values the runtime provides, read-only to the program.

The dead namespaces the language-era model carried (`dialogue`, an artifact no protocol source defines; `args`, declared and never read) simply have no place in a typed model and are gone with the namespace union itself.

### DL5 — The execution structure stays inspectable data; the typing lives at the authoring surface

This is the load-bearing decision, and the one to confirm before the rest is written.

An actor's turn logic — its guarded branches, its guards, its terminators — remains a **data structure** the one generic interpreter reads, exactly as the interpreter-runtime capability requires ("one generic interpreter actor executes every INDRA actor, parameterized by the actor's definition as data"). The TypeScript API the developer writes is a typed builder: it produces that structure with full type information, the way a typed query builder produces an inspectable query rather than opaque code. The runtime walks the structure; the developer never sees a string.

The alternative is to make turn logic ordinary TypeScript control flow — an actor's `perform` is a function with real `if`/`return`. That is more native still, and it is rejected here, because it makes the turn logic opaque. The framework's determinism guarantee and its static totality and reference checks all depend on the runtime being able to read the structure before it runs. A function body cannot be checked for branch totality or walked for its state reads without executing it. Keeping the structure as inspectable data is what lets the type system add guarantees on top of static validation rather than replacing it with runtime trust. If turn logic should instead be opaque TypeScript, that is a deeper re-architecture with a real cost to the runtime's guarantees, and it needs its own decision.

### DL6 — Typed scoped state lets the type system carry part of no-meld

`scope-context-by-actor-subtree` enforces no-meld by resolving every state reference against an actor's lexical scope chain at load, and its open question asks how much of that a TypeScript type could carry instead. Typed scoped state answers a meaningful share of it. When an actor's readable state is a typed value — its private state, its ancestors' frames, its declared inbound crossings — a reference to a sibling's private state is not a path that fails to resolve at load; it is a value not in scope, which does not typecheck. The load-time validator remains the backstop for what the type system cannot express (dynamic spawn sites, crossing routing), but the floor of the invariant rises into the compiler. That change is specified in `scope-context-by-actor-subtree`, restated against this typed substrate; this change provides the substrate.

### DL7 — Serialization posture: state is data, definitions are code

With DL2 and DL4, two things separate cleanly. An actor's **state** — private state values, frame values — stays plain data and remains serializable. An actor's **definition** — its turn structure, which now holds inference function references — is code. When persistence is built, it persists state and re-supplies definitions from code at resume. This change states the posture and builds none of the machinery; it only ensures the two are separable rather than fused in one serializable document, which the language-era model required and this one abandons.

## Risks / Trade-offs

- **This touches live runtime code, not only specs.** The contract is read by the turn executor, the store, the interpreter, and the initial-state walker. Each is a real edit with its own tests, sequenced so the skeleton keeps running between steps. This is the largest blast radius of any change so far, and it is the reason the change is sequenced first rather than folded into another.
- **Surrendering serializability is a one-way door for the current snapshot path.** If session persistence were needed sooner than expected, the function-reference-in-definition seam would have to be solved under time pressure. The bet is that in-process execution is enough until persistence is designed deliberately.
- **DL5 is a judgment that could be wrong.** Keeping turn logic as data preserves validation but keeps a builder between the developer and plain TypeScript. If the builder proves more awkward than the guarantees are worth, the function-body alternative reopens — at the cost of the static checks. Confirm DL5 before the spec deltas are written.
- **Two changes now touch `context-state`.** This change and `scope-context-by-actor-subtree` modify the same capability. Sequencing this one first and rebasing the other onto it is what keeps the deltas from colliding; that ordering is a commitment, not a convenience.

## Open Questions

- **How typed is private state's shape?** A per-actor declared type is the goal. The open part is whether the framework requires each actor to declare its private-state type explicitly, or infers it from the writes the turn structure performs. Inference is friendlier; an explicit declaration is checkable earlier. Decide when the typed builder API is designed.
- **Do frames need nominal identity?** A frame is a typed immutable value, but two frames of the same shape established by different supervisors are different rooms. Whether the type system should distinguish them nominally, or structural typing is enough, bears on how strongly DL6 carries no-meld. Resolve against a concrete two-supervisor example.
- **What is the typed shape of a crossing here versus in `scope-context-by-actor-subtree`?** Crossings are typed envelopes in both. This change owns the value model; that change owns the routing. The seam between them needs one owner per property to avoid a double specification.
