# agent-configuration

## Purpose

An agent is built from a handful of authored choices: the instructions it runs under, the tools it may call, and the settings that shape its model request. A developer wants to reuse and combine those choices — a shared instruction preamble across several agents, a base configuration extended with one extra tool, a strict variant of a lenient one. In mainstream frameworks the only way to combine two agents is orchestration: nest one as the other's tool, or wire a workflow that schedules both. There is no value that holds just the configuration, mergeable before anything runs, so reusing an agent's setup and making one agent call another collapse onto the same mechanism, and a developer pays scheduling cost to do what is really data composition.

`agent-configuration` separates the two axes. A **persona** is the data axis: an agent's authored configuration — its instructions, its available tools, and its other settings — held as a value with no actor lifecycle. It takes no turns, holds no mailbox, asserts no facts, and has no place in dispatch. Personas compose by merging data — layering instructions, adding tools, extending settings — and the merge is deterministic, side-effect-free, and resolvable at author or load time, before any turn runs. An agent is the orchestration axis: an inference call in a loop, realized by an actor that consults the model, and it is parameterized by a persona. Composing personas is composing data; composing agents is composing the scheduled side effects of running them. The persona supplies exactly the constraints the inference boundary marshals into the model request, and the emergent character a persona produces in model output stays a mental-model term that appears in no requirement here.

## ADDED Requirements

### Requirement: A persona is an agent's authored configuration

A persona SHALL be a value holding an agent's authored configuration — its instructions, its available tools, and its other settings. A persona SHALL have no actor lifecycle: it does not take turns, does not hold a mailbox, does not assert facts, and does not appear in the runtime's dispatch. A persona is therefore reusable across agents and inert until an agent is parameterized by it.

#### Scenario: Declaring a persona starts nothing

- **WHEN** a program declares a persona holding instructions and a tool set
- **THEN** no turn is dispatched and no fact is asserted on account of the declaration alone
- **AND** the same persona value may parameterize more than one agent

### Requirement: Personas compose by deterministic data merge

Composing personas SHALL be a pure data merge — layering instructions, adding tools, and extending settings — that is deterministic and side-effect-free, and resolvable at author or load time before any turn runs. Composition SHALL NOT schedule, dispatch, or run anything, and the same inputs SHALL always produce the same merged persona.

#### Scenario: Layering a base persona with an overlay

- **WHEN** a base persona is composed with an overlay that adds a tool and extends the instructions
- **THEN** the result is a single merged persona carrying the combined instructions and tool set
- **AND** the merge is computed without dispatching a turn, and re-running it over the same inputs yields the identical merged persona

### Requirement: An agent is parameterized by a persona

An agent — an inference call in a loop, realized by an actor that consults the model — SHALL draw its instructions and its available tools from a persona. The persona SHALL supply the constraints the inference boundary marshals into the model request. The persona SHALL NOT itself perform the inference call or drive the loop; consulting the model and iterating the loop are the actor's role, not the persona's.

#### Scenario: An agent draws its request constraints from its persona

- **WHEN** an actor that consults the model is parameterized by a persona and reaches its inference boundary
- **THEN** the instructions and tool set the boundary marshals into the request come from that persona
- **AND** the persona itself neither performs the call nor advances the loop
