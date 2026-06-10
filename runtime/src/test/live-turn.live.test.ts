import { describe, expect, it } from "vitest";
import { createActor } from "xstate";
import { skeleton } from "../ast/programs/skeleton.ts";
import { InferenceLive } from "../baml/inference.layer.ts";
import { makeActorSystem } from "../xstate/actors.ts";

/**
 * Proves task 5.2: the one edge the offline suite cannot reach — a real model
 * call. Everything else (the seams, the full conductor cycle) is already proven
 * against InferenceStub; this assembles the same system with InferenceLive and
 * drives exactly one turn, so a live typed WelcomeResult loads the BAML native
 * binding, returns through the real STM commit, and surfaces out the `say:` sink.
 *
 * Gated on ANTHROPIC_API_KEY: without a key it skips cleanly, so CI and the
 * default offline run never reach the network. It is excluded from the default
 * vitest run by config and only collected by `bun run test:live`.
 *
 * The text is non-deterministic, so the assertion is structural: exactly one
 * OUTPUT, non-empty, and the conductor settles back at `idle` rather than
 * `halted`. Reaching `idle` is the proof the live call succeeded and the typed
 * `message` flowed through the commit — a failed call would map to
 * InferenceParseError/ToolInvocationError and drive the machine to `halted`.
 */

describe.skipIf(!process.env["ANTHROPIC_API_KEY"])("live inference seam (5.2)", () => {
  it(
    "runs one full turn against the real model, emitting the said text",
    async () => {
      const { machine } = makeActorSystem(skeleton, InferenceLive);

      const outputs: string[] = [];
      const conductor = createActor(machine, { input: { program: skeleton } });
      conductor.on("OUTPUT", (event) => outputs.push(event.text));

      // Same drive as conductor-cycle.test.ts: send input only at the first
      // idle (sending while still `validating` would drop the event), then
      // resolve at the post-commit idle. Reject if the machine halts — a live
      // failure ends in the `halted` final state, not idle.
      let sent = false;
      const settled = new Promise<void>((resolve, reject) => {
        conductor.subscribe((snapshot) => {
          if (snapshot.value === "halted") {
            reject(new Error("conductor halted: live turn failed"));
            return;
          }
          if (snapshot.value !== "idle") return;
          if (!sent) {
            sent = true;
            conductor.send({ type: "USER_INPUT", text: "quantum computing" });
          } else {
            resolve();
          }
        });
      });

      conductor.start();
      await settled;
      conductor.stop();

      expect(outputs).toHaveLength(1);
      expect(outputs[0]).toBeTruthy();
      expect(typeof outputs[0]).toBe("string");
    },
    60000,
  );
});
