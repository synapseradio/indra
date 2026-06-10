import {
  type AnyActorRef,
  type AnyStateMachine,
  assign,
  sendParent,
  sendTo,
  setup,
} from "xstate";
import type { ActorDef, Json } from "../ast/types.ts";
import type { TurnOutcome } from "../effect/turn.ts";
import type { Leaves } from "./leaves.ts";

/**
 * The one generic INDRA-actor interpreter (D10). Every INDRA actor is this same
 * registered machine, parameterized by its definition passed as serializable
 * `input`. There are no per-actor machines; the statechart structure that
 * varies lives in the AST, not in N hand-authored charts.
 *
 * A turn is: run the deterministic evaluation (the `runTurn` leaf), then take
 * one of the three terminators (S2):
 *   say    -> idle, hand control back to the conductor (PASS_CONTROL).
 *   return -> final state carrying the output (ACTOR_DONE to the parent).
 *   await  -> spawn a child interpreter, capture its output into `store_in`,
 *             then end the turn. Present and tested but unused by the skeleton.
 *
 * The actor persists across turns: after `say` it idles and re-runs on the next
 * TURN, so it is spawned (not invoked) and kept in conductor context.
 */
interface IndraActorInput {
  readonly blueprint: ActorDef;
  readonly actors: Record<string, ActorDef>;
}

interface IndraActorContext {
  blueprint: ActorDef;
  actors: Record<string, ActorDef>;
  returnOutput: Json;
  pending: Extract<TurnOutcome, { kind: "await" }> | null;
  childResult: Json;
  child: AnyActorRef | null;
}

type IndraActorEvents =
  | { readonly type: "TURN" }
  | { readonly type: "ACTOR_DONE"; readonly output: Json }
  | { readonly type: "ACTOR_ERROR"; readonly error: unknown };

export const makeIndraActor = (leaves: Leaves) => {
  // Typed as AnyStateMachine to break the self-reference cycle: the child the
  // `await:` path spawns is this same machine, resolved at action time.
  let self: AnyStateMachine;

  const machine = setup({
      types: {
        input: {} as IndraActorInput,
        context: {} as IndraActorContext,
        output: {} as { output: Json },
        events: {} as IndraActorEvents,
      },
      actors: {
        runTurn: leaves.runTurn,
        stageValue: leaves.stageValue,
      },
    }).createMachine({
      id: "indraActor",
      context: ({ input }) => ({
        blueprint: input.blueprint,
        actors: input.actors,
        returnOutput: null,
        pending: null,
        childResult: null,
        child: null,
      }),
      // Starts idle: a turn runs only when the conductor dispatches TURN, never
      // automatically at spawn — so the first turn sees ingested user input.
      initial: "idle",
      states: {
        running: {
          invoke: {
            src: "runTurn",
            input: ({ context }) => context.blueprint,
            onDone: [
              {
                guard: ({ event }) => event.output.kind === "say",
                target: "idle",
                actions: sendParent(({ event }) => {
                  const outcome = event.output as Extract<
                    TurnOutcome,
                    { kind: "say" }
                  >;
                  return {
                    type: "PASS_CONTROL" as const,
                    to: outcome.to,
                    text: outcome.text,
                  };
                }),
              },
              {
                guard: ({ event }) => event.output.kind === "await",
                target: "awaiting",
                actions: assign({
                  pending: ({ event }) =>
                    event.output as Extract<TurnOutcome, { kind: "await" }>,
                }),
              },
              {
                // return (the remaining terminator)
                target: "returned",
                actions: assign({
                  returnOutput: ({ event }) =>
                    (event.output as Extract<TurnOutcome, { kind: "return" }>)
                      .output,
                }),
              },
            ],
            onError: {
              target: "failed",
              actions: sendParent(({ event }) => ({
                type: "ACTOR_ERROR" as const,
                error: event.error,
              })),
            },
          },
        },

        idle: {
          on: { TURN: "running" },
        },

        awaiting: {
          // Spawn the awaited target as a child interpreter and dispatch its
          // turn — children start idle like any interpreter, so they run only
          // when handed a TURN.
          entry: [
            assign({
              child: ({ context, spawn }) => {
                const target = context.pending?.actor ?? "";
                const blueprint = context.actors[target];
                if (blueprint === undefined) return null;
                return spawn(self, {
                  input: { blueprint, actors: context.actors },
                });
              },
            }),
            sendTo(({ context }) => context.child!, { type: "TURN" }),
          ],
          on: {
            ACTOR_DONE: {
              target: "storing",
              actions: assign({ childResult: ({ event }) => event.output }),
            },
            ACTOR_ERROR: {
              target: "failed",
              actions: sendParent(({ event }) => ({
                type: "ACTOR_ERROR" as const,
                error: event.error,
              })),
            },
          },
        },

        storing: {
          invoke: {
            src: "stageValue",
            input: ({ context }) => ({
              path: context.pending!.storeIn,
              value: context.childResult,
            }),
            onDone: {
              target: "returned",
              actions: assign({
                returnOutput: ({ context }) => context.childResult,
              }),
            },
            onError: {
              target: "failed",
              actions: sendParent(({ event }) => ({
                type: "ACTOR_ERROR" as const,
                error: event.error,
              })),
            },
          },
        },

        returned: {
          type: "final",
          entry: sendParent(({ context }) => ({
            type: "ACTOR_DONE" as const,
            output: context.returnOutput,
          })),
        },

        failed: { type: "final" },
      },
      output: ({ context }) => ({ output: context.returnOutput }),
    });

  self = machine;
  return machine;
};

export type IndraActorMachine = ReturnType<typeof makeIndraActor>;
