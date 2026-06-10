import { Data } from "effect";

/**
 * The runtime's typed error taxonomy (D1). Each is a `Data.TaggedError`, so a
 * value carries a literal `_tag` the XState boundary can switch on after the
 * error collapses to a rejected Promise (the Effect<->XState impedance
 * mitigation).
 */

/**
 * A `&context` path is referenced by the program but the root `with:` block
 * never initialized it. Fatal: the runtime halts before turn one (S-validation,
 * task 2.5). There is no global context to inherit a default from.
 */
export class IncompleteInitialStateError extends Data.TaggedError(
  "IncompleteInitialStateError",
)<{
  readonly missingPath: string;
}> {}

/**
 * A program `set:` targeted a read-only namespace (`&user` or `&signals`).
 * Raised before any cell is touched (task 2.3).
 */
export class ReadOnlyViolationError extends Data.TaggedError(
  "ReadOnlyViolationError",
)<{
  readonly path: string;
  readonly namespace: string;
}> {}

/**
 * A tool/inference invocation threw. Wraps the underlying cause so the turn can
 * fail with a tagged value rather than an opaque rejection (task 4.3).
 */
export class ToolInvocationError extends Data.TaggedError(
  "ToolInvocationError",
)<{
  readonly tool: string;
  readonly cause: unknown;
}> {}

/**
 * BAML retries were exhausted and the typed result never parsed (S1). Raised
 * before the turn-boundary commit, so nothing staged folds.
 */
export class InferenceParseError extends Data.TaggedError(
  "InferenceParseError",
)<{
  readonly fn: string;
  readonly cause: unknown;
}> {}

/** The closed union of errors the runtime raises. */
export type IndraError =
  | IncompleteInitialStateError
  | ReadOnlyViolationError
  | ToolInvocationError
  | InferenceParseError;
