## MODIFIED Requirements

### Requirement: Signals are mailbox-delivered and observed at turn boundaries

Signals — actor `emit:` actions and user `*commands` alike — SHALL be delivered to a mailbox and observed at turn boundaries, where a turn boundary is the settling point `actor-supervision` defines: a `say:`, `return:`, `await:`, or loop suspension. The runtime SHALL NOT preempt a turn between its dispatch and its settling action to handle a signal. Because an `await:` is itself a boundary, a signal that arrives while an actor is parked at an `await:` — including an `await:` on an inference call — is observed at that boundary, not held until some later terminator. This is what keeps signal handling compatible with logical concurrency: each turn is internally sequential, and signals interleave only at boundaries between turns.

#### Scenario: A signal arriving mid-turn waits for the boundary

- **WHEN** a signal is emitted while an actor's turn is executing between dispatch and its settling action
- **THEN** the turn runs to its settling action uninterrupted
- **AND** the signal is observed at that boundary before the next turn dispatches

#### Scenario: A signal arriving during an await is observed at the await boundary

- **WHEN** a signal arrives while an actor is parked at an `await:`
- **THEN** the signal is observed at the await boundary rather than held until the actor settles through a later terminator

### Requirement: User input is classified into three modes

The runtime SHALL classify every user input as exactly one of a signal, an awaited response, or an interjection, deciding by a fixed predicate order with the first match winning: (1) input beginning with `*` is a signal; (2) otherwise, input arriving while execution is suspended at `await: @user` is an awaited response; (3) otherwise, input is an interjection. Because the order is fixed, a leading-`*` input is a signal even when execution is suspended at `await: @user`, so the classification is always decidable. An awaited response SHALL be captured as the return value of the `await:` and execution SHALL resume from the await point. An interjection SHALL be mailbox-delivered and observed at the next turn boundary like any other signal; when observed, it SHALL restart the innermost active actor from the beginning of its turn logic on that actor's next dispatch, with the new input available and the delegation call stack preserved. No actor SHALL be restarted between its dispatch and its settling action.

#### Scenario: A star command at an await is a signal, not the response

- **WHEN** execution is suspended at `await: @user` and the user enters `*help`
- **THEN** the input is classified as a signal by the first predicate and routed as a command, not captured as the await's return value

#### Scenario: An interjection restarts the innermost actor at the next boundary

- **WHEN** actor A has awaited actor B and the user interjects while B's turn is executing
- **THEN** B's turn runs to its settling action uninterrupted
- **AND** the interjection is observed at that boundary, and B is restarted from the top of its turn logic on its next dispatch with the new input available
- **AND** A remains on the call stack awaiting B's return

#### Scenario: An awaited response resumes from the await point

- **WHEN** execution is suspended at `await: @user`, the input does not begin with `*`, and the user responds
- **THEN** the input is captured as the await's return value and the actor resumes from the await point

## REMOVED Requirements

### Requirement: The signals namespace is written only by the runtime

**Reason**: `framework-native-contracts` retires the namespace model. The handled-signal record is no longer a `&signals` namespace written by the runtime and protected at commit; it becomes a typed runtime-owned input, read-only to programs by type. The guarantee is restated in the added requirement below and carried by the type system instead of a commit-time check.

## ADDED Requirements

### Requirement: The handled-signal record is a runtime-owned typed value

The runtime SHALL record every handled signal in a runtime-owned value carrying the latest signal and the history of handled signals. That value SHALL be readable by every component and writable only by the runtime: per `framework-native-contracts`, it is a typed runtime-owned input, so a program write to it is a type error at author time rather than a namespace violation rejected at commit.

#### Scenario: A handled signal is recorded

- **WHEN** the runtime handles any signal
- **THEN** the runtime-owned signal record's latest field holds the signal object and its history gains an entry

#### Scenario: A program write to the signal record is a type error

- **WHEN** program logic attempts to write the runtime-owned signal record
- **THEN** it is a type error at author time, not a runtime-rejected commit
