import { describe, expect, it } from "vitest";
import { createActor, fromPromise } from "xstate";
import type { WelcomeResult } from "../../baml_client/types.ts";
import { skeleton } from "../ast/programs/skeleton.ts";
import { InferenceStub } from "../baml/inference.ts";
import { commitTurnEffect } from "../effect/turn.ts";
import { makeActorSystem } from "../xstate/actors.ts";

/**
 * Proves the XState layer (tasks 3.1–3.3): one full turn cycle, end to end,
 * with the inference stubbed (no model).
 *
 *   idle --USER_INPUT--> ingesting --> dispatching --(say)--> committing --> idle
 *
 * The headline assertion is that commitTurn fires exactly once, at the boundary
 * between the turn settling and the next turn — the single commit point (D3).
 * The said text surfaces as one OUTPUT event carrying the stub's typed message.
 */

const stub: WelcomeResult = {
  reasoning: "internal chain-of-thought",
  message: "Welcome! Let's explore quantum computing together.",
};

describe("conductor turn cycle (3.1–3.3)", () => {
  it("runs one full cycle, committing exactly once, emitting the said text", async () => {
    const { machine, runtime } = makeActorSystem(skeleton, InferenceStub(stub));

    // Wrap commitTurn to count boundary commits while still committing for real.
    let commitCount = 0;
    const instrumented = machine.provide({
      actors: {
        commitTurn: fromPromise<void>(async () => {
          commitCount += 1;
          await runtime.runPromise(commitTurnEffect);
        }),
      },
    });

    const outputs: string[] = [];
    const conductor = createActor(instrumented, { input: { program: skeleton } });
    conductor.on("OUTPUT", (event) => outputs.push(event.text));

    // Drive from the subscription: send input only once the conductor has
    // validated and reached its first idle (sending earlier, while it is still
    // in `validating`, would drop the unhandled event), then resolve at the
    // post-commit idle.
    let sent = false;
    const settled = new Promise<void>((resolve) => {
      conductor.subscribe((snapshot) => {
        if (snapshot.value !== "idle") return;
        if (!sent) {
          sent = true;
          conductor.send({ type: "USER_INPUT", text: "quantum computing" });
        } else if (commitCount >= 1) {
          resolve();
        }
      });
    });

    conductor.start();
    await settled;
    conductor.stop();

    expect(commitCount).toBe(1);
    expect(outputs).toEqual([stub.message]);
  });
});
