import type { Layer } from "effect";
import type { Program } from "../ast/types.ts";
import type { Inference } from "../baml/inference.ts";
import { type IndraRuntime, makeIndraRuntime } from "../effect/runtime.ts";
import { makeConductor, type ConductorMachine } from "./conductor.machine.ts";
import { makeIndraActor } from "./indra-actor.machine.ts";
import { makeLeaves } from "./leaves.ts";

/**
 * The assembly point that wires the three layers into one runnable system:
 * a ManagedRuntime over the program's initial world and a chosen inference
 * layer, the effectful leaves bound to it, the one registered `indraActor`
 * interpreter, and the conductor that dispatches it.
 *
 * The caller starts it with `createActor(machine, { input: { program } })`.
 * Tests pass `InferenceStub`; the live entrypoint passes `InferenceLive`.
 */
export interface ActorSystem {
  readonly machine: ConductorMachine;
  readonly runtime: IndraRuntime;
}

export const makeActorSystem = (
  program: Program,
  inference: Layer.Layer<Inference>,
): ActorSystem => {
  const runtime = makeIndraRuntime(program.initialContext, inference);
  const leaves = makeLeaves(runtime);
  const indraActor = makeIndraActor(leaves);
  const machine = makeConductor(leaves, indraActor);
  return { machine, runtime };
};
