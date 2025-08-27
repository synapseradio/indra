# Writing Operators in INDRA

## Introduction

If you're coming from traditional programming, you might be looking for functions in INDRA. Stop. Take a breath. Forget functions.

In INDRA, we have **operators** - and they're fundamentally different. They are reusable, parameterized transformations.

This tutorial will help you understand how to write and use them effectively.

## The Mental Shift: From Functions to Operators

### Traditional Function (Deterministic Thinking)

```python
def italicize(text):
    return f"*{text}*"  # Always the same output
```

### INDRA Operator (Transformational Thinking)

```indra
# A simple, reusable text transformation
italicize(text) ::= <<|*$(text)*|>>

# A more powerful operator that uses generation
emphasize(text) ::= <<|<appropriately emphasized version of $(text)>|>>
```

The key insight: Operators are not just for deterministic manipulation; they are for creating reusable pieces of generative or transformational logic.

## Basic Operator Syntax

```indra
operator_name(param1, param2) ::= transformation
```

Let's break this down:

- `operator_name` - How you'll call the operator.
- `(param1, param2)` - A list of named parameters.
- `::=` - The definition operator (think "is defined as").
- `transformation` - The template that defines what the operator produces. This can be any of the four quote types.

## Your First Operators

### Simple Formatting Operators

```indra
# Simple, reusable transformations
italicize(text) ::= <<|*$(text)*|>>
bold(text) ::= <<|**$(text)**|>>

# An operator that uses generation
format_quote(text, author) ::= <<|"<$(text)>" - $(author)|>>
```

### Operators for Data

```indra
# An operator that generates a summary
summarize_values(values) ::= <<|<a meaningful summary of the following values: $(values)>|>>

# An operator that generates a structured object
interpret_metrics(data) ::= <<|
  insight: <what these numbers actually mean>,
  context: <why these patterns matter>,
  action: <what to do based on this understanding>
|>>
```

## Using Operators in Components

You invoke an operator by its name, passing arguments by key:value.

```indra
# text_processor.in

# --- Operators ---
italicize(text) ::= <<|*$(text)*|>>
bold(text) ::= <<|**$(text)**|>>

# --- actor ---
actor @formatter:
  identity: "intelligent text formatter"
  rules:
    - "apply context-appropriate formatting"
  perform:
    method: "intelligent formatting"
    output: <<|
      Original: $(&context.input_text)
      
      Formatted Options:
      - Italic: $(italicize(text: &context.input_text))
      - Bold: $(bold(text: &context.input_text))
      
      Recommended: <choose the best format based on the text and explain why>
    |>>
    goal: "provide formatting options"
    then:
      say:
        to: @user
        what: 'formatting_complete'
```

## Advanced Operators: Sequence Operators

For more complex, multi-step reusable logic, you can define a `sequence` operator.

```indra
sequence analyze_and_report(topic) ::=
  step:
    as: @researcher # Assumes a researcher persona is defined
    output: <<|Now researching: $(topic)|>>
    set:
      &context.research_findings: <key findings about $(topic)>
  step:
    as: @analyst # Assumes an analyst persona is defined
    output: <<|Analyzing the findings...|>>
    set:
      &context.analysis: <synthesis of the findings in &context.research_findings>
  step:
    as: self
    output: <<|
      ### Report on $(topic)
      
      **Analysis:**
      $(&context.analysis)
    |>>

# An actor can then invoke this entire sequence
actor @reporter:
  identity: "an automated reporting actor"
  perform:
    method: "automated research and analysis"
    sequence: analyze_and_report(topic: &context.user_query)
    goal: "to produce a complete report"
    then:
      say:
        to: @user
        what: 'report_complete'
```

## Best Practices for Operators

### 1. Name Operators by Intent, Not Implementation

```indra
# Bad - describes HOW
# multiply_by_1_08(amount) ::= ...

# Good - describes WHAT/WHY
apply_tax(amount) ::= <<|<amount with appropriate tax applied>|>>
format_as_currency(value) ::= <<|<value formatted as currency for the current locale>|>>
```

### 2. Compose Operators

```indra
# Base operators
trim(text) ::= <<|$(text.trim())|>>
lowercase(text) ::= <<|$(text.toLowerCase())|>>

# Composed operator
normalize(text) ::= <<|$(lowercase(trim(text)))|>>
```

## Common Patterns

### Validation Pattern

```indra
# Returns a boolean-like string, but could also generate advice
validate_email(email) ::= <<|$(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))|>>
```

### Aggregation Pattern

```indra
aggregate_metrics(metrics) ::= <<|
  total: $(metrics.reduce((a,b) => a + b, 0)),
  average: $(total / metrics.length),
  interpretation: <what these numbers mean in context>
|>>
```

## The Golden Rule

**If you find yourself writing a very long, complex `perform` or `sequence` block, consider refactoring parts of it into a reusable operator.**

Operators are the primary tool in INDRA for creating clean, modular, and reusable behavioral logic.

---

*This tutorial is part of the INDRA documentation. For more, see the [main tutorials page](./README.md).*
---

*Prerequisites: [The Four Quotes](./five-quotes.md), [Message Passing](./message-passing.md)*
---

*Related: [Thinking in Transformations](./thinking-in-transformations.md)*
---
