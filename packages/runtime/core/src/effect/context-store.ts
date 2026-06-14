import type { ContextPath, Json, World } from "@indra/runtime-contracts";
import { ReadOnlyViolationError } from "@indra/runtime-contracts";
import { Effect, STM, TRef } from "effect";
import { getAt, isReadOnly, pathToString, setAt } from "./path";

/**
 * The `&context` whiteboard, STM-backed (D1, D2). Three TRefs hold the world:
 *
 *   committed         the consistent, turn-boundary state every read sees
 *   sequenceOverlay   immediate (`sequence`) writes — visible this turn
 *   stagedOverlay     staged (`perform`) writes — invisible until the commit
 *
 * `get` resolves committed ∪ sequenceOverlay and NEVER reads stagedOverlay:
 * that single fact is what makes perform-sets invisible within their own turn
 * and sequence-sets visible within it (D3). `commitTurn` folds both overlays
 * into committed in one transaction, sequence first so a staged write wins on a
 * same-path collision (S3).
 *
 * The transaction body is pure TRef operations. Because Effect's STM type
 * forbids embedding an `Effect`, the rule "the LLM call is outside the
 * transaction" (invariant 3) is enforced by the compiler, not by convention.
 */

/** A set of path writes, keyed by rendered path so a later write to a path replaces an earlier one. */
export type Patch = ReadonlyMap<
  string,
  { readonly path: ContextPath; readonly value: Json }
>;

export const emptyPatch: Patch = new Map();

const patchSet = (patch: Patch, path: ContextPath, value: Json): Patch => {
  const next = new Map(patch);
  next.set(pathToString(path), { path, value });
  return next;
};

/** Fold a patch into a world, applying writes in insertion order. */
export const applyPatch = (world: World, patch: Patch): World => {
  let result = world;
  for (const { path, value } of patch.values()) {
    result = setAt(result, path, value);
  }
  return result;
};

/** The three transactional cells backing one store. `committed` may be shared across stores. */
export interface StoreRefs {
  readonly committed: TRef.TRef<World>;
  readonly sequenceOverlay: TRef.TRef<Patch>;
  readonly stagedOverlay: TRef.TRef<Patch>;
}

export interface ContextStore {
  /** Read a path against committed ∪ sequence overlay. Never sees staged writes. */
  readonly get: (path: ContextPath) => Effect.Effect<Json | undefined>;
  /** Read the whole committed world (for assertions and snapshots). */
  readonly committed: Effect.Effect<World>;
  /** `sequence`-level write: immediate, visible this turn, its own one-shot commit. */
  readonly setImmediate: (
    path: ContextPath,
    value: Json,
  ) => Effect.Effect<void, ReadOnlyViolationError>;
  /** `perform`-level write: staged, invisible until the turn-boundary commit. */
  readonly setStaged: (
    path: ContextPath,
    value: Json,
  ) => Effect.Effect<void, ReadOnlyViolationError>;
  /** Runtime-privileged write straight to committed, bypassing the read-only guard. */
  readonly setPrivileged: (
    path: ContextPath,
    value: Json,
  ) => Effect.Effect<void>;
  /** Clear both overlays at the start of a turn. */
  readonly beginTurn: Effect.Effect<void>;
  /** Fold sequence then staged into committed, then clear both overlays — one transaction. */
  readonly commitTurn: Effect.Effect<void>;
}

/** Allocate a fresh store backed by an initial world. */
export const makeStoreRefs = (initial: World): STM.STM<StoreRefs> =>
  STM.gen(function* () {
    const committed = yield* TRef.make(initial);
    const sequenceOverlay = yield* TRef.make(emptyPatch);
    const stagedOverlay = yield* TRef.make(emptyPatch);
    return { committed, sequenceOverlay, stagedOverlay };
  });

/** Allocate overlays that share an existing committed cell — two contending actors over one world. */
export const makeStoreRefsSharing = (
  committed: TRef.TRef<World>,
): STM.STM<StoreRefs> =>
  STM.gen(function* () {
    const sequenceOverlay = yield* TRef.make(emptyPatch);
    const stagedOverlay = yield* TRef.make(emptyPatch);
    return { committed, sequenceOverlay, stagedOverlay };
  });

const guardWritable = (
  path: ContextPath,
): Effect.Effect<void, ReadOnlyViolationError> =>
  isReadOnly(path.ns)
    ? Effect.fail(
        new ReadOnlyViolationError({
          path: pathToString(path),
          namespace: path.ns,
        }),
      )
    : Effect.void;

/**
 * Build the store interface over a set of refs.
 *
 * `onCommitAttempt` instruments the commit loop: the transaction body calls it
 * on every execution, so attempts minus successful commits equals STM retries.
 * It fires after the transaction's reads and before its writes — the window a
 * concurrent commit must land in to invalidate the journal — which is what
 * lets a test inject a deterministic conflict and observe a real retry. It
 * must stay cheap and must not touch program state: a retried transaction
 * calls it again.
 */
export const storeFromRefs = (
  refs: StoreRefs,
  onCommitAttempt?: () => void,
): ContextStore => ({
  get: (path) =>
    STM.commit(
      STM.gen(function* () {
        const world = yield* TRef.get(refs.committed);
        const seq = yield* TRef.get(refs.sequenceOverlay);
        return getAt(applyPatch(world, seq), path);
      }),
    ),

  committed: STM.commit(TRef.get(refs.committed)),

  setImmediate: (path, value) =>
    Effect.zipRight(
      guardWritable(path),
      STM.commit(
        TRef.update(refs.sequenceOverlay, (p) => patchSet(p, path, value)),
      ),
    ),

  setStaged: (path, value) =>
    Effect.zipRight(
      guardWritable(path),
      STM.commit(
        TRef.update(refs.stagedOverlay, (p) => patchSet(p, path, value)),
      ),
    ),

  setPrivileged: (path, value) =>
    STM.commit(TRef.update(refs.committed, (w) => setAt(w, path, value))),

  beginTurn: STM.commit(
    STM.gen(function* () {
      yield* TRef.set(refs.sequenceOverlay, emptyPatch);
      yield* TRef.set(refs.stagedOverlay, emptyPatch);
    }),
  ),

  commitTurn: STM.commit(
    STM.gen(function* () {
      const world = yield* TRef.get(refs.committed);
      const seq = yield* TRef.get(refs.sequenceOverlay);
      const staged = yield* TRef.get(refs.stagedOverlay);
      onCommitAttempt?.();
      // sequence first, staged overwrites on same-path collision (S3).
      const next = applyPatch(applyPatch(world, seq), staged);
      yield* TRef.set(refs.committed, next);
      yield* TRef.set(refs.sequenceOverlay, emptyPatch);
      yield* TRef.set(refs.stagedOverlay, emptyPatch);
    }),
  ),
});

/** Build a store backed by a fresh world. */
export const makeContextStore = (initial: World): Effect.Effect<ContextStore> =>
  Effect.map(STM.commit(makeStoreRefs(initial)), storeFromRefs);
