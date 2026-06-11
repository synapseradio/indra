# interpreter-runtime

## Purpose

The `interpreter-runtime` capability is the deterministic execution engine of the INDRA runtime. It owns the conductor and the single canonical turn cycle, the terminating actions and the static totality validation that guarantees every turn settles, the delegation call stack with resumption from the await point, and `say:` routing of control between components. One generic interpreter actor executes every INDRA actor, parameterized by the actor's definition as data; `become:` and `await:` are the same spawn operation. The capability also defines the total, deterministic, side-effect-free expression evaluator, the reification of suspended `until:` loops as explicit frames, halt semantics independent of trace visibility, and the invariant that all program-visible state lives in the context substrate rather than in the choreography layer.

## Requirements

### Requirement: The conductor owns one canonical turn cycle

The runtime SHALL execute every turn through a single conductor-owned cycle: identify the active actor, perform its turn (`method:`, `goal:`, `then:` — with `when:` guards reading only committed state), check for loop suspension, settle through a terminating or suspending action, and commit staged writes at the turn boundary. The boundary commit SHALL be the only commit of staged writes, occurring as a single step between turn N settling and turn N+1 dispatching. The runtime SHALL NOT commit staged writes mid-turn.

#### Scenario: The commit happens between turns, not within them

- **WHEN** an actor stages a write during its turn and the turn settles through a terminator
- **THEN** the staged write is committed exactly once, after the turn settles and before the next turn dispatches
- **AND** no read during the settling turn observes the staged value

#### Scenario: Guards read committed state only

- **WHEN** an actor's `then:` block evaluates a `when:` guard after a `set:` staged earlier in the same turn
- **THEN** the guard reads the committed value from before the turn began

### Requirement: Turns settle only through a terminator or a suspension

Every turn SHALL end through exactly one of the terminating actions — `say:`, `return:`, or `await:` — or through a loop suspension. Program validation SHALL enforce this statically: every `then:` block must be total, meaning it carries an `otherwise:` branch or its `when:` guards are exhaustive. A program containing a non-total `then:` block SHALL be rejected at load time, before the first turn, with an error naming the actor and block.

#### Scenario: A non-total then-block halts at load

- **WHEN** a program is loaded in which an actor's `then:` block has `when:` branches but no `otherwise:` and no exhaustive guard set
- **THEN** the runtime halts before turn one with a validation error naming the actor and the non-total `then:` block

#### Scenario: A turn cannot end without settling

- **WHEN** a validated program executes a turn
- **THEN** the turn ends through exactly one of `say:`, `return:`, `await:`, or a loop suspension

### Requirement: Delegation is a call stack with resumption

An `await:` action SHALL push the awaiting actor's state onto a call stack and transfer control to the awaited component. The awaited component SHALL end with a `return:` action, except `@user`, which returns implicitly with the user's input. The returned value SHALL be stored in the path named by `store_in:`, or in `&result` when `store_in:` is absent. After the value lands, the awaiting actor SHALL resume execution from the point immediately after the `await:`, with its pre-await state restored.

#### Scenario: The awaiting actor resumes after the await point

- **WHEN** actor A executes `await: @B` followed by further actions, and B's `return:` completes
- **THEN** B's returned value is stored in A's `store_in:` path
- **AND** A resumes from the action immediately after the `await:`, not from the top of its `perform:` block, and A does not finalize

#### Scenario: A return without store_in lands in &result

- **WHEN** an awaited component returns a value and the `await:` carries no `store_in:`
- **THEN** the value is readable at `&result` by the resumed actor

### Requirement: A say action routes control

A `say: to: <target> what: <text>` action SHALL emit the text and determine which component takes the next turn. When the target is a component, the runtime SHALL transfer control to that component for the next turn. When the target is `@user` (or the host), the runtime SHALL emit the text as output and yield to user input.

#### Scenario: Saying to a component passes control to it

- **WHEN** actor A settles with `say: to: @B what: "..."` and the boundary commit completes
- **THEN** the next turn is dispatched to @B, not to A

#### Scenario: Saying to the user yields for input

- **WHEN** an actor settles with `say:` targeting `@user`
- **THEN** the text is emitted as host-observable output and the runtime waits for user input before dispatching the next turn

### Requirement: One generic interpreter actor executes every INDRA actor

The runtime SHALL register exactly one generic interpreter actor and instantiate every INDRA actor from it, passing the actor's definition (identity, rules, understands, perform AST) as serializable input. Static `await: @name`, `become:`, and any future open instantiation target SHALL be the same spawn operation parameterized by different data. A `become:` SHALL create a temporary single-turn actor whose behavioral constraints come from the named persona and whose turn logic comes from the become-site `perform:` block; the actor SHALL be discarded after its turn.

#### Scenario: Become creates a discarded single-turn actor

- **WHEN** an actor executes `become: @persona with: {...} perform: <block>`
- **THEN** the runtime spawns the generic interpreter parameterized by the persona's constraints and the become-site `perform:` block
- **AND** the temporary actor executes one turn and is discarded

#### Scenario: Await and become are the same spawn shape

- **WHEN** the runtime instantiates a component for `await: @name` and for `become: @persona`
- **THEN** both are instances of the one registered generic interpreter, differing only in their input data

### Requirement: Expression evaluation is total, deterministic, and side-effect-free

The runtime SHALL evaluate every expression deterministically, with no side effects, yielding a value or a typed expression error for every input. `is` SHALL be type-strict structural deep equality with no coercion — operands of different types compare false; `not` SHALL be its negation. Ordered comparators (`greater_than`, `less_than`, `greater_than_or_eq`, `less_than_or_eq`) SHALL be defined only when both operands are numeric and SHALL otherwise raise an expression type error. Truthiness SHALL treat `false`, `null`, `0`, `""`, `[]`, and `{}` as falsy and every other value as truthy. `exists(&path)` SHALL be true iff the path resolves to a present, non-null cell. A ternary SHALL evaluate only the branch its condition selects. `${expr}` SHALL evaluate the expression and stringify the result.

#### Scenario: is does not coerce across types

- **WHEN** a guard evaluates `&context.count is "3"` and `&context.count` holds the number `3`
- **THEN** the comparison is false because the operands have different types

#### Scenario: An ordered comparison on non-numeric operands is an error

- **WHEN** an expression evaluates `"abc" greater_than 2`
- **THEN** the runtime raises an expression type error rather than producing a value

#### Scenario: A ternary evaluates one branch

- **WHEN** a ternary's condition is true and its false-branch contains an expression that would error
- **THEN** only the true-branch is evaluated and no error is raised

### Requirement: Suspended until-loops are reified frames

When a turn suspends inside an `until:` loop, the runtime SHALL capture the loop as an explicit frame — iteration count, condition, `max_iterations`, position in the loop-body AST, and local state — stored at `&context._loop.<actor_id>.<loop_instance_id>`. Resumption SHALL restore the frame exactly and continue from the suspension point. `max_iterations` SHALL be a hard limit counted across turns. A `return:` inside an `until:` loop SHALL terminate both the loop and the current delegation. Nested loops SHALL each maintain an independent frame.

#### Scenario: A loop resumes from its frame

- **WHEN** an `until:` loop suspends at iteration 3 via a `say:` and control later returns to the actor
- **THEN** the loop resumes at iteration 3 from the saved AST position with its local state restored

#### Scenario: max_iterations bounds the loop across turns

- **WHEN** a loop with `max_iterations: 5` has accumulated 5 iterations across multiple suspensions and resumptions
- **THEN** the loop terminates rather than iterating a sixth time

### Requirement: Halting is never gated by trace visibility

A grammar violation SHALL always halt execution and SHALL always be recorded in the error channel, regardless of the trace setting. The trace flag SHALL gate only whether the violation's message is printed. A tool failure SHALL be non-fatal: the runtime logs a warning, the operation yields `null`, and execution continues.

#### Scenario: A grammar violation halts with trace off

- **WHEN** a grammar violation occurs while trace mode is off
- **THEN** execution halts and the violation is recorded in the error channel
- **AND** only the printing of the message is suppressed

#### Scenario: A tool failure continues with null

- **WHEN** an MCP tool call fails or times out during a turn
- **THEN** the runtime logs a non-fatal warning, the operation's value is `null`, and the turn continues

### Requirement: Program state lives only in the context substrate

All program-visible state SHALL live in the context substrate: every `&`-addressable value SHALL resolve through the store. The choreography layer SHALL hold only control-flow phase data, never program state.

#### Scenario: Every state read resolves through the store

- **WHEN** any component reads an `&`-addressed path during a turn
- **THEN** the value comes from the context substrate, not from choreography-layer state
