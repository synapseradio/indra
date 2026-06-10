import type { Json } from "../ast/types.ts";

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
  | { readonly type: "PASS_CONTROL"; readonly to: string; readonly text: string }
  | { readonly type: "ACTOR_DONE"; readonly output: Json }
  | { readonly type: "ACTOR_ERROR"; readonly error: unknown };

/** Emitted by the conductor to host subscribers (`actorRef.on("OUTPUT", …)`). */
export type OutputEvent = { readonly type: "OUTPUT"; readonly text: string };

/** From the conductor into a spawned actor. */
export type IndraActorEvent = { readonly type: "TURN" };
