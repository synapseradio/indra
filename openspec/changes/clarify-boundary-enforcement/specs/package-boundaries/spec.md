## ADDED Requirements

### Requirement: The inward-only rule is enforced by the type build, not the test runner

The inward-only dependency rule SHALL be enforced by the composite type build: `tsc -b` resolves cross-package types through project references, and a package's tsconfig references only its declared inward dependencies, so an import that crosses the boundary outward SHALL fail the type build. The test-time module resolution SHALL NOT enforce the rule: the shared alias map resolves any `@indra/runtime-*` specifier to source wherever it appears, by design, so a passing offline test run SHALL NOT be read as evidence that the boundaries hold. Enforcement of the boundary belongs to `tsc -b` alone; the test runner is intentionally permissive so that tests run against source with no build step.

#### Scenario: An outward import fails the type build

- **WHEN** the core source imports from `@indra/runtime-choreography` and `tsc -b` runs from the repo root
- **THEN** the type build fails, because the core's tsconfig declares no project reference to the choreography

#### Scenario: The test alias map does not catch an outward import

- **WHEN** the same outward import is present and the offline test suite runs
- **THEN** the alias map resolves the specifier to source and the test does not fail on the boundary violation
- **AND** the violation is caught only by `tsc -b`, which the test phase does not replace

## MODIFIED Requirements

### Requirement: The core does not depend on the choreography

The deterministic executor — the world store, the turn evaluator, validation, and assembly — SHALL live in `@indra/runtime-core`, depending only on `@indra/runtime-contracts`. The XState conductor, actor machine, leaves, and events SHALL live in `@indra/runtime-choreography`, depending on `@indra/runtime-core` and `@indra/runtime-contracts`. The dependency SHALL run one way, from the choreography toward the core; the core SHALL NOT import the choreography. The rule is a structural fact of the type build: the core's tsconfig holds no project reference to the choreography, so an import in that direction does not compile.

#### Scenario: The core carries no edge to the choreography

- **WHEN** the core's resolved dependencies are inspected
- **THEN** `@indra/runtime-choreography` does not appear among them

#### Scenario: The choreography depends inward on the core

- **WHEN** the choreography package is built
- **THEN** it resolves the core and the contracts as dependencies
- **AND** its bridge to the core crosses through the single leaves module rather than reaching into the core's internals
