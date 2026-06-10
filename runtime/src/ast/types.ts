/**
 * The parsed shape of an INDRA `.in` program.
 *
 * Every type here is plain, serializable data. No functions, no class
 * instances. That is load-bearing: an `ActorDef` is handed to XState as an
 * actor's `input` (D10), so it must survive structured serialization and
 * snapshot persistence. The runtime never holds behavior in the AST; behavior
 * lives in the one generic interpreter that reads this data.
 *
 * This is the parser's eventual output. The skeleton hand-authors it directly
 * (see programs/skeleton.ts); the EBNF parser is a later capability.
 */

/** A JSON value. The `&context` world is built entirely from these. */
export type Json =
  | string
  | number
  | boolean
  | null
  | readonly Json[]
  | { readonly [key: string]: Json };

/**
 * The whole namespaced world the runtime holds in Effect. Each top-level key
 * is a namespace (`context`, `user`, `signals`, `dialogue`). The world lives
 * exclusively in Effect (D1); the AST only describes its initial value.
 */
export type World = { readonly [namespace: string]: Json };

/**
 * The namespaces a path can address. `user` and `signals` are read-only to
 * programs and writable only through the runtime-privileged path; `context`
 * and `dialogue` are program-writable. `args` addresses the current
 * signal/command arguments.
 */
export type Namespace = "context" | "user" | "signals" | "dialogue" | "args";

/** A reference into the world, e.g. `&context.tree.mode` -> `{ns:"context", segments:["tree","mode"]}`. */
export interface ContextPath {
  readonly ns: Namespace;
  readonly segments: readonly string[];
}

/**
 * A reference to one BAML inference function. `input` maps the function's
 * named arguments to value expressions resolved at call time. `select`, when
 * present, picks a single field out of the typed result — the composition
 * boundary (D9) that lets a turn keep only `message` and discard `reasoning`.
 */
export interface InferenceRef {
  readonly fn: string;
  readonly input: { readonly [argument: string]: ValueExpr };
  readonly select?: string;
}

/** A value the runtime can produce: a literal, a world read, or an inference call. */
export type ValueExpr =
  | { readonly kind: "literal"; readonly value: Json }
  | { readonly kind: "ref"; readonly path: ContextPath }
  | { readonly kind: "inference"; readonly ref: InferenceRef };

/**
 * A `when:` guard. `is` is type-strict structural deep-equality, `isNot` its
 * negation, `exists` true iff the path resolves to a present, non-null cell
 * (S6). The full expression grammar grows here later.
 */
export type GuardExpr =
  | { readonly kind: "is"; readonly left: ValueExpr; readonly right: ValueExpr }
  | { readonly kind: "isNot"; readonly left: ValueExpr; readonly right: ValueExpr }
  | { readonly kind: "exists"; readonly path: ContextPath };

/**
 * `perform` sets stage (invisible until the turn-boundary commit, D3);
 * `sequence` sets apply immediately within the sequence.
 */
export type SetLevel = "perform" | "sequence";

export interface SetStatement {
  readonly target: ContextPath;
  readonly value: ValueExpr;
  readonly level: SetLevel;
}

/**
 * How a turn ends (S2):
 * - `say`   -> idle + PASS_CONTROL, emitting the text to the host.
 * - `await` -> spawn a child interpreter, onDone assigns its output into `storeIn`.
 * - `return`-> final state carrying `output`.
 */
export type Terminator =
  | { readonly kind: "say"; readonly to: string; readonly what: ValueExpr }
  | {
      readonly kind: "await";
      readonly actor: string;
      readonly withInput: ValueExpr;
      readonly storeIn: ContextPath;
    }
  | { readonly kind: "return"; readonly output: ValueExpr };

/**
 * One branch of a `then:` block. The first branch whose `when` passes runs;
 * a branch with no `when` is the `otherwise:` and must come last. `sets` run
 * in order before the terminator.
 */
export interface Branch {
  readonly when?: GuardExpr;
  readonly sets: readonly SetStatement[];
  readonly terminator: Terminator;
}

export interface PerformBlock {
  readonly method: string;
  readonly goal: string;
  readonly output?: string;
  readonly then: readonly Branch[];
}

/**
 * One INDRA actor definition. identity/rules/understands are the persona data
 * (D5) the inference layer renders; `perform` is the turn logic the generic
 * interpreter runs.
 */
export interface ActorDef {
  readonly id: string;
  readonly identity: string;
  readonly rules: readonly string[];
  readonly understands: readonly string[];
  readonly perform: PerformBlock;
}

/**
 * A whole resolved program: the entry actor's id, the root `dialogue … with:`
 * world that initializes every namespace, and the actor table keyed by id.
 */
export interface Program {
  readonly entry: string;
  readonly initialContext: World;
  readonly actors: { readonly [id: string]: ActorDef };
}
