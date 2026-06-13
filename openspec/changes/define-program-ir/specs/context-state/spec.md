## ADDED Requirements

### Requirement: The namespace surface is closed

The context-path namespace set SHALL be exactly `&context`, `&user`, `&signals`, and `&result`. A path addressing any other namespace SHALL fail validation. `&dialogue` is not a member of the namespace surface: no program may address it, and any retained user-input ingestion write lands in `&user`, the namespace designated for user input. `&args` is likewise not a member: the namespace union declares it for the current signal and command arguments, but no runtime path reads or writes it, and signal arguments travel inside the signal payload object (`payload: {command, args}`) rather than through a context-path namespace. If signal dispatch later needs a namespace for in-flight arguments, that change reopens the question with a consumer in hand.

#### Scenario: A path addressing a removed namespace is rejected

- **WHEN** a Program references `&dialogue.latest_dialogue_entry` or `&args.command`
- **THEN** the path fails validation against the closed namespace set

#### Scenario: User-input ingestion writes no &dialogue entry

- **WHEN** user input is ingested by the runtime
- **THEN** no write targets a `&dialogue` namespace
- **AND** any ingestion write the runtime performs lands in `&user`

### Requirement: &result is a runtime-written, program-readable namespace

`&result` SHALL be a member of the namespace surface, written only by the runtime and readable by programs. It is the destination for an awaited return that carries no `store_in:` target, so the `store_in`-absent case has a defined landing place.

#### Scenario: &result is addressable by programs

- **WHEN** a Program references `&result` in a guard or interpolation
- **THEN** the path validates against the closed namespace set and reads the runtime-written value

## MODIFIED Requirements

### Requirement: Protected namespaces reject program writes

A `set:` targeting `&user`, `&signals`, or `&result` SHALL be rejected with a read-only violation error before any state cell is modified. These namespaces are written only by the runtime. When the violating target is literal program data, the rejection SHALL occur at load-time validation; the commit-time check remains for any write not statically decidable.

#### Scenario: Writing to &user is rejected

- **WHEN** a program attempts `set: &user.latest = "x"`
- **THEN** the runtime raises a read-only violation error and `&user` is unchanged

#### Scenario: Writing to &result is rejected

- **WHEN** a program attempts `set: &result = "x"`
- **THEN** the runtime raises a read-only violation error and `&result` is unchanged
