## ADDED Requirements

### Requirement: Every inference returns a typed value

Each inference point SHALL be a typed function whose return value is parsed and validated against a declared schema. The runtime SHALL NOT parse free text for control information, and SHALL NOT require or read any role-resumption assertion. When parsing fails, the runtime SHALL retry; when retries are exhausted, the turn SHALL fail with a tagged `InferenceParseError` raised before the boundary commit, so no staged write from the failed turn is folded into committed state.

#### Scenario: Parse exhaustion fails the turn before commit

- **WHEN** an inference call's output fails schema parsing and every retry also fails
- **THEN** the turn fails with `InferenceParseError`
- **AND** writes staged earlier in that turn are discarded, not committed

#### Scenario: No assertion is required to resume

- **WHEN** an inference call returns a value that parses against its schema
- **THEN** the typed value is used directly and execution continues without any role-resumption text

### Requirement: Inference output shapes are declared, not parsed from prose

Every inference function SHALL declare one of the typed output shapes: a boolean for gates, an enum for ratings or closed choices, a class for structured answers, or a list of a typed element. The output-format instruction SHALL be generated from the declared type; hand-written format prose (such as "respond with 'true' or 'false'") SHALL NOT define the contract.

#### Scenario: A boolean gate returns a bool

- **WHEN** a program gates a branch on an inference judgment
- **THEN** the inference function's declared return type is `bool` and the guard reads the typed value

### Requirement: Personas are data records, never actors

A persona SHALL be a `{identity, rules, understands}` data record with no actor lifecycle. Adopting a persona via `as:` SHALL select which record an inference call reads; it SHALL NOT spawn, activate, or otherwise drive an actor.

#### Scenario: Adopting a persona selects a record

- **WHEN** an inference call executes under `as: @skeptic`
- **THEN** the call is rendered with @skeptic's identity, rules, and understands as its system constraints
- **AND** no actor is spawned and no turn is taken by @skeptic

### Requirement: Typed inference leads with a reasoning field

Every structured inference output SHALL declare a free-form `reasoning` field first, so the model emits its reasoning tokens before committing the typed fields. Field emission SHALL follow declaration order.

#### Scenario: Reasoning precedes the typed value

- **WHEN** an inference function returns a class with `reasoning` declared first and `verdict` second
- **THEN** the model's output carries the reasoning text before the verdict value

### Requirement: Pure functions are host functions, and composition stays in the language

A `<...>` call whose semantics are a pure function — such as `count`, `has_content`, or `get_first` — SHALL be executed as a deterministic host function, never as an inference call. For genuine inference, the `select` field SHALL be the composition boundary: a turn keeps only the selected typed field, and discarded fields (such as `reasoning`) SHALL never reach program-visible state or output. Splice and back-reference composition over inference results SHALL remain expressible in the protocol language rather than migrating into host code.

#### Scenario: Counting a list is not an inference

- **WHEN** a program evaluates `<count>` over a list value
- **THEN** the runtime computes the count as a host function with no model call

#### Scenario: Discarded fields never reach program-visible state or output

- **WHEN** an inference returns `{reasoning, message}` and the call site selects `message`
- **THEN** only `message` is available to the program; `reasoning` is not written to state and not emitted as output
