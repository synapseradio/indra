import { Context, Layer } from "effect";
import type { World } from "../ast/types.ts";
import { type ContextStore, makeContextStore } from "./context-store.ts";

/**
 * The dependency-injection seam for the store. XState leaves resolve the store
 * through this tag, and tests provide a layer built from whatever initial world
 * they need. The service is the world; nothing else in the system constructs a
 * store directly (D1).
 */
export class ContextStoreTag extends Context.Tag("ContextStore")<
  ContextStoreTag,
  ContextStore
>() {}

/** A layer holding a store initialized to `initial` — typically a Program's `initialContext`. */
export const ContextStoreLayer = (
  initial: World,
): Layer.Layer<ContextStoreTag> =>
  Layer.effect(ContextStoreTag, makeContextStore(initial));
