import { describe, expect, it } from "@effect/vitest";
import type { ContextPath, World } from "@indra/runtime-contracts";
import {
  getAt,
  makeStoreRefsSharing,
  storeFromRefs,
} from "@indra/runtime-core";
import { Effect, STM, TRef } from "effect";

/**
 * Seam 6.3 — D2 parallel STM.
 *
 * Many actors share one transactional `&context` (one committed TRef) while
 * holding independent staging overlays. When their commits contend, STM must
 * serialize them and retry the loser against the latest committed value, so no
 * update is lost.
 *
 * The mechanism under test is that `commitTurn` reads committed INSIDE its STM
 * transaction and folds its own overlay onto that latest value. A naive
 * implementation that wrote back a whole-world snapshot taken at `beginTurn`
 * would clobber a concurrent commit; STM's optimistic retry plus the
 * fold-onto-latest is exactly what prevents it. `Effect.yieldNow` between stage
 * and commit forces the interleaving that makes the contention real.
 */

const at = (key: string): ContextPath => ({ ns: "context", segments: [key] });

describe("parallel STM contention (6.3, D2)", () => {
  it.effect("two contending commits both land, no lost update", () =>
    Effect.gen(function* () {
      const committed = yield* STM.commit(
        TRef.make<World>({ context: { a: 0, b: 0 } }),
      );
      const actorA = storeFromRefs(
        yield* STM.commit(makeStoreRefsSharing(committed)),
      );
      const actorB = storeFromRefs(
        yield* STM.commit(makeStoreRefsSharing(committed)),
      );

      // A stages, then parks (yields) before committing; B commits in the gap.
      const turnA = Effect.gen(function* () {
        yield* actorA.beginTurn;
        yield* actorA.setStaged(at("a"), 1);
        yield* Effect.yieldNow();
        yield* actorA.commitTurn;
      });
      const turnB = Effect.gen(function* () {
        yield* actorB.beginTurn;
        yield* actorB.setStaged(at("b"), 1);
        yield* actorB.commitTurn;
      });

      yield* Effect.all([turnA, turnB], { concurrency: "unbounded" });

      const world = yield* actorA.committed;
      expect(getAt(world, at("a"))).toBe(1);
      expect(getAt(world, at("b"))).toBe(1);
    }),
  );

  it.effect(
    "every commit survives under heavy contention on one shared world",
    () =>
      Effect.gen(function* () {
        const fanout = 16;
        const committed = yield* STM.commit(TRef.make<World>({ context: {} }));

        const turns = Array.from({ length: fanout }, (_unused, index) =>
          Effect.gen(function* () {
            const store = storeFromRefs(
              yield* STM.commit(makeStoreRefsSharing(committed)),
            );
            yield* store.beginTurn;
            yield* store.setStaged(at(`k${index}`), index);
            yield* Effect.yieldNow();
            yield* store.commitTurn;
          }),
        );

        yield* Effect.all(turns, { concurrency: "unbounded" });

        const world = yield* STM.commit(TRef.get(committed));
        for (let index = 0; index < fanout; index++) {
          expect(getAt(world, at(`k${index}`))).toBe(index);
        }
      }),
  );
});
