import type { ContextPath, Json } from "./types";

/**
 * The provisional contract shared between the core and the choreography.
 *
 * This contract is PROVISIONAL. The unbuilt `say:`-routing and `await:`-resume
 * seams will reshape it, so the package boundary that now separates the core
 * from the choreography must not be read as a frozen contract. This file is
 * expected to move as those seams are built.
 *
 * It carries two things: the turn-outcome leaf signature — the resolved end of
 * a turn that the core's `runTurn` leaf hands back to the choreography — and the
 * events that cross the choreography's boundaries.
 */

/** The resolved end of a turn handed back to the choreography layer. */
export type TurnOutcome =
  | { readonly kind: "say"; readonly to: string; readonly text: string }
  | {
      readonly kind: "await";
      readonly actor: string;
      readonly input: Json;
      readonly storeIn: ContextPath;
    }
  | { readonly kind: "return"; readonly output: Json };

/**
 * The events that cross the choreography boundaries.
 *
 * The conductor receives USER_INPUT from the host, and PASS_CONTROL / ACTOR_DONE
 * / ACTOR_ERROR from the actor it spawned. It emits OUTPUT to host subscribers
 * (the `say:` sink, resolved seam). The actor receives TURN to take its next
 * turn.
 */

/** From the host into the conductor. */
export type ConductorEvent =
  | { readonly type: "USER_INPUT"; readonly text: string }
  | {
      readonly type: "PASS_CONTROL";
      readonly to: string;
      readonly text: string;
    }
  | { readonly type: "ACTOR_DONE"; readonly output: Json }
  | { readonly type: "ACTOR_ERROR"; readonly error: unknown };

/** Emitted by the conductor to host subscribers (`actorRef.on("OUTPUT", …)`). */
export type OutputEvent = { readonly type: "OUTPUT"; readonly text: string };

/** From the conductor into a spawned actor. */
export type IndraActorEvent = { readonly type: "TURN" };
