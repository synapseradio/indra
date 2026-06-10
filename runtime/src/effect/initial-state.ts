import { Effect } from "effect";
import type {
  ActorDef,
  ContextPath,
  GuardExpr,
  Program,
  Terminator,
  ValueExpr,
} from "../ast/types.ts";
import { getAt, pathToString } from "./path.ts";
import { IncompleteInitialStateError } from "./errors.ts";

/**
 * Strict initial-context validation (task 2.5, spec: initial context must be
 * fully initialized).
 *
 * INDRA has no global context to inherit a default from, so every `&context`
 * path the program references must be initialized by the root `dialogue … with:`
 * block before the first turn. This traces every such reference across all
 * actors and reports the ones the initial world never initialized. It is pure
 * (no STM, no store) and runs once, before the conductor dispatches turn one.
 */

const collectFromValue = (value: ValueExpr, into: ContextPath[]): void => {
  switch (value.kind) {
    case "literal":
      return;
    case "ref":
      into.push(value.path);
      return;
    case "inference":
      for (const argument of Object.values(value.ref.input)) {
        collectFromValue(argument, into);
      }
      return;
  }
};

const collectFromGuard = (guard: GuardExpr, into: ContextPath[]): void => {
  switch (guard.kind) {
    case "is":
    case "isNot":
      collectFromValue(guard.left, into);
      collectFromValue(guard.right, into);
      return;
    case "exists":
      into.push(guard.path);
      return;
  }
};

const collectFromTerminator = (
  terminator: Terminator,
  into: ContextPath[],
): void => {
  switch (terminator.kind) {
    case "say":
      collectFromValue(terminator.what, into);
      return;
    case "await":
      collectFromValue(terminator.withInput, into);
      into.push(terminator.storeIn);
      return;
    case "return":
      collectFromValue(terminator.output, into);
      return;
  }
};

const collectFromActor = (actor: ActorDef, into: ContextPath[]): void => {
  for (const branch of actor.perform.then) {
    if (branch.when !== undefined) collectFromGuard(branch.when, into);
    for (const set of branch.sets) {
      into.push(set.target);
      collectFromValue(set.value, into);
    }
    collectFromTerminator(branch.terminator, into);
  }
};

/** Every `&context` path the program references, deduplicated and rendered. */
export const referencedContextPaths = (program: Program): readonly string[] => {
  const collected: ContextPath[] = [];
  for (const actor of Object.values(program.actors)) {
    collectFromActor(actor, collected);
  }
  const contextOnly = collected.filter((path) => path.ns === "context");
  return [...new Set(contextOnly.map(pathToString))];
};

/**
 * The `&context` paths referenced by the program that the initial world never
 * initialized. Empty means the program is fully initialized. Pure and directly
 * unit-testable against a Program literal.
 */
export const findUninitializedContextPaths = (
  program: Program,
): readonly string[] => {
  const collected: ContextPath[] = [];
  for (const actor of Object.values(program.actors)) {
    collectFromActor(actor, collected);
  }
  const seen = new Set<string>();
  const missing: string[] = [];
  for (const path of collected) {
    if (path.ns !== "context") continue;
    const rendered = pathToString(path);
    if (seen.has(rendered)) continue;
    seen.add(rendered);
    if (getAt(program.initialContext, path) === undefined) {
      missing.push(rendered);
    }
  }
  return missing;
};

/**
 * Halt before turn one with a fatal IncompleteInitialStateError naming the first
 * uninitialized path, or succeed if the initial world covers every reference.
 */
export const validateInitialState = (
  program: Program,
): Effect.Effect<void, IncompleteInitialStateError> => {
  const missing = findUninitializedContextPaths(program);
  return missing.length === 0
    ? Effect.void
    : Effect.fail(
        new IncompleteInitialStateError({ missingPath: missing[0]! }),
      );
};
