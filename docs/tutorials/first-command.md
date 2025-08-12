# Architectural Patterns in INDRA: Command Overlays

## Understanding Behavioral Architecture

INDRA supports multiple architectural patterns for organizing and sharing behaviors. This tutorial explores one advanced pattern - the "command overlay" - which is specific to the PRISM reasoning engine in this repository.

## Two Approaches to Shared Behavior

### Simple Pattern: Direct Component Sharing

The simplest way to share behaviors is through direct component definitions, as seen in `citations.in`:

```indra
# citations.in - A headless persona
persona @citation_collector:
  identity: "a systematic evidence gatherer"
  rules:
    - "extract during search"
    - "store when referenced"
  understands:
    - "collection quality determines reasoning credibility"

# Another file imports and uses this persona
!read_file './shared/citations.in'

agent @researcher:
  identity: "a researcher who properly cites sources"
  rules:
    - "always gather citations before synthesizing"
  perform:
    method: "citation-first research"
    sequence:
      step:
        as: @citation_collector
        output: <<|
          Now gathering evidence and citations...
          $(<search for relevant sources>)
        |>>
        set:
          &context.citations: $(<the collected citations>)
      step:
        as: self
        output: <<|
          Based on the evidence found:
          $(&context.citations)
          
          My synthesis is...
        |>>
    goal: "to produce an evidence-based conclusion"
    then:
      say:
        to: @user
        what: 'research_complete'
```

This pattern is straightforward - define components, import them, extend them. Perfect for most use cases.

### Advanced Pattern: Command Overlays (PRISM-specific)

The PRISM engine introduces a more sophisticated pattern called "command overlays". This isn't a core INDRA feature - it's an architectural choice made by PRISM to enable complex multi-perspective reasoning.

```indra
# analyze.in - A PRISM command overlay
agent @command:
  identity: "thoughtful analyzer"
  rules:
    - "provide insightful analysis"
  
  perform:
    method: "deep analysis"
    output: <<${analyze_input(@command.state.input)}>>
    goal: "reveal hidden patterns"
```

## Why PRISM Uses Command Overlays

The PRISM engine (`prism-engine.in`) is a sophisticated multi-perspective reasoning system. It needs to:

1. **Orchestrate Multiple Perspectives**: Systems Architect, AI Theorist, Cognitive Architect, etc.
2. **Manage Complex State**: Thought trees, confidence scores, iteration limits
3. **Enable Specialization**: Different commands for different reasoning tasks

Command overlays provide a clean way to:
- Add specialized behaviors to the base engine
- Maintain separation of concerns
- Allow easy composition of capabilities

## How Command Overlays Work

When you run:
```bash
indra prism-engine.in analyze.in
```

The PRISM engine:
1. Loads its core multi-perspective reasoning infrastructure
2. Overlays the specialized analysis behaviors from `analyze.in`
3. The `@command` component extends the engine's capabilities

This is different from simple component sharing because:
- The engine provides a complete reasoning framework
- Commands plug into this framework
- The combination creates specialized reasoning tools

## Comparing the Patterns

### Simple Component Sharing (citations.in)
- **Purpose**: Share common behaviors across files
- **Complexity**: Low
- **Use When**: You need reusable components
- **Example**: Citation formatting, validation helpers

### Command Overlays (PRISM pattern)
- **Purpose**: Extend a complex engine with specialized behaviors
- **Complexity**: High
- **Use When**: Building sophisticated reasoning systems
- **Example**: Analysis commands, research commands, validation commands

## Building Your Own Architectural Patterns

INDRA doesn't prescribe architectural patterns. You can create your own based on your needs:

### Pattern 1: Service Components
```indra
# services/formatter.in
agent @formatter_service:
  identity: "formatting service"
  perform:
    method: "appropriate formatting"
    output: <{formatted output}>
```

### Pattern 2: Behavioral Mixins
```indra
# mixins/empathetic.in
persona @empathetic_mixin:
  rules:
    - "acknowledge emotional context"
  understands:
    - "emotions matter in communication"
```

### Pattern 3: Pipeline Stages
```indra
# pipeline/stage1.in
sequence process_stage_1(input) ::=
  step:
    output: <<|Executing stage 1 on $(input)...|>>
    set:
      &context.stage1.status: 'complete'
  step:
    output: <<|Stage 1 processing is complete.|>>

agent @pipeline_runner:
  identity: "a pipeline execution agent"
  rules:
    - "execute pipeline stages in order"
  understands:
    - "each stage is a distinct step in a larger process"
  perform:
    method: "sequential execution of a defined pipeline stage"
    sequence: process_stage_1(input: &dialogue.latest_dialogue_entry)
    goal: "to complete stage 1 of the pipeline"
    then:
      say:
        to: @next_stage_agent # Assumes another agent is defined
        what: "stage_1_complete"
```

## When to Use Each Pattern

### Use Simple Components When:
- Sharing straightforward behaviors
- Building modular systems
- Keeping things maintainable
- Working with standard INDRA features

### Use Engine + Overlay When:
- Building complex reasoning systems
- Need sophisticated orchestration
- Want pluggable specializations
- Require multi-stage processing

### Create Your Own Pattern When:
- Existing patterns don't fit
- You have specific architectural needs
- You're building domain-specific systems

## Example: Building a Simple Command System

Without PRISM's complexity, here's a basic command pattern:

```indra
# my-engine.in
agent @simple_engine:
  identity: "a basic command processor"
  understands:
    - "the user's input determines which specialist agent to call"
  perform:
    method: "command routing"
    output: "<{delegating to appropriate handler}>"
    goal: "to route the user to the correct agent"
    then:
      # This is a simplified example; a real implementation
      # would have logic to determine the command.
      say:
        to: @help_handler
        what: "help_requested"

# my-command.in
!read_file './my-engine.in'

agent @help_handler:
  identity: "a help provider"
  understands:
    - "the user needs to know what commands are available"
  perform:
    method: "help generation"
    output: "<{appropriate help text}>"
    goal: "to provide the user with a list of commands"
    then:
      say:
        to: @user # Assumes a @user agent is defined
        what: "help_provided"
```

This achieves command-like behavior without PRISM's complexity.

## The Philosophy

Command overlays aren't a requirement - they're one person's solution to a specific problem. INDRA's flexibility means you can:

1. Use simple component sharing (like citations.in)
2. Adopt complex patterns (like PRISM's overlays)
3. Create entirely new architectural patterns

The key is choosing the right complexity for your needs. Start simple, evolve as needed.

## Exercise: Design Your Architecture

Consider a task management system. How would you architect it?

1. **Simple Approach**: Direct components for tasks, lists, reminders
2. **Engine Approach**: Core engine with command overlays for different workflows
3. **Pipeline Approach**: Stages for creation, assignment, tracking, completion
4. **Service Approach**: Separate services for each capability

Think about:
- What level of complexity do you actually need?
- How will components interact?
- What patterns best express your domain?
- How can you keep it maintainable?

## Key Takeaway

Command overlays are just one architectural pattern - specific to PRISM, not core to INDRA. The beauty of INDRA is that it doesn't force any particular architecture. You can:

- Start with simple component sharing
- Build complex multi-stage systems
- Create domain-specific patterns
- Mix and match approaches

Choose the pattern that best fits your problem, not the most impressive one.

---

*Next: [Thinking in Transformations](./thinking-in-transformations.md) - Understanding INDRA's core philosophy of progressive becoming*