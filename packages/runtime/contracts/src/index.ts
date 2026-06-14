/**
 * @indra/runtime-contracts — the root of the dependency graph.
 *
 * The Program/IR types every front-end compiles to, the runtime's error
 * taxonomy, and the provisional core↔choreography contract. This package
 * imports no other workspace package; everything else may depend on it.
 */

export * from "./choreography-contract";
export * from "./errors";
export * from "./types";
