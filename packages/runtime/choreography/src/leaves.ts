import type {
  ActorDef,
  ContextPath,
  Json,
  Program,
  TurnOutcome,
} from "@indra/runtime-contracts";
import type {
  ContextStoreTag,
  IndraRuntime,
  Inference,
} from "@indra/runtime-core";
import {
  commitTurnEffect,
  ingestUserInputEffect,
  runTurnEffect,
  stageValueEffect,
  validateInitialState,
} from "@indra/runtime-core";
import { Cause, type Effect, Exit } from "effect";
import { fromPromise } from "xstate";

/**
 * The effectful leaves (task 3.3): each is a `fromPromise` actor that runs an
 * Effect through the ManagedRuntime. This module is the sole crossing point
 * between XState and the Effect substrate — the machines import these, never the
 * store directly.
 *
 * Failures reject with the tagged-error instance (via `Cause.squash`), not an
 * opaque FiberFailure, so a machine `onError` handler can switch on
 * `event.error._tag` (the Effect<->XState impedance mitigation).
 */
const run = <A>(
  runtime: IndraRuntime,
  effect: Effect.Effect<A, unknown, ContextStoreTag | Inference>,
): Promise<A> =>
  runtime
    .runPromiseExit(effect)
    .then((exit) =>
      Exit.isSuccess(exit)
        ? exit.value
        : Promise.reject(Cause.squash(exit.cause)),
    );

export const makeLeaves = (runtime: IndraRuntime) => ({
  validateInitial: fromPromise<void, Program>(({ input }) =>
    run(runtime, validateInitialState(input)),
  ),
  runTurn: fromPromise<TurnOutcome, ActorDef>(({ input }) =>
    run(runtime, runTurnEffect(input)),
  ),
  commitTurn: fromPromise<void>(() => run(runtime, commitTurnEffect)),
  ingestUserInput: fromPromise<void, string>(({ input }) =>
    run(runtime, ingestUserInputEffect(input)),
  ),
  stageValue: fromPromise<void, { path: ContextPath; value: Json }>(
    ({ input }) => run(runtime, stageValueEffect(input.path, input.value)),
  ),
});

export type Leaves = ReturnType<typeof makeLeaves>;
