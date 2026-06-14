## ADDED Requirements

### Requirement: The inference port is owned by the core, not the adapter

The `Inference` tag, its service interface, and the offline stub SHALL live in `@indra/runtime-core` as a first-class module, not inside an adapter directory. An inference adapter SHALL depend on the core to obtain the port and provide a `Layer` that implements it. The core SHALL NOT depend on any inference adapter package, and it SHALL typecheck without running the adapter's codegen.

#### Scenario: The core does not depend on an inference adapter

- **WHEN** the core's resolved dependencies are inspected
- **THEN** no inference adapter package appears among them

#### Scenario: An adapter depends inward on the port

- **WHEN** an inference adapter package is built
- **THEN** it imports the `Inference` port from the core
- **AND** it exposes a `Layer` implementing that port

### Requirement: The BAML binding is isolated to the adapter package

Only `@indra/runtime-inference-baml` SHALL depend on the `@boundaryml/baml` binding, and only that package SHALL run BAML codegen. The codegen output directory and the `baml_client/` ignore entry SHALL live inside the adapter so generation never writes into the core's tree.

#### Scenario: The adapter is the sole BAML dependant

- **WHEN** the workspace is inspected for the `@boundaryml/baml` dependency
- **THEN** only `@indra/runtime-inference-baml` declares it
- **AND** BAML codegen writes only inside the adapter package

### Requirement: The inference result shapes are owned by the contract package

The inference result types the port returns — including `WelcomeResult` — SHALL live in `@indra/runtime-contracts`. The port SHALL import the result shape from the contract package, not from the adapter's generated `baml_client` directory. No package SHALL type-depend on the gitignored generated directory to obtain a result shape.

#### Scenario: The result shape resolves from contracts

- **WHEN** the port or a test references `WelcomeResult`
- **THEN** it resolves from `@indra/runtime-contracts`
- **AND** no import of the result shape reaches into the adapter's generated `baml_client` directory

### Requirement: The offline runtime runs without an inference binding

The core's offline test suite SHALL resolve inference through the stub port and SHALL carry no dependency on `@boundaryml/baml`. Only a package that supplies a live inference adapter SHALL depend on that binding.

#### Scenario: Offline tests carry no BAML dependency

- **WHEN** the core is built and its offline suite runs
- **THEN** `@boundaryml/baml` is absent from the core's resolved dependencies
- **AND** every inference call in the suite resolves through the stub port
