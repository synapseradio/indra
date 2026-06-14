import { describe, expect, it } from "@effect/vitest";
import type { ContextPath } from "@indra/runtime-contracts";
import { makeContextStore } from "@indra/runtime-core";
import { Effect } from "effect";

/**
 * Seam 6.2 — D3 sequence immediacy.
 *
 * A `sequence`-level `set:` applies immediately and is visible to a later step
 * within the same sequence (same turn). This is the counterpart to 6.1: the two
 * `set:` levels differ precisely in same-turn visibility.
 */

const x: ContextPath = { ns: "context", segments: ["x"] };

describe("sequence immediacy (6.2, D3)", () => {
  it.effect("a sequence set is visible to a later read in the same turn", () =>
    Effect.gen(function* () {
      const store = yield* makeContextStore({ context: { x: 0 } });

      yield* store.beginTurn;
      yield* store.setImmediate(x, 1); // step 1
      const step2 = yield* store.get(x); // step 2 reads it back

      expect(step2).toBe(1);
    }),
  );

  it.effect("a sequence set also survives the turn-boundary commit", () =>
    Effect.gen(function* () {
      const store = yield* makeContextStore({ context: { x: 0 } });

      yield* store.beginTurn;
      yield* store.setImmediate(x, 1);
      yield* store.commitTurn;

      const committed = yield* store.get(x);
      expect(committed).toBe(1);
    }),
  );
});
