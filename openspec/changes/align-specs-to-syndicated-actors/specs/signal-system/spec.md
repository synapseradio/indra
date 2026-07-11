# signal-system

## Purpose

The `signal-system` capability owns how the runtime receives and routes signals, with the human modeled as an actor that emits signals and observes the facts addressed to it. A signal an actor emits and a `*command` from the human alike are delivered to a mailbox and observed at turn boundaries, which keeps signal handling compatible with logically concurrent actors. A human `*command` is a typed signal value, and every human input classifies as exactly one of a signal, a response to a suspended actor, or an interjection. The handled-signal record is a runtime-owned typed value, written only by the runtime and read-only to programs by attenuation. A signal payload that carries an executable instruction runs only as a declared, restricted action set, never host-language evaluation. The `*trace` toggle controls diagnostic visibility only, never control flow, and `*help` routes deterministically through declared handlers with a global fallback.

## MODIFIED Requirements

### Requirement: Signals are mailbox-delivered and observed at turn boundaries

Signals — a signal an actor emits and a `*command` from the human alike — SHALL be delivered to a mailbox and observed at turn boundaries. A turn boundary is the point where a turn settles, through a settling action or a suspension, as `framework-core-runtime` defines it. The runtime SHALL NOT preempt a turn between its dispatch and the point it settles in order to handle a signal. Because a suspension is itself a boundary, a signal that arrives while an actor is suspended pending a fact — including suspension pending an inference result — is observed at that boundary, not held until the actor settles through some later action. This is what keeps signal handling compatible with logically concurrent actors: each turn is internally sequential, and signals interleave only at boundaries between turns.

#### Scenario: A signal arriving mid-turn waits for the boundary

- **WHEN** a signal is emitted while an actor's turn is executing between dispatch and the point it settles
- **THEN** the turn runs to its settling action uninterrupted
- **AND** the signal is observed at that boundary before the next turn dispatches

#### Scenario: A signal arriving during a suspension is observed at the suspension boundary

- **WHEN** a signal arrives while an actor is suspended pending a fact
- **THEN** the signal is observed at the suspension boundary rather than held until the actor settles through some later action

### Requirement: User commands translate to standard signal objects

Human input beginning with `*` SHALL be translated into a typed signal value `{id, source, payload}` before processing: the human is an actor, and a `*command` is a signal it emits. For example, `*trace on` becomes `{id: 'user_command', source: 'user', payload: {command: 'trace', args: ['on']}}`.

#### Scenario: A star command becomes a signal

- **WHEN** the human enters `*trace on`
- **THEN** the runtime processes a signal with id `user_command`, source `user`, and payload `{command: 'trace', args: ['on']}`

### Requirement: User input is classified into three modes

The runtime SHALL classify every human input as exactly one of a signal, a response, or an interjection, deciding by a fixed predicate order with the first match winning: (1) input beginning with `*` is a signal; (2) otherwise, input arriving while an actor is suspended pending the human's input is a response; (3) otherwise, input is an interjection. Because the order is fixed, a leading-`*` input is a signal even while an actor is suspended pending the human, so the classification is always decidable. A response SHALL be captured as the value that resumes the suspended actor, and that actor SHALL resume from its suspension frame. An interjection SHALL be delivered to the mailbox and observed at the next turn boundary like any other signal; when observed, it SHALL restart the innermost active actor — the most recently dispatched actor in the active reaction — from the beginning of its turn logic on that actor's next dispatch, with the new input available. No actor SHALL be restarted between its dispatch and the point it settles, and an actor suspended pending the human stays suspended until its response arrives.

#### Scenario: A star command during a suspension is a signal, not the response

- **WHEN** an actor is suspended pending the human's input and the human enters `*help`
- **THEN** the input is classified as a signal by the first predicate and routed as a command, not captured as the value that resumes the suspended actor

#### Scenario: An interjection restarts the innermost active actor at the next boundary

- **WHEN** actor A is suspended pending actor B's result and the human interjects while B's turn is executing
- **THEN** B's turn runs to the point it settles uninterrupted
- **AND** the interjection is observed at that boundary, and B is restarted from the top of its turn logic on its next dispatch with the new input available
- **AND** A stays suspended pending B's result

#### Scenario: A response resumes the suspended actor

- **WHEN** an actor is suspended pending the human's input, the input does not begin with `*`, and the human responds
- **THEN** the input is captured as the value that resumes the suspension and the actor resumes from its suspension frame

### Requirement: Instruction payloads execute only as a restricted parseable subset

A signal payload carrying an `instruction` SHALL be executed only if it parses as a declared, restricted action set: a small set of side-effect-bounded actions the runtime declares, never an open evaluation of program text. Host-language evaluation and terminating actions SHALL NOT be permitted in an instruction payload. A parse failure or a disallowed construct SHALL raise the `instruction_failed` signal, and the interrupted actor SHALL resume.

#### Scenario: A declared instruction executes

- **WHEN** a signal payload carries an instruction naming a declared read action over a fragment path
- **THEN** the runtime executes it as that declared action
- **AND** the emitting actor resumes after the signal is handled

#### Scenario: A disallowed instruction fails safely

- **WHEN** a signal payload's instruction names a terminating action or fails to parse as the declared action set
- **THEN** the runtime raises an `instruction_failed` signal and resumes the original actor without executing the payload

### Requirement: The trace toggle controls visibility only

The `*trace` command SHALL toggle whether diagnostic messages print. It SHALL NOT change control flow: a fatal fault that halts with trace on also halts with trace off, and all error recording is independent of the trace setting.

#### Scenario: Toggling trace changes no behavior

- **WHEN** the same program runs once with trace on and once with trace off
- **THEN** both runs take identical transitions and produce identical state, differing only in diagnostic output

### Requirement: Help routing is deterministic

An actor opts into handling `*help` by declaring a help handler that produces output. On `*help`, the runtime SHALL check whether the active actor declares such a handler and whether it ran and emitted output; if so, that output is the complete help message. Otherwise the runtime SHALL emit the global help message — the standard signals plus the available top-level commands. No model judgment SHALL be involved in the routing.

#### Scenario: A declared help handler supplies the message

- **WHEN** the human enters `*help` and the active actor declares a help handler that emits output
- **THEN** that output is the complete help message and no global help is emitted

#### Scenario: No handler falls back to global help

- **WHEN** the human enters `*help` and the active actor declares no help handler
- **THEN** the runtime emits the global help message listing the standard signals and the available commands

## REMOVED Requirements

### Requirement: The signals namespace is written only by the runtime

**Reason**: The `&signals` namespace is retired with the rest of `&`-path addressing. The handled-signal record is no longer a namespace the runtime writes and protects at commit; it is a runtime-owned typed value, read-only to programs by attenuation. The guarantee is restated in "The handled-signal record is a runtime-owned typed value" and carried by the capability model rather than a commit-time namespace check.

**Migration**: Read the handled-signal record as a typed runtime-owned value — its latest field and its history — by observing it. A program cannot write it: it holds no capability that admits asserting a runtime-owned fact, so the write is rejected rather than quietly dropped.

## ADDED Requirements

### Requirement: The handled-signal record is a runtime-owned typed value

The runtime SHALL record every handled signal in a runtime-owned value carrying the latest handled signal and the history of handled signals. That value SHALL be readable by every actor that observes it and writable only by the runtime: it is a fact only the runtime asserts, and an actor holds no capability that admits asserting it. A program write to it SHALL be rejected — a type error at author time where the surface is typed — and never a quiet drop (fork F4).

#### Scenario: A handled signal is recorded

- **WHEN** the runtime handles any signal
- **THEN** the runtime-owned signal record's latest field holds the signal object and its history gains an entry

#### Scenario: A program write to the signal record is rejected

- **WHEN** program logic attempts to write the runtime-owned signal record
- **THEN** it is rejected as a type error at author time, not a quiet drop and not a runtime-rejected commit
