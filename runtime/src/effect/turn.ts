import { Effect } from "effect";
import type {
  ActorDef,
  Branch,
  ContextPath,
  GuardExpr,
  Json,
  Terminator,
  ValueExpr,
} from "../ast/types.ts";
import { ContextStoreTag } from "./context-store.layer.ts";
import { Inference } from "../baml/inference.ts";
import type {
  InferenceParseError,
  ReadOnlyViolationError,
  ToolInvocationError,
} from "./errors.ts";
import { ToolInvocationError as ToolInvocationErrorClass } from "./errors.ts";

/**
 * The deterministic evaluation of one INDRA turn: select a branch, run its
 * sets, resolve its terminator to concrete values. This is pure Effect over the
 * ContextStore and Inference services — no XState. The XState `runTurn` leaf
 * runs it through the ManagedRuntime; XState never reaches the store except
 * through that bridge (the inward-only dependency rule).
 *
 * Inference completes to a plain value here, before any commit. The turn stages
 * writes but never folds them; the conductor's separate `commitTurn` leaf is the
 * only thing that commits, at the boundary. That keeps the LLM call outside the
 * STM transaction (invariant 3) by construction.
 */

/** The resolved end of a turn handed back to the choreography layer. */
export type TurnOutcome =
  | { readonly kind: "say"; readonly to: string; readonly text: string }
  | {
      readonly kind: "await";
      readonly actor: string;
      readonly input: Json;
      readonly storeIn: ContextPath;
    }
  | { readonly kind: "return"; readonly output: Json };

export type TurnError =
  | ReadOnlyViolationError
  | ToolInvocationError
  | InferenceParseError;

type TurnRequirements = ContextStoreTag | Inference;

/** Type-strict structural deep-equality (S6): different types compare false, no coercion. */
const deepEqual = (a: Json | undefined, b: Json | undefined): boolean => {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (typeof a === "object" && typeof b === "object") {
    // Arrays are handled above, so both are plain objects here.
    const aObj = a as { readonly [key: string]: Json };
    const bObj = b as { readonly [key: string]: Json };
    const ka = Object.keys(aObj);
    const kb = Object.keys(bObj);
    if (ka.length !== kb.length) return false;
    return ka.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(bObj, key) &&
        deepEqual(aObj[key], bObj[key]),
    );
  }
  return false;
};

const evalValue = (
  value: ValueExpr,
): Effect.Effect<Json, TurnError, TurnRequirements> =>
  Effect.gen(function* () {
    switch (value.kind) {
      case "literal":
        return value.value;
      case "ref": {
        const store = yield* ContextStoreTag;
        const resolved = yield* store.get(value.path);
        return resolved === undefined ? null : resolved;
      }
      case "inference": {
        const inference = yield* Inference;
        // Skeleton dispatch is hand-maintained until persona/AST codegen lands:
        // the one inference function is WelcomeExplorer(user_input).
        if (value.ref.fn !== "WelcomeExplorer") {
          return yield* Effect.fail(
            new ToolInvocationErrorClass({
              tool: value.ref.fn,
              cause: `no inference function registered for ${value.ref.fn}`,
            }),
          );
        }
        const userInputExpr = value.ref.input["user_input"];
        const userInput =
          userInputExpr === undefined ? "" : yield* evalValue(userInputExpr);
        const result = yield* inference.welcomeExplorer(String(userInput));
        // `select` is the composition boundary (D9): keep one typed field,
        // discard the rest (e.g. reasoning never reaches the world).
        if (value.ref.select === undefined) {
          return { reasoning: result.reasoning, message: result.message };
        }
        return value.ref.select === "reasoning"
          ? result.reasoning
          : result.message;
      }
    }
  });

const evalGuard = (
  guard: GuardExpr,
): Effect.Effect<boolean, TurnError, TurnRequirements> =>
  Effect.gen(function* () {
    switch (guard.kind) {
      case "is":
        return deepEqual(yield* evalValue(guard.left), yield* evalValue(guard.right));
      case "isNot":
        return !deepEqual(yield* evalValue(guard.left), yield* evalValue(guard.right));
      case "exists": {
        const store = yield* ContextStoreTag;
        const resolved = yield* store.get(guard.path);
        return resolved !== undefined && resolved !== null;
      }
    }
  });

const selectBranch = (
  branches: readonly Branch[],
): Effect.Effect<Branch | undefined, TurnError, TurnRequirements> =>
  Effect.gen(function* () {
    let otherwise: Branch | undefined;
    for (const branch of branches) {
      if (branch.when === undefined) {
        otherwise = branch;
        continue;
      }
      if (yield* evalGuard(branch.when)) return branch;
    }
    return otherwise;
  });

const resolveTerminator = (
  terminator: Terminator,
): Effect.Effect<TurnOutcome, TurnError, TurnRequirements> =>
  Effect.gen(function* () {
    switch (terminator.kind) {
      case "say":
        return {
          kind: "say",
          to: terminator.to,
          text: String(yield* evalValue(terminator.what)),
        };
      case "await":
        return {
          kind: "await",
          actor: terminator.actor,
          input: yield* evalValue(terminator.withInput),
          storeIn: terminator.storeIn,
        };
      case "return":
        return { kind: "return", output: yield* evalValue(terminator.output) };
    }
  });

/** Evaluate one turn of an actor: clear overlays, pick a branch, run sets, resolve the terminator. */
export const runTurnEffect = (
  blueprint: ActorDef,
): Effect.Effect<TurnOutcome, TurnError, TurnRequirements> =>
  Effect.gen(function* () {
    const store = yield* ContextStoreTag;
    yield* store.beginTurn;

    const branch = yield* selectBranch(blueprint.perform.then);
    if (branch === undefined) {
      // No matching branch and no otherwise: a turn with nothing to do.
      return { kind: "return", output: null };
    }

    for (const set of branch.sets) {
      const value = yield* evalValue(set.value);
      yield* set.level === "sequence"
        ? store.setImmediate(set.target, value)
        : store.setStaged(set.target, value);
    }

    return yield* resolveTerminator(branch.terminator);
  });

/** The turn-boundary commit: fold overlays into committed. The only commit of staged writes. */
export const commitTurnEffect: Effect.Effect<void, never, ContextStoreTag> =
  Effect.flatMap(ContextStoreTag, (store) => store.commitTurn);

/** Stage a value into a path — used to land an `await:` child's output into its `store_in`. */
export const stageValueEffect = (
  path: ContextPath,
  value: Json,
): Effect.Effect<void, ReadOnlyViolationError, ContextStoreTag> =>
  Effect.flatMap(ContextStoreTag, (store) => store.setStaged(path, value));

/**
 * Runtime-privileged ingestion of user input at the turn boundary (resolved
 * seam): writes `&user.latest` and `&dialogue.latest_dialogue_entry` through the
 * privileged path, the only place `&user` is mutated.
 */
export const ingestUserInputEffect = (
  text: string,
): Effect.Effect<void, never, ContextStoreTag> =>
  Effect.flatMap(ContextStoreTag, (store) =>
    Effect.zipRight(
      store.setPrivileged({ ns: "user", segments: ["latest"] }, text),
      store.setPrivileged(
        { ns: "dialogue", segments: ["latest_dialogue_entry"] },
        text,
      ),
    ),
  );
