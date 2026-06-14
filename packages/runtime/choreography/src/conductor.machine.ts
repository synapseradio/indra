import type { Json, Program } from "@indra/runtime-contracts";
import { type AnyActorRef, assign, emit, sendTo, setup } from "xstate";
import type { IndraActorMachine } from "./indra-actor.machine";
import type { Leaves } from "./leaves";

/**
 * The conductor (task 3.1): holds the turn baton and owns the single commit
 * boundary. It validates the initial context once, spawns the entry actor as a
 * registered `indraActor` (D10 dispatch shape), and then loops:
 *
 *   idle --USER_INPUT--> ingesting --> dispatching --PASS_CONTROL/ACTOR_DONE-->
 *   committing --> idle
 *
 * The commit happens in exactly one place, `committing`, between one turn
 * settling and the next dispatching — so "staged writes become visible next
 * turn" (D3) is literally true. The `say:` text arrives as PASS_CONTROL and is
 * re-emitted as a host-observable OUTPUT event (resolved seam).
 */
export interface ConductorContext {
  program: Program;
  entryRef: AnyActorRef | null;
}

export const makeConductor = (leaves: Leaves, indraActor: IndraActorMachine) =>
  setup({
    types: {
      input: {} as { program: Program },
      context: {} as ConductorContext,
      events: {} as
        | { type: "USER_INPUT"; text: string }
        | { type: "PASS_CONTROL"; to: string; text: string }
        | { type: "ACTOR_DONE"; output: Json }
        | { type: "ACTOR_ERROR"; error: unknown },
      emitted: {} as { type: "OUTPUT"; text: string },
    },
    actors: {
      validateInitial: leaves.validateInitial,
      ingestUserInput: leaves.ingestUserInput,
      commitTurn: leaves.commitTurn,
      indraActor,
    },
  }).createMachine({
    id: "conductor",
    context: ({ input }) => ({ program: input.program, entryRef: null }),
    initial: "validating",
    states: {
      validating: {
        invoke: {
          src: "validateInitial",
          input: ({ context }) => context.program,
          onDone: "spawning",
          onError: "halted",
        },
      },

      spawning: {
        entry: assign({
          entryRef: ({ context, spawn }) => {
            const blueprint = context.program.actors[context.program.entry];
            if (blueprint === undefined) return null;
            return spawn("indraActor", {
              input: { blueprint, actors: context.program.actors },
              systemId: context.program.entry,
            });
          },
        }),
        always: [
          { guard: ({ context }) => context.entryRef !== null, target: "idle" },
          { target: "halted" },
        ],
      },

      idle: {
        on: { USER_INPUT: "ingesting" },
      },

      ingesting: {
        invoke: {
          src: "ingestUserInput",
          input: ({ event }) =>
            (event as { type: "USER_INPUT"; text: string }).text,
          onDone: "dispatching",
          onError: "halted",
        },
      },

      dispatching: {
        entry: sendTo(({ context }) => context.entryRef!, { type: "TURN" }),
        on: {
          PASS_CONTROL: {
            target: "committing",
            actions: emit(({ event }) => ({
              type: "OUTPUT",
              text: event.text,
            })),
          },
          ACTOR_DONE: "committing",
          ACTOR_ERROR: "halted",
        },
      },

      committing: {
        invoke: {
          src: "commitTurn",
          onDone: "idle",
          onError: "halted",
        },
      },

      halted: { type: "final" },
    },
  });

export type ConductorMachine = ReturnType<typeof makeConductor>;
