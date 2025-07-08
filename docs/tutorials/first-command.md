# Architectural Patterns in INDRA: Command Overlays

## Understanding Behavioral Architecture

INDRA supports multiple architectural patterns for organizing and sharing behaviors. This tutorial explores one advanced pattern - the "command overlay" - which is specific to the PRISM reasoning engine in this repository.

## Two Approaches to Shared Behavior

### Simple Pattern: Direct Component Sharing

The simplest way to share behaviors is through direct component definitions, as seen in `citations.in`:

```indra
# citations.in - Simple shared components
@citation_collector:
  you:
    possess:
      identifier: CITATION_COLLECTOR
    are: ‹systematic evidence gatherer›
    must:
      - ‹extract during search›
      - ‹store when referenced›
      - ‹prioritize domain diversity›
    understand: ‹collection quality determines reasoning credibility›

# Other files import and extend this directly:
!read_file './shared/citations.in'
@my_component:
  you:
    extend: @citation_collector
    are: ‹researcher with citation capabilities›
```

This pattern is straightforward - define components, import them, extend them. Perfect for most use cases.

### Advanced Pattern: Command Overlays (PRISM-specific)

The PRISM engine introduces a more sophisticated pattern called "command overlays". This isn't a core INDRA feature - it's an architectural choice made by PRISM to enable complex multi-perspective reasoning.

```indra
# analyze.in - A PRISM command overlay
@command:
  you:
    possess:
      identifier: ANALYZER
      state:
        analysis_depth: 'comprehensive'
    are: ‹thoughtful analyzer›
    must: [‹provide insightful analysis›]
    
    respond:
      on: user_input
      you:
        perform:
          through: ‹deep analysis›
          as: analyze_input(@command.state.input)
          intention: ‹reveal hidden patterns›
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
@formatter_service:
  you:
    possess:
      identifier: FORMATTER
    are: ‹formatting service›
    respond:
      on: format_request
      you:
        perform:
          through: ‹appropriate formatting›
          as: ‹{formatted output}›
```

### Pattern 2: Behavioral Mixins
```indra
# mixins/empathetic.in
@empathetic_mixin:
  you:
    must: [‹acknowledge emotional context›]
    understand: ‹emotions matter in communication›
```

### Pattern 3: Pipeline Stages
```indra
# pipeline/stage1.in
@stage1:
  you:
    respond:
      on: input
      you:
        perform:
          then:
            emit: stage1_complete
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
@simple_engine:
  you:
    possess:
      identifier: SIMPLE_ENGINE
    are: ‹basic command processor›
    respond:
      on: user_input
      you:
        perform:
          through: ‹command routing›
          as: ‹{delegating to appropriate handler}›
          then:
            emit: «${command_type}_requested»

# my-command.in
!read_file './my-engine.in'

@help_handler:
  you:
    possess:
      identifier: HELP_HANDLER
    are: ‹help provider›
    respond:
      on: help_requested
      you:
        perform:
          through: ‹help generation›
          as: ‹{appropriate help text}›
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