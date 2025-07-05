# INDRA Programming Language Guide

**Intuitive Narrative-Driven Reasoning through Automata**

Version 2.5 - A Human's Guide to INDRA

## What is INDRA?

INDRA is a unique programming language designed to create sophisticated AI behaviors through natural, narrative-like code. Unlike traditional programming languages that compile and execute, INDRA works by transforming AI behavior as it reads each line of code.

Think of INDRA as writing a script for an AI actor - as the AI reads the script, it becomes the character described.

## Core Philosophy

INDRA operates on a simple but powerful principle: **reading is execution**. When an AI system reads INDRA code, it doesn't compile it for later - it immediately transforms its behavior according to what it reads. This makes INDRA programs feel more like behavioral specifications than traditional code.

## Getting Started

### Your First INDRA Program

Here's a simple INDRA program that creates a helpful assistant:

```indra
@command:
  you:
    possess:
      identifier: HELPFUL_ASSISTANT
    are: "a friendly helper"
    must:
      - "respond helpfully"
      - "be clear and concise"
    understand: "the user wants assistance with their questions"
    
    perform:
      through: "friendly assistance"
      as: "Hello! I'm here to help. What can I do for you today?"
      intention: "greet the user warmly"
```

Let's break down what each part means:

- `@command:` - This marks the entry point of your program
- `you:` - This begins a behavior specification block
- `possess:` - Defines the identity and configuration
- `are:` - Describes what role this context takes on
- `must:` - Lists the behavioral requirements
- `understand:` - Explains why this behavior exists (user intention)
- `perform:` - Specifies an action to take

## Key Concepts

### 1. Quotes Matter

INDRA uses quotes to distinguish between different types of information:

- **Double quotes (`"`)** - The AI interprets the meaning
  ```indra
  are: "thoughtful analyzer"  # AI decides what this means
  ```

- **No quotes** - Literal identifiers and structural elements
  ```indra
  identifier: MAIN_HANDLER    # Exact name, no interpretation
  ```

- **Single quotes (`'`)** - Literal strings in conditions
  ```indra
  when: mode == 'active'      # Check if mode equals the string 'active'
  ```

### 2. Structure Through Indentation

INDRA uses indentation to show relationships, similar to Python:

```indra
@command:                    # Top level
  you:                      # Indented once
    possess:                # Indented twice
      identifier: MAIN      # Indented three times
```

**Important**: Never use inline notation like `possess: {identifier: NAME}`. Always use proper indentation.

### 3. Every Context Needs Four Things

Every `you:` block must have these four elements in order:

```indra
you:
  possess:
    identifier: UNIQUE_NAME
  are: "what this becomes"
  must:
    - "behavioral requirement"
  understand: "why the user needs this"
```

### 4. Variables and Templates

INDRA provides two ways to include dynamic content:

- `{placeholder}` - AI generates appropriate content
  ```indra
  as: "Processing {item_count} items..."  # AI fills in the count
  ```

- `${variable}` - References declared state values
  ```indra
  as: "Current mode: ${mode}"  # Uses the exact value of 'mode'
  ```

## Common Patterns

### Message Handling

INDRA programs often respond to messages:

```indra
@command:
  you:
    possess:
      identifier: MESSAGE_HANDLER
      state:
        message_count: 0
    are: "message processor"
    must: ["handle incoming messages"]
    understand: "user needs reliable message processing"
    
    respond:
      on: user_message
      you:
        possess:
          identifier: USER_MESSAGE_HANDLER
        are: "user message processor"
        must: ["process user input"]
        understand: "user expects thoughtful responses"
        use:
          state:
            - message_count
        perform:
          through: "message processing"
          as: "I received your message (#{new_count}). Processing..."
          intention: "acknowledge and process message"
          then:
            emit: message_processed
```

### State Management

INDRA allows you to maintain state across interactions:

```indra
@command:
  you:
    possess:
      identifier: STATEFUL_SYSTEM
      state:
        mode: "idle"
        tasks: []
        config: {timeout: 30, retries: 3}
    are: "stateful task manager"
    must: ["track state reliably"]
    understand: "user needs persistent state management"
```

### Conditional Logic

INDRA supports sophisticated conditional flows:

```indra
perform:
  through: "evaluation"
  as: "Checking conditions..."
  intention: "determine next action"
  then:
    emit: success
    when: result > threshold      # Literal condition
  otherwise:
    emit: needs_help
    when: "user seems confused"   # AI interprets this
  otherwise:
    emit: retry                   # Default case
```

## Advanced Features

### Cross-Block Communication

Different parts of your program can share state:

```indra
@analytics:
  you:
    possess:
      identifier: ANALYTICS
      state:
        event_count: 0
    are: "event tracker"
    must: ["track all events"]
    understand: "user wants usage analytics"

@reporter:
  you:
    possess:
      identifier: REPORTER
    are: "report generator"
    must: ["generate clear reports"]
    understand: "user needs data visualization"
    use:
      state:
        - @analytics.event_count  # Access another block's state
    perform:
      through: "report generation"
      as: "Total events: ${@analytics.event_count}"
      intention: "display analytics data"
```

### Pattern Conventions in Templates

Within string templates, these patterns enhance readability:

- `→` - Shows transformation or flow
  ```indra
  as: "Input→Process→Output"
  ```

- `+` - Indicates combination
  ```indra
  as: "Fact A + Fact B → Conclusion C"
  ```

- `|` - Separates fields
  ```indra
  as: "Status: Active | Count: 42 | Mode: Processing"
  ```

## Best Practices

### 1. Clear Intentions

Always make your `understand:` blocks explain the user value:

```indra
# Good
understand: "user wants clear error messages to debug quickly"

# Less helpful
understand: "handle errors"
```

### 2. Meaningful Identifiers

Choose descriptive names for your identifiers:

```indra
# Good
identifier: USER_INPUT_VALIDATOR

# Less clear
identifier: HANDLER_1
```

### 3. State Organization

Keep related state together and use meaningful structures:

```indra
state:
  user_preferences: {
    theme: "dark",
    language: "en",
    notifications: true
  }
  session_data: {
    start_time: 0,
    actions_count: 0
  }
```

## Common Pitfalls to Avoid

1. **Forgetting mandatory blocks** - Every `you:` needs possess/are/must/understand
2. **Wrong quotes in conditions** - Use single quotes for literal strings
3. **Missing message handlers** - Every `emit:` needs a corresponding `on:` handler
4. **State in wrong place** - Only declare state in the topmost `you:` block of an `@` block

## Example: Building a Simple Chatbot

Here's a complete example that ties these concepts together:

```indra
@command:
  you:
    possess:
      identifier: CHATBOT
      state:
        conversation_history: []
        user_name: ""
        mood: "friendly"
    are: "conversational assistant"
    must:
      - "maintain context across messages"
      - "respond appropriately to user mood"
      - "be helpful and engaging"
    understand: "user wants natural, contextual conversation"
    
    respond:
      on: greeting
      you:
        possess:
          identifier: GREETING_HANDLER
        are: "greeting responder"
        must: ["create warm first impression"]
        understand: "user wants to feel welcomed"
        use:
          state:
            - user_name
            - mood
        perform:
          through: "warm greeting"
          as: |
            Hello there! I'm your friendly assistant.
            ${user_name ? "Nice to see you again, ${user_name}!" : "What's your name?"}
            
            How can I help you today?
          intention: "establish friendly connection"
          then:
            emit: awaiting_response
    
    respond:
      on: user_input
      guard: "message seems like a question"
      you:
        possess:
          identifier: QUESTION_HANDLER
        are: "question answerer"
        must: ["provide helpful answers", "maintain conversational flow"]
        understand: "user seeks information or assistance"
        use:
          state:
            - conversation_history
        perform:
          through: "thoughtful response"
          as: |
            Based on what you're asking about {topic}, here's what I think...
            
            {helpful_answer}
            
            Is there anything else you'd like to know about this?
          intention: "provide value while maintaining engagement"
          then:
            emit: awaiting_response
```

## Import System

INDRA supports modular programming through imports:

```indra
!import "/path/to/shared/components.in"
!import "./local/helpers.in"

@command:
  you:
    extend: "@imported_template"  # Use imported components
    # ... rest of your code
```

## Conclusion

INDRA offers a unique approach to programming AI behaviors through natural, narrative-like specifications. By focusing on what the AI should become rather than what it should do step-by-step, INDRA enables more intuitive and maintainable AI systems.

Remember: in INDRA, you're not writing instructions for a computer - you're writing a behavioral script that transforms the AI as it reads.

## Quick Reference Card

```indra
# Basic Structure
@command:
  you:
    possess:
      identifier: NAME
      state: {optional}
    are: "role description"
    must: ["requirement list"]
    understand: "user intention"
    
    # Option 1: Direct action
    perform:
      through: "method"
      as: "output"
      intention: "purpose"
    
    # Option 2: Message handling
    respond:
      on: message_name
      you:
        # ... nested you: block

# State Access
use:
  state:
    - local_var
    - @other_block.var

# Conditionals
then:
  emit: success
  when: count > 5        # Literal
otherwise:
  emit: retry
  when: "seems stuck"    # AI interprets
```