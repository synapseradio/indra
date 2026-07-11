# inference-boundary

## Purpose

INDRA does not perform inference. A model is consulted at an external provider, and what crosses back into the program is prose no deterministic step can trust as it stands. `inference-boundary` owns that crossing: the one marked edge where a turn hands a request to an external model and receives a value back. It is the model edge, and validation belongs at the edge — this capability is the runtime counterpart to `program-validation`'s load-time gate. The boundary marshals the request with a declared output shape, validates the returned value against that shape, retries a parse failure, and fails the turn before the boundary commit when retries are exhausted, so no unvalidated value and no half-finished turn reaches committed state. Inference happens outside INDRA; the boundary is how INDRA admits its result safely.

## ADDED Requirements

### Requirement: An inference boundary returns a typed value validated at the edge

Each inference boundary SHALL be a typed function whose returned value is validated against a declared output shape before any step uses it. The runtime SHALL NOT parse free text for control information, and SHALL NOT require or read any role-resumption assertion. When validation fails, the runtime SHALL retry; when retries are exhausted, the turn SHALL fail with a tagged `InferenceParseError` raised before the boundary commit, so no staged write from the failed turn is folded into committed state.

#### Scenario: Validation exhaustion fails the turn before commit

- **WHEN** a returned value fails validation against the declared shape and every retry also fails
- **THEN** the turn fails with `InferenceParseError`
- **AND** writes staged earlier in that turn are discarded, not committed

#### Scenario: A validated value is used without a resumption assertion

- **WHEN** an inference boundary returns a value that validates against its declared shape
- **THEN** the typed value is used directly and execution continues without any role-resumption text

### Requirement: Output shapes are declared, not parsed from prose

Every inference boundary SHALL declare its output shape — a boolean for a gate, an enum for a closed choice, a class for a structured answer, or a list of a typed element — and the output-format instruction sent to the model SHALL be generated from the declared shape. Hand-written format prose, such as "respond with 'true' or 'false'", SHALL NOT define the contract.

#### Scenario: A boolean gate returns a bool

- **WHEN** a program gates a branch on an inference judgment
- **THEN** the boundary's declared return type is `bool` and the guard reads the typed value
