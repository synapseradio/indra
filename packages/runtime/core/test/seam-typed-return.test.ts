import { describe, expect, it } from "@effect/vitest";
import type { ContextPath } from "@indra/runtime-contracts";
import type { WelcomeResult } from "@indra/runtime-core";
import {
  getAt,
  Inference,
  InferenceStub,
  makeContextStore,
} from "@indra/runtime-core";
import { Effect } from "effect";

/**
 * Seam 6.4 — D4 typed return.
 *
 * The inference function returns a typed object, not free text. The turn keeps
 * only the typed `message` field (the AST's `select`), stages it, and commits —
 * no string parsing anywhere. The leading `reasoning` field (D8), which exists
 * only to draw out chain-of-thought tokens, is discarded and must never reach
 * the world.
 *
 * This drives the stub Inference layer (offline), so no model is called.
 */

const lastMessage: ContextPath = { ns: "context", segments: ["last_message"] };

const stub: WelcomeResult = {
  reasoning: "INTERNAL_COT_THAT_MUST_NOT_PERSIST",
  message: "Welcome! What would you like to explore?",
};

describe("typed return (6.4, D4)", () => {
  it.effect(
    "the typed message lands in &context and reasoning does not leak",
    () =>
      Effect.gen(function* () {
        const inference = yield* Inference;
        const store = yield* makeContextStore({
          context: { last_message: "" },
        });

        // Exactly what the interpreter does for an inference-valued set with
        // select:"message" — read a typed field, never parse a string.
        const result = yield* inference.welcomeExplorer("quantum computing");
        yield* store.beginTurn;
        yield* store.setStaged(lastMessage, result.message);
        yield* store.commitTurn;

        const world = yield* store.committed;
        expect(getAt(world, lastMessage)).toBe(stub.message);

        // The reasoning field never enters the world by any path.
        expect(JSON.stringify(world)).not.toContain(stub.reasoning);
        expect(
          getAt(world, { ns: "context", segments: ["reasoning"] }),
        ).toBeUndefined();
      }).pipe(Effect.provide(InferenceStub(stub))),
  );

  it.effect(
    "the stub returns a structurally typed result, not parsed text",
    () =>
      Effect.gen(function* () {
        const inference = yield* Inference;
        const result = yield* inference.welcomeExplorer("anything");
        expect(typeof result.message).toBe("string");
        expect(typeof result.reasoning).toBe("string");
      }).pipe(Effect.provide(InferenceStub(stub))),
  );
});
