## ADDED Requirements

### Requirement: Inference functions are resolved through a host-supplied registry

The runtime SHALL dispatch every inference call through a registry keyed by function name, supplied by the host and bound at load time. The IR carries only the string name; the registry carries the behavior. An inference reference that does not resolve against the registry SHALL be a load-time validation error, not a call-time invocation error. The registry SHALL hold only non-deterministic, host-bound leaves: deterministic pure functions remain runtime builtins outside any registry.

#### Scenario: Dispatch is a registry lookup, not a name check

- **WHEN** a turn evaluates an inference call referencing function `"WelcomeExplorer"`
- **THEN** the implementation invoked is the registry's binding for that name
- **AND** no hand-coded comparison against a known function name decides dispatch

#### Scenario: Stub and live bindings are interchangeable per host

- **WHEN** a test host binds a referenced function name to a deterministic stub and a production host binds the same name to a live model call
- **THEN** the same Program document runs on both hosts without modification
