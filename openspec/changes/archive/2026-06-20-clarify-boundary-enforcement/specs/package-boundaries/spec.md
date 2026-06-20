## ADDED Requirements

### Requirement: Dependency direction is enforced by the type build, not the test runner

Each package's tsconfig SHALL reference only the packages it declares as dependencies, and the composite type build (`tsc -b`) SHALL resolve cross-package types solely through those references, so an import to a package outside a package's declared dependencies SHALL fail the type build. Test-time module resolution SHALL NOT enforce this rule: an alias map that rewrites every cross-package specifier to source resolves a boundary-crossing import as readily as a permitted one, so a passing offline test run SHALL NOT be read as evidence that the boundaries hold. Enforcement belongs to the type build alone; the test runner is intentionally permissive so that tests run against source with no build step.

#### Scenario: An outward import fails the type build

- **WHEN** a package imports another it does not declare as a dependency and `tsc -b` runs from the repo root
- **THEN** the type build fails, because that package's tsconfig references no such project

#### Scenario: The test alias map does not catch the outward import

- **WHEN** the same import is present and the offline test suite runs
- **THEN** the alias map resolves the specifier to source and the test does not fail on the boundary violation
- **AND** the violation is caught only by `tsc -b`, which the test phase does not replace

## MODIFIED Requirements

### Requirement: The core does not depend on the choreography

The deterministic executor — the world store, the turn evaluator, validation, and assembly — SHALL live in `@indra/runtime-core`, depending only on `@indra/runtime-contracts`. The XState conductor, actor machine, leaves, and events SHALL live in `@indra/runtime-choreography`, depending on `@indra/runtime-core` and `@indra/runtime-contracts`. The dependency SHALL run one way, from the choreography toward the core; the core SHALL NOT import the choreography.

#### Scenario: The core carries no edge to the choreography

- **WHEN** the core's resolved dependencies are inspected
- **THEN** `@indra/runtime-choreography` does not appear among them

#### Scenario: The choreography depends inward on the core

- **WHEN** the choreography package is built
- **THEN** it resolves the core and the contracts as dependencies
- **AND** its bridge to the core crosses through the single leaves module rather than reaching into the core's internals
