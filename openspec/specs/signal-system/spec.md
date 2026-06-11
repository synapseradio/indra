# signal-system

## Purpose

The `signal-system` capability owns how the INDRA runtime receives and processes signals. Actor `emit:` actions and user `*commands` alike are delivered to a mailbox and observed only at turn boundaries, which keeps signal handling compatible with parallel actors. User `*commands` translate into standard signal objects, and every user input classifies as exactly one of a signal, an awaited response, or an interjection. Signal payloads carrying an `instruction` execute only as a restricted parseable subset with no terminators and no host-language evaluation. The runtime alone writes the `&signals` namespace, recording every handled signal. The `*trace` toggle controls diagnostic visibility only, never control flow, and `*help` routes deterministically through declared handlers with a global fallback.

## Requirements

### Requirement: Signals are mailbox-delivered and observed at turn boundaries

Signals — actor `emit:` actions and user `*commands` alike — SHALL be delivered to a mailbox and observed at turn boundaries. The runtime SHALL NOT preempt a turn mid-execution to handle a signal. This discipline is what keeps signal handling compatible with parallel actors: each actor is internally sequential, and signals interleave only between turns.

#### Scenario: A signal arriving mid-turn waits for the boundary

- **WHEN** a signal is emitted while an actor's turn is executing
- **THEN** the turn runs to its settling action uninterrupted
- **AND** the signal is processed at the turn boundary before the next turn dispatches

### Requirement: User commands translate to standard signal objects

User input beginning with `*` SHALL be translated into a standard signal object `{id, source, payload}` before processing. For example, `*trace on` becomes `{id: 'user_command', source: 'user', payload: {command: 'trace', args: ['on']}}`.

#### Scenario: A star command becomes a signal

- **WHEN** the user enters `*trace on`
- **THEN** the runtime processes a signal with id `user_command`, source `user`, and payload `{command: 'trace', args: ['on']}`

### Requirement: User input is classified into three modes

The runtime SHALL classify every user input as exactly one of: a signal (input beginning with `*`), an awaited response (execution suspended at `await: @user`), or an interjection (input arriving when not awaited). An awaited response SHALL be captured as the return value of the `await:` and execution SHALL resume from the await point. An interjection SHALL restart only the innermost active actor from the beginning of its `perform:` block, with the new input available; the delegation call stack SHALL be preserved.

#### Scenario: An interjection restarts only the innermost actor

- **WHEN** actor A has awaited actor B and the user interjects while B is running
- **THEN** only B is restarted from the top of its `perform:` block with the new input available
- **AND** A remains on the call stack awaiting B's return

#### Scenario: An awaited response resumes from the await point

- **WHEN** execution is suspended at `await: @user` and the user responds
- **THEN** the input is captured as the await's return value and the actor resumes from the await point

### Requirement: Instruction payloads execute only as a restricted parseable subset

A signal payload carrying an `instruction` key SHALL be executed only if it parses as the restricted executable subset: `read_file_directive`, `set_block`, `emit_action`, or `log_action`. Terminating actions and host-language evaluation SHALL NOT be permitted in an instruction payload. A parse failure or a disallowed construct SHALL raise the `instruction_failed` signal, and the interrupted actor SHALL resume.

#### Scenario: A parseable instruction executes

- **WHEN** a signal payload contains `instruction: "read_file: 'fragments/critique.in'"`
- **THEN** the runtime parses it as a `read_file_directive` and executes it
- **AND** the emitting actor resumes after the signal is handled

#### Scenario: A disallowed instruction fails safely

- **WHEN** a signal payload's instruction contains a terminating action or fails to parse as the restricted subset
- **THEN** the runtime raises an `instruction_failed` signal and resumes the original actor without executing the payload

### Requirement: The signals namespace is written only by the runtime

The runtime SHALL record every handled signal in `&signals.latest` and append it to `&signals.history`. These paths SHALL be readable by all components and writable only by the runtime; a program `set:` targeting `&signals` is a read-only violation.

#### Scenario: A handled signal is recorded

- **WHEN** the runtime handles any signal
- **THEN** `&signals.latest` holds the signal object and `&signals.history` gains an entry

### Requirement: The trace toggle controls visibility only

The `*trace` command SHALL toggle whether diagnostic messages print. It SHALL NOT change control flow: errors that halt with trace on also halt with trace off, and all error recording is independent of the trace setting.

#### Scenario: Toggling trace changes no behavior

- **WHEN** the same program runs once with trace on and once with trace off
- **THEN** both runs take identical transitions and produce identical state, differing only in diagnostic output

### Requirement: Help routing is deterministic

An actor opts into handling `*help` by declaring a help handler: a `when:` branch keyed on the help signal that produces output. On `*help`, the runtime SHALL check whether the active actor declares such a handler and whether it ran and emitted output; if so, that output is the complete help message. Otherwise the runtime SHALL emit the global help message — the standard signals plus the available top-level commands. No model judgment SHALL be involved in the routing.

#### Scenario: A declared help handler supplies the message

- **WHEN** the user enters `*help` and the active actor declares a help handler that emits output
- **THEN** that output is the complete help message and no global help is emitted

#### Scenario: No handler falls back to global help

- **WHEN** the user enters `*help` and the active actor declares no help handler
- **THEN** the runtime emits the global help message listing the standard signals and the available commands
