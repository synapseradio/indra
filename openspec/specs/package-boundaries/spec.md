# package-boundaries

## Purpose

The `package-boundaries` capability defines how the INDRA runtime is decomposed into a Bun workspace of `@indra/runtime-*` packages and the dependency invariants that hold across the cuts. The contract package sits at the root and imports nothing; the deterministic core depends only on the contracts and never on the choreography; the choreography depends inward on the core through a single bridge; and the host is the sole composition root that assembles concrete adapters. Cross-package type dependencies are TypeScript project references, so the inward-only dependency rule is a structural fact the compiler enforces rather than a convention.

## Requirements

### Requirement: The runtime ships as a workspace of scoped packages

The runtime SHALL be decomposed into a Bun workspace of packages under a single `@indra/runtime-*` scope: `@indra/runtime-contracts`, `@indra/runtime-core`, `@indra/runtime-choreography`, `@indra/runtime-inference-baml`, and `@indra/runtime-host`. Each package SHALL declare its own manifest, and cross-package type dependencies SHALL be expressed as TypeScript project references so the declaration build orders correctly.

#### Scenario: The workspace resolves five runtime packages

- **WHEN** the workspace package graph is resolved
- **THEN** the five `@indra/runtime-*` packages are present, each with its own manifest
- **AND** each cross-package type dependency is a project reference to the dependency's source tsconfig

### Requirement: The contract package is the root of the dependency graph

`@indra/runtime-contracts` SHALL hold the Program/IR contract types (`Program`, `ActorDef`, `Branch`, `Terminator`, `ValueExpr`, `ContextPath`, the leaf `Json` shape), the error taxonomy, and the provisional core↔choreography contract. It SHALL depend on no other package in the workspace. Every other runtime package MAY depend on the contract package; the contract package SHALL depend on none of them.

#### Scenario: The contract package imports nothing from the workspace

- **WHEN** the contract package's resolved dependencies are inspected
- **THEN** no other workspace package appears among them
- **AND** a dependency cycle through the contract package is impossible by construction

#### Scenario: The error taxonomy resolves from the contract package

- **WHEN** a runtime package references an error type from the taxonomy
- **THEN** that type resolves from `@indra/runtime-contracts`, not from the core or any executor package

### Requirement: The core does not depend on the choreography

The deterministic executor — the world store, the turn evaluator, validation, and assembly — SHALL live in `@indra/runtime-core`, depending only on `@indra/runtime-contracts`. The XState conductor, actor machine, leaves, and events SHALL live in `@indra/runtime-choreography`, depending on `@indra/runtime-core` and `@indra/runtime-contracts`. The dependency SHALL run one way, from the choreography toward the core; the core SHALL NOT import the choreography. This makes the inward-only rule (today a comment, `runtime/ARCHITECTURE.md:45`) a structural fact.

#### Scenario: The core carries no edge to the choreography

- **WHEN** the core's resolved dependencies are inspected
- **THEN** `@indra/runtime-choreography` does not appear among them

#### Scenario: The choreography depends inward on the core

- **WHEN** the choreography package is built
- **THEN** it resolves the core and the contracts as dependencies
- **AND** its bridge to the core crosses through the single leaves module rather than reaching into the core's internals

### Requirement: The shared core-choreography contract lives in the contract package and is provisional

The contract shared between the core and the choreography — `TurnOutcome`, the events, and the leaf signatures — SHALL live in `@indra/runtime-contracts` and SHALL be documented as provisional, because the unbuilt `say:`-routing and `await:`-resume seams will reshape it. Freezing the package line SHALL NOT be read as freezing this contract.

#### Scenario: The shared contract resolves from contracts and is marked provisional

- **WHEN** the core or the choreography references `TurnOutcome`, an event, or a leaf signature
- **THEN** that type resolves from `@indra/runtime-contracts`
- **AND** the contract is marked provisional in the contract package

### Requirement: The host is the composition root

`@indra/runtime-host` SHALL be the composition root — the only package that imports a concrete adapter and assembles the runtime. The core, choreography, and contracts packages SHALL NOT import any concrete adapter. The host SHALL NOT be a command-line interface; it is the assembly point only.

#### Scenario: Only the host assembles concrete adapters

- **WHEN** the workspace is inspected for imports of a concrete adapter package
- **THEN** only `@indra/runtime-host` imports one
- **AND** the core, choreography, and contracts packages import none
