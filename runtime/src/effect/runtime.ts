import { Layer, ManagedRuntime } from "effect";
import type { World } from "../ast/types.ts";
import { ContextStoreLayer, type ContextStoreTag } from "./context-store.layer.ts";
import type { Inference } from "../baml/inference.ts";

/**
 * The Effect<->XState bridge (D1, task 3.3). `ManagedRuntime` packages the
 * store and inference layers so XState's `fromPromise` leaves can run effects
 * via `runtime.runPromise`/`runPromiseExit`. One runtime per program run holds
 * the world; tests pass a stub inference layer, the live entrypoint passes the
 * real one.
 */
export type IndraRuntime = ManagedRuntime.ManagedRuntime<
  ContextStoreTag | Inference,
  never
>;

/** Build a runtime over a fresh world and a chosen inference layer (stub or live). */
export const makeIndraRuntime = (
  initial: World,
  inference: Layer.Layer<Inference>,
): IndraRuntime =>
  ManagedRuntime.make(Layer.merge(ContextStoreLayer(initial), inference));
