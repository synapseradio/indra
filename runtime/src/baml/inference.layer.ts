import { Effect, Layer } from "effect";
import { b, BamlValidationError } from "../../baml_client/index.ts";
import {
  InferenceParseError,
  ToolInvocationError,
} from "../effect/errors.ts";
import { Inference } from "./inference.ts";

/**
 * The live inference layer (task 4.3): wraps the BAML async client as the
 * Inference service. This is the one place a real model call is reachable, and
 * the only module that imports the BAML native binding.
 *
 * Error mapping honors S1: BAML's own validation/retry-exhaustion failure
 * becomes InferenceParseError (raised before any turn-boundary commit, so
 * nothing staged folds); any other throw becomes ToolInvocationError. Both are
 * tagged so the XState boundary can switch on `_tag`.
 *
 * Offline-core tests never construct this layer — they use InferenceStub. The
 * real call fires for the first time at task 5.2.
 */
export const InferenceLive: Layer.Layer<Inference> = Layer.succeed(Inference, {
  welcomeExplorer: (userInput) =>
    Effect.tryPromise({
      try: () => b.WelcomeExplorer(userInput),
      catch: (cause) =>
        cause instanceof BamlValidationError
          ? new InferenceParseError({ fn: "WelcomeExplorer", cause })
          : new ToolInvocationError({ tool: "WelcomeExplorer", cause }),
    }),
});
