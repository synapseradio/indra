## ADDED Requirements

### Requirement: An inference point holds a direct typed function reference

An inference point SHALL reference the inference function it calls directly, as a typed function value the program holds, not as a string name resolved through a host registry at load. The call SHALL carry typed input, and where it narrows the result it SHALL select a field by a key of the result's declared type. An inference reference that names no real function SHALL be a TypeScript error at author time, never a runtime lookup that misses.

#### Scenario: An unbound inference reference is a type error, not a runtime miss

- **WHEN** an actor's turn logic references an inference function that does not exist
- **THEN** the program fails to typecheck at author time
- **AND** no load-time name resolution and no call-time invocation error is involved

#### Scenario: The same actor runs against a stub or a live function by substitution

- **WHEN** a test supplies a stub inference function and production supplies the live one
- **THEN** the actor holds whichever typed function it is given, and the choice is made in TypeScript rather than by binding a name through a registry

## MODIFIED Requirements

### Requirement: Pure functions are host functions, and composition stays in the language

Pure functions whose semantics are deterministic — such as counting a list or testing a value for content — SHALL be runtime builtins, never inference calls. For genuine inference, the selection of one field SHALL be the composition boundary: a turn keeps only the selected typed field, and discarded fields such as a reasoning field SHALL never reach program-visible state or output. Composition over inference results — splicing, back-referencing, combining several results — SHALL stay in the framework's TypeScript turn logic, never migrating below the inference leaf.

#### Scenario: Counting a list is a builtin, not an inference

- **WHEN** a program counts the elements of a list value
- **THEN** the runtime computes the count as a deterministic builtin with no model call

#### Scenario: Discarded fields never reach program-visible state or output

- **WHEN** an inference returns a structured result and the call selects one field
- **THEN** only the selected field is available to the program, and the discarded fields are neither written to state nor emitted
