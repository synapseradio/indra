## Why

The `module-resolution` capability turns its central guarantees on a term it never defines. Deduplication is "keyed by canonical absolute path," but "canonical path" is left to the reader: on a case-insensitive filesystem — the default on the stated development platform — it is undecided whether `Lib.in` and `lib.in` are the same file, and whether two symlinks to one file inline once or twice. The dedup-and-cycle guarantee is exactly as strong as that undefined word.

Two more edges are implied but unstated. The spec deduplicates inlining by path while letting each import carry its own `use` clause, but never says which wins when the same file is imported twice with different `use` clauses — the natural reading of "binding the already-resolved components" wrongly suggests the first site's narrowing leaks to the second. And the visited set conflates "in progress on the current resolution stack" (a real cycle) with "already fully resolved" (a benign diamond), though only the first is a fatal error.

This change defines the term and closes the two edges. It is a clarification of resolution semantics; it does not commit to any particular surface syntax for imports.

## What Changes

- Define **canonical path**: symlinks resolved to their target, the path normalized and made absolute, and case folded according to the filesystem's case sensitivity, so that two specifiers naming the same underlying file always canonicalize equal.
- State that inlining is deduplicated by canonical path while **`use` narrowing is applied per import site** against the single inlined definition, so a second import of the same file with a different `use` clause binds its own listed symbols.
- Distinguish, in the visited set, a file **in progress on the current resolution stack** (a cycle, fatal) from a file **already fully resolved** (a diamond, a no-op dedup).

## Capabilities

### Modified Capabilities

- `module-resolution`: define canonical path; apply `use` narrowing per import site; split the visited set's in-progress and resolved states for cycle detection.

## Impact

- Pins behavior on case-insensitive filesystems and across symlinks, which the current spec leaves implementation-defined.
- Removes the ambiguity an implementer hits when the same file is imported twice with different `use` clauses.
- No change to the happy paths the capability already specifies (transitive deepest-first resolution, diamond inlines once, cycle is fatal).
