import { makeActorSystem } from "@indra/runtime-choreography";
import type { ActorDef, ContextPath, Program } from "@indra/runtime-contracts";
import { ContextStoreTag, InferenceStub } from "@indra/runtime-core";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createActor } from "xstate";

/**
 * Task 3.2 — the `await:` terminator. Not exercised by the skeleton, so proven
 * here with a synthetic two-actor program: the parent delegates to a child, the
 * child returns a value, and that value lands in the parent's `store_in` path
 * after the turn-boundary commit.
 */

const childResult: ContextPath = { ns: "context", segments: ["child_result"] };

const parent: ActorDef = {
  id: "@parent",
  identity: "I delegate to a child and keep its result",
  rules: [],
  understands: [],
  perform: {
    method: "delegating",
    goal: "to capture a child's output",
    then: [
      {
        sets: [],
        terminator: {
          kind: "await",
          actor: "@child",
          withInput: { kind: "literal", value: {} },
          storeIn: childResult,
        },
      },
    ],
  },
};

const child: ActorDef = {
  id: "@child",
  identity: "I return a fixed result",
  rules: [],
  understands: [],
  perform: {
    method: "answering",
    goal: "to produce a value",
    then: [
      {
        sets: [],
        terminator: {
          kind: "return",
          output: { kind: "literal", value: "child-done" },
        },
      },
    ],
  },
};

const program: Program = {
  entry: "@parent",
  initialContext: {
    context: { child_result: "" },
    dialogue: {},
    user: {},
    signals: {},
  },
  actors: { "@parent": parent, "@child": child },
};

const stub = { reasoning: "unused", message: "unused" };

describe("await delegation (3.2)", () => {
  it("captures a child's return value into the parent's store_in path", async () => {
    const { machine, runtime } = makeActorSystem(program, InferenceStub(stub));
    const conductor = createActor(machine, { input: { program } });

    let sent = false;
    let cycles = 0;
    const settled = new Promise<void>((resolve) => {
      conductor.subscribe((snapshot) => {
        if (snapshot.value !== "idle") return;
        if (!sent) {
          sent = true;
          conductor.send({ type: "USER_INPUT", text: "go" });
        } else if (++cycles >= 1) {
          resolve();
        }
      });
    });

    conductor.start();
    await settled;
    conductor.stop();

    const stored = await runtime.runPromise(
      Effect.flatMap(ContextStoreTag, (store) => store.get(childResult)),
    );
    expect(stored).toBe("child-done");
  });
});
