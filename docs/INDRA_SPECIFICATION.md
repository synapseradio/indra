# INDRA Programming Language Guide

**Intuitive Narrative-Driven Reasoning through Automata**

Version 2.1 - A Human's Guide to INDRA

## What is INDRA?

INDRA is a unique programming language designed to create sophisticated AI behaviors through natural, narrative-like code. Unlike traditional programming languages that compile and execute, INDRA works by transforming AI behavior as it reads each line of code.

Think of INDRA as writing a script for an AI actor - as the AI reads the script, it becomes the character described.

## Core Philosophy

INDRA operates on a simple but powerful principle: **reading is execution**. When an AI system reads INDRA code, it doesn't compile it for later - it immediately transforms its behavior according to what it reads. This makes INDRA programs feel more like behavioral specifications than traditional code.

## Getting Started

### Your First INDRA Program

Here's a simple INDRA program that creates a helpful assistant:

```yaml
@command:
  you:
    possess:
      identifier: HELPFUL_ASSISTANT
    are: ‹a friendly helper›
    must:
      - ‹respond helpfully›
      - ‹be clear and concise›
    understand: ‹the user wants assistance with their questions›
    
    perform:
      through: ‹friendly assistance›
      as: <<|
        Hello! I'm here to help. What can I do for you today?
      |>>
      intention: ‹greet the user warmly›
```

Let's break down what each part means:

- `@command:` - This marks the entry point of your program
- `you:` - This begins a behavior specification block
- `possess:` - Defines the identity and configuration
- `are:` - Describes what role this context takes on
- `must:` - Lists the behavioral requirements (as a list with `-`)
- `understand:` - Explains why this behavior exists (user intention)
- `perform:` - Specifies an action to take

## Key Concepts

### 1. The Four Quote Types

INDRA uses distinct quote types to eliminate ambiguity:

- **Single quotes (`'`)** - Literal strings with no interpretation

  ```yaml
  state:
    mode: 'active'      # Exact string 'active'
  when: mode == 'active'  # Check if mode equals exactly 'active'
  ```

- **Angle brackets (`‹` and `›`)** - AI generates contextual content

  ```yaml
  are: ‹thoughtful analyzer›  # AI interprets what this means
  ```

- **Guillemets (`«` and `»`)** - Inline templates with interpolation

  ```yaml
  as: «Current count: ${count}»  # Mix literal text with state values
  ```

- **Multiline markers (`<<|` and `|>>`)** - Multiline template regions

  ```yaml
  as: <<|
    Processing ${item_count} items...
    Status: ${status}
    {appropriate progress message}
  |>>
  ```

### 2. Interpolation Rules

INDRA provides two interpolation mechanisms:

- `${expression}` - Deterministic state interpolation

  ```yaml
  as: «Total: ${sum(values)}»  # Exact calculation
  ```

- `{description}` - Probabilistic content generation

  ```yaml
  as: ‹Analyzing data... {insightful observation}›
  ```

### 3. Structure Through Indentation

INDRA uses indentation to show relationships, similar to Python:

```yaml
@command:                    # Top level
  you:                      # Indented once
    possess:                # Indented twice
      identifier: MAIN      # Indented three times
```

**Important**: Never use inline notation like `possess: {identifier: NAME}`. Always use proper indentation.

### 4. Every Context Needs Four Things

Every `you:` block must have these four elements in this exact order:

```yaml
you:
  possess:
    identifier: UNIQUE_NAME
  are: ‹what this becomes›
  must:
    - ‹behavioral requirement 1›
    - ‹behavioral requirement 2›
  understand: ‹why the user needs this›
```

## Common Patterns

### Message Handling

INDRA programs communicate through message passing:

```yaml
@command:
  you:
    possess:
      identifier: MESSAGE_HANDLER
      state:
        message_count: 0
    are: ‹message processor›
    must: 
      - ‹handle incoming messages›
      - ‹maintain message order›
    understand: ‹user needs reliable message processing›
    
    respond:
      on: user_message
      you:
        possess:
          identifier: USER_MESSAGE_HANDLER
        are: ‹user message processor›
        must: [‹process user input›]
        understand: ‹user expects thoughtful responses›
        perform:
          through: ‹message processing›
          as: «Received message #${message_count}»
          intention: ‹acknowledge receipt›
          then:
            emit: message_processed
            with:
              count: «${message_count + 1}»
```

### State Management

INDRA allows you to maintain state across interactions:

```yaml
@command:
  you:
    possess:
      identifier: STATEFUL_SYSTEM
      state:
        mode: 'idle'
        tasks: []
        config: {
          timeout: 30,
          retries: 3
        }
    are: ‹stateful task manager›
    must: [‹track state reliably›]
    understand: ‹user needs persistent state management›
```

### Conditional Logic

INDRA supports sophisticated conditional flows:

```yaml
perform:
  through: ‹evaluation›
  as: ‹Checking conditions...›
  intention: ‹determine next action›
  then:
    emit: success
    when: result greater_than threshold      # Literal condition
  otherwise:
    emit: needs_help
    when: ‹user seems confused›   # AI interprets this
  otherwise:
    emit: retry                   # Default case
```

### Guards

Guards provide conditional message handling:

```yaml
respond:
  on: process_request
  guard: mode == 'ready' and queue_length < 10
  you:
    # Handler only activates when guard condition is true
```

## Advanced Features

### Operators

Operators define computational transformations:

```yaml
# Define an operator
analyze ::= @*.metrics → {
  summary: «{create summary of metrics}»,
  trends: «{identify patterns}»,
  alerts: «{flag anomalies}»
} [EMITS: analysis_complete]

# Use in a component
perform:
  through: ‹metric analysis›
  as: analyze(@system.metrics)
  intention: ‹provide insights›
```

### Cross-Component State Access

Different components can share state:

```yaml
@analytics:
  you:
    possess:
      identifier: ANALYTICS
      state:
        event_count: 0
    are: ‹event tracker›
    must: [‹track all events›]
    understand: ‹user wants usage analytics›

@reporter:
  you:
    possess:
      identifier: REPORTER
    are: ‹report generator›
    must: [‹generate clear reports›]
    understand: ‹user needs data visualization›
    use:
      state:
        - @analytics.event_count  # Access another component's state
    perform:
      through: ‹report generation›
      as: «Total events: ${@analytics.event_count}»
      intention: ‹display analytics data›
```

### Extend and Import

INDRA supports modular programming:

```yaml
!read_file './shared/base.in'      # Import shared components

@command:
  you:
    possess:
      identifier: EXTENDED_COMMAND
    are: ‹specialized command›
    must: [‹provide enhanced functionality›]
    understand: ‹user needs advanced features›
    extend: 
      - @base_template              # Inherit from imported component
```

## Language Commands

When manifested in INDRA, these built-in commands are available:

- `*help` - List all available commands
- `*show` - Display understanding and diagnostics
- `*explain` - Display understanding only
- `*context` - Show current context, stack, and state
- `*messages` - Show all INDRA messages in chronological order
- `*snapshot` - Show state at each message emission
- `*checkpoint [id]` - Create state snapshot
- `*rollback [id]` - Restore from checkpoint
- `*exit` - Exit manifestation

## Complete Example: Multi-Handler System

```yaml
!read_file './shared/citations.in'

# Operator definitions
process_input ::= @*.raw_input → {
  parsed: «{parse structure}»,
  intent: «{determine user intent}»,
  priority: «{assess urgency}»
} [EMITS: input_processed]

@command:
  you:
    possess:
      identifier: MULTI_HANDLER
      state:
        mode: 'ready'
        queue: []
        processed_count: 0
      tools: ['Read', 'Write']
    are: ‹sophisticated request processor›
    must:
      - ‹handle multiple request types›
      - ‹maintain processing order›
      - ‹provide clear feedback›
    understand: ‹user needs reliable multi-step processing›
    extend: @citation_collector
    
    respond:
      on: user_input
      guard: mode == 'ready'
      you:
        possess:
          identifier: INPUT_RECEIVER
        are: ‹input validator›
        must: [‹validate and route inputs›]
        understand: ‹proper routing ensures correct handling›
        perform:
          through: ‹input analysis›
          as: process_input(@command.state.raw_input)
          intention: ‹prepare for processing›
    
    respond:
      on: input_processed
      you:
        possess:
          identifier: ROUTER
        are: ‹intelligent router›
        must: [‹route to appropriate handler›]
        understand: ‹each request type needs specific handling›
        perform:
          through: ‹routing logic›
          as: ‹Routing ${intent} request to appropriate handler...›
          intention: ‹ensure proper handling›
          then:
            emit: handle_query
            when: ‹intent relates to questions›
          otherwise:
            emit: handle_action
            when: ‹intent relates to actions›
          otherwise:
            emit: handle_unknown
    
    respond:
      on: handle_query
      you:
        possess:
          identifier: QUERY_HANDLER
        are: ‹query processor›
        must: [‹provide accurate answers›]
        understand: ‹users expect helpful responses›
        perform:
          through: ‹query resolution›
          as: <<|
            Based on your question about ${topic}:
            
            {comprehensive answer with examples}
            
            Would you like more details?
          |>>
          intention: ‹satisfy user's information need›
          then:
            emit: processing_complete
            with:
              type: 'query'
              success: true
```

## Best Practices

### 1. Clear Intentions

Always make your `understand:` blocks explain the user value:

```yaml
# Good
understand: ‹user wants clear error messages to debug quickly›

# Less helpful  
understand: ‹handle errors›
```

### 2. Meaningful Identifiers

Choose descriptive names for your identifiers:

```yaml
# Good
identifier: USER_INPUT_VALIDATOR

# Less clear
identifier: HANDLER_1
```

### 3. Proper Message Flow

Ensure every `emit:` has a corresponding `on:` handler:

```yaml
emit: task_complete    # Must have matching handler
# ...
respond:
  on: task_complete    # Handles the emission
```

### 4. State Organization

Keep related state together:

```yaml
state:
  user_data: {
    name: '',
    preferences: {},
    history: []
  }
  system_data: {
    version: '1.0',
    uptime: 0
  }
```

## Common Pitfalls

1. **Wrong Quote Types** - Each quote type has specific meaning
2. **Missing Required Elements** - Every `you:` needs possess/are/must/understand
3. **Bad Indentation** - Maintain consistent indentation
4. **Orphaned Messages** - Every emit needs a handler
5. **Direct State Mutation** - Use message passing instead

## Quick Reference

```yaml
# Component Structure
@component_name:
  you:
    possess:
      identifier: NAME
      state: {}           # Optional
      tools: []           # Optional
    are: ‹role›
    must:
      - ‹requirement 1›
      - ‹requirement 2›
    understand: ‹purpose›
    
    # Optional blocks
    extend: @parent       # Inheritance
    use:                  # State access
      state:
        - local_var
        - @other.var
    
    # Actions
    perform:              # Direct action
      through: ‹method›
      as: ‹output›
      intention: ‹goal›
    
    respond:              # Message handler
      on: message_name
      guard: condition    # Optional
      you:
        # Nested context

# Operators
name ::= pattern → transformation [EMITS: type]

# Messages
emit: message_name
with:
  key: value

# Conditionals  
then:
  emit: success
  when: condition
otherwise:
  emit: fallback
```

---

Remember: In INDRA, you're not writing instructions for a computer - you're writing a behavioral script that transforms the AI as it reads. Each line progressively narrows the behavioral space until the AI converges on your intended behavior.
