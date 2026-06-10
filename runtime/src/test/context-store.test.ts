import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import type { ContextPath } from "../ast/types.ts";
import { makeContextStore } from "../effect/context-store.ts";

/**
 * Store-level requirements that are not one of the four headline seams but are
 * still load-bearing: the read-only namespace guard (task 2.3) and the
 * sequence-vs-staged same-path precedence (S3).
 */

const userLatest: ContextPath = { ns: "user", segments: ["latest"] };
const signalsX: ContextPath = { ns: "signals", segments: ["x"] };
const collide: ContextPath = { ns: "context", segments: ["collide"] };

describe("read-only namespace guard (2.3)", () => {
  it.effect("a staged set to &user is rejected and leaves &user unchanged", () =>
    Effect.gen(function* () {
      const store = yield* makeContextStore({
        user: { latest: "untouched" },
        context: {},
      });

      const result = yield* Effect.either(store.setStaged(userLatest, "x"));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("ReadOnlyViolationError");
        expect(result.left.namespace).toBe("user");
      }

      const after = yield* store.get(userLatest);
      expect(after).toBe("untouched");
    }),
  );

  it.effect("a sequence set to &signals is rejected", () =>
    Effect.gen(function* () {
      const store = yield* makeContextStore({ signals: {}, context: {} });

      const result = yield* Effect.either(store.setImmediate(signalsX, 1));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("ReadOnlyViolationError");
      }
    }),
  );

  it.effect("the runtime-privileged path may write &user", () =>
    Effect.gen(function* () {
      const store = yield* makeContextStore({ user: { latest: "" }, context: {} });

      yield* store.setPrivileged(userLatest, "ingested");
      const after = yield* store.get(userLatest);
      expect(after).toBe("ingested");
    }),
  );
});

describe("sequence-vs-staged precedence (S3)", () => {
  it.effect("a staged write wins over a sequence write to the same path at commit", () =>
    Effect.gen(function* () {
      const store = yield* makeContextStore({ context: { collide: "initial" } });

      yield* store.beginTurn;
      yield* store.setImmediate(collide, "from-sequence");
      yield* store.setStaged(collide, "from-staged");
      yield* store.commitTurn;

      const committed = yield* store.get(collide);
      expect(committed).toBe("from-staged");
    }),
  );
});
