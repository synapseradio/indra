import type { ContextPath, Json, Namespace, World } from "../ast/types.ts";

/**
 * Pure path machinery over the namespaced world. No Effect, no STM — these are
 * the read/write primitives the store composes inside its transactions, kept
 * separate so they stay trivially testable and so the read-only guard lives in
 * one place.
 */

/** Render a path for messages and as a patch key, e.g. `&context.tree.mode`. */
export const pathToString = (path: ContextPath): string =>
  path.segments.length === 0
    ? `&${path.ns}`
    : `&${path.ns}.${path.segments.join(".")}`;

/**
 * The namespaces a program may not write. `&user` and `&signals` are written
 * only through the runtime-privileged path; a program `set:` to either is a
 * ReadOnlyViolationError (task 2.3, spec: protected namespaces).
 */
export const isReadOnly = (ns: Namespace): boolean =>
  ns === "user" || ns === "signals";

const isRecord = (v: Json | undefined): v is { readonly [k: string]: Json } =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Resolve a path against a world. Returns `undefined` if any segment is absent.
 * The namespace is the first lookup key (`world[ns]`), then each segment in
 * turn.
 */
export const getAt = (world: World, path: ContextPath): Json | undefined => {
  let current: Json | undefined = world[path.ns];
  for (const segment of path.segments) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
};

/**
 * Return a new world with `value` written at `path`. Immutable: every object
 * along the path is copied, so the input world is never mutated and STM holds a
 * stable snapshot. Intermediate non-objects along the path are replaced with
 * fresh objects.
 */
export const setAt = (world: World, path: ContextPath, value: Json): World => {
  const writeInto = (node: Json | undefined, depth: number): Json => {
    if (depth === path.segments.length) return value;
    const segment = path.segments[depth]!;
    const base = isRecord(node) ? node : {};
    return { ...base, [segment]: writeInto(base[segment], depth + 1) };
  };
  // depth 0 writes into the namespace object held at world[ns].
  const nsNode = world[path.ns];
  if (path.segments.length === 0) {
    return { ...world, [path.ns]: value };
  }
  return { ...world, [path.ns]: writeInto(nsNode, 0) };
};
