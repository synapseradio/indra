import { Context, Effect, Layer } from "effect";
import type { WelcomeResult } from "../../baml_client/types.ts";
import type {
  InferenceParseError,
  ToolInvocationError,
} from "../effect/errors.ts";

/**
 * The inference service (D1, D3): the only non-deterministic leaf, behind the
 * same typed-error + DI treatment as the rest of the substrate. One method per
 * BAML function for the skeleton.
 *
 * This module imports only the WelcomeResult *type* (erased at runtime), so
 * resolving the tag or building a stub never loads the BAML native binding. The
 * live implementation that calls `b.*` lives in inference.layer.ts and is pulled
 * in only by the real entrypoint.
 *
 * Critically, every method returns a plain `WelcomeResult` value — inference
 * completes to a value BEFORE any STM transaction opens (invariant 3). The
 * service has no access to the store and cannot fold writes; it only produces
 * the typed result a turn then stages.
 */
export interface InferenceService {
  readonly welcomeExplorer: (
    userInput: string,
  ) => Effect.Effect<WelcomeResult, ToolInvocationError | InferenceParseError>;
}

export class Inference extends Context.Tag("Inference")<
  Inference,
  InferenceService
>() {}

/** A stub layer returning a fixed result — the offline-core substitute for the live client. */
export const InferenceStub = (
  result: WelcomeResult,
): Layer.Layer<Inference> =>
  Layer.succeed(Inference, {
    welcomeExplorer: () => Effect.succeed(result),
  });
