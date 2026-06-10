import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import type { ContextPath } from "../ast/types.ts";
import { makeContextStore } from "../effect/context-store.ts";

/**
 * Seam 6.1 — D3 staging invisibility.
 *
 * A `perform`-level (staged) `set:` must not be visible to any read in the same
 * turn, including the `when:` guard that would route on it, and must become
 * visible on the next turn after the boundary commit. This is the pure-Effect
 * proof against the ContextStore interface — no XState, no model.
 */

const value: ContextPath = { ns: "context", segments: ["value"] };

describe("staging invisibility (6.1, D3)", () => {
  it.effect(
    "a staged set is invisible to a same-turn read and visible after commit",
    () =>
      Effect.gen(function* () {
        const store = yield* makeContextStore({ context: { value: "old" } });

        yield* store.beginTurn;
        yield* store.setStaged(value, "new");

        // A same-turn read — the mechanism a `when:` guard uses — sees the
        // committed value, so the otherwise-branch would run, not the new one.
        const sameTurn = yield* store.get(value);
        expect(sameTurn).toBe("old");

        // The conductor commits at the turn boundary.
        yield* store.commitTurn;

        const nextTurn = yield* store.get(value);
        expect(nextTurn).toBe("new");
      }),
  );

  it.effect("a staged set does not leak into committed before the boundary", () =>
    Effect.gen(function* () {
      const store = yield* makeContextStore({ context: { value: "old" } });

      yield* store.beginTurn;
      yield* store.setStaged(value, "new");

      const committed = yield* store.committed;
      expect(committed).toEqual({ context: { value: "old" } });
    }),
  );
});
