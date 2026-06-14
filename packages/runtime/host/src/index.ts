import { createInterface } from "node:readline";
import { makeActorSystem } from "@indra/runtime-choreography";
import { skeleton } from "@indra/runtime-core";
import { InferenceLive } from "@indra/runtime-core/inference-live";
import { createActor } from "xstate";

/**
 * The live entrypoint. Assembles the actor system over the skeleton program
 * with the real Anthropic-backed inference layer, prints the `say:` sink
 * (OUTPUT) to stdout, and feeds stdin lines in as USER_INPUT.
 *
 * Running this fires real model calls and needs ANTHROPIC_API_KEY; the first
 * live end-to-end run is task 5.2. The offline core never imports this module —
 * its tests assemble the system with a stub inference layer instead.
 */
export const start = (): void => {
  const { machine } = makeActorSystem(skeleton, InferenceLive);
  const conductor = createActor(machine, { input: { program: skeleton } });

  conductor.on("OUTPUT", (event) => {
    process.stdout.write(`\n${event.text}\n\n`);
  });

  conductor.start();

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.on("line", (line) => {
    conductor.send({ type: "USER_INPUT", text: line });
  });
};

if ((import.meta as { main?: boolean }).main) {
  start();
}
