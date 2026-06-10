import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import type { Program } from "../ast/types.ts";
import { explore, skeleton } from "../ast/programs/skeleton.ts";
import {
  findUninitializedContextPaths,
  referencedContextPaths,
  validateInitialState,
} from "../effect/initial-state.ts";

/**
 * Task 2.5 — strict initial-context validation. Pure assertions against the
 * skeleton AST plus a deliberately broken variant that drops an initializer.
 */

describe("initial-state validation (2.5)", () => {
  it("traces the &context paths the program references", () => {
    // The skeleton's only &context reference is the `set:` target.
    expect(referencedContextPaths(skeleton)).toEqual(["&context.query"]);
  });

  it("reports nothing uninitialized for the fully initialized skeleton", () => {
    expect(findUninitializedContextPaths(skeleton)).toEqual([]);
  });

  it.effect("validation of the skeleton succeeds", () =>
    validateInitialState(skeleton),
  );

  it.effect("a referenced-but-uninitialized path halts with the missing path named", () =>
    Effect.gen(function* () {
      // Same program, but the root `with:` block forgets to initialize `query`.
      const broken: Program = {
        ...skeleton,
        initialContext: {
          context: { explore: { exploration_style: "balanced" } },
          dialogue: { latest_dialogue_entry: "" },
          user: { latest: "", history: [] },
          signals: {},
        },
        actors: { "@explore": explore },
      };

      const result = yield* Effect.either(validateInitialState(broken));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("IncompleteInitialStateError");
        expect(result.left.missingPath).toBe("&context.query");
      }
    }),
  );
});
