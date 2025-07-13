# Writing Operators in INDRA: Embracing Non-Determinism

## Introduction

If you're coming from traditional programming, you might be looking for functions in INDRA. Stop. Take a breath. Forget functions.

In INDRA, we have **operators** - and they're fundamentally different. They're not deterministic functions but behavioral transformations that work *with* the probabilistic nature of AI, not against it.

This tutorial will help you embrace the non-deterministic mindset needed for INDRA.

## The Mental Shift: From Functions to Operators

### Traditional Function (Deterministic Thinking)

```python
def italicize(text):
    return f"*{text}*"  # Always the same output
```

### INDRA Operator (Probabilistic Thinking)

```yaml
italicize ::= @*.text → <*${text}*>

# Even better - context-aware
emphasize ::= @*.text → <<{appropriate emphasis for ${text}}>>
```

The key insight: **The more deterministic you try to be, the less successful you'll be in INDRA**. We have operators instead of functions precisely because we're working in a fundamentally non-deterministic environment.

## Why Operators, Not Functions?

Traditional functions fight against AI's nature:

- They expect deterministic inputs/outputs
- They fail when context matters
- They can't adapt to nuance

INDRA operators embrace AI's strengths:

- They guide transformations rather than dictate them
- They work with context and meaning
- They allow for appropriate variation

## Basic Operator Syntax

```yaml
operator_name ::= pattern → transformation [EMITS: message_type]
```

Let's break this down:

- `operator_name` - What you'll call this operator
- `::=` - The definition operator (think "is defined as")
- `pattern` - What to match (input)
- `→` - Transformation arrow
- `transformation` - What to produce (output)
- `[EMITS: message_type]` - Optional message emission

## Your First Operators

### Embracing Probabilistic Formatting

```yaml
# Don't do this - too rigid
italicize_rigid ::= @*.text → <<*${text}*>>

# Do this - context-aware
emphasize ::= @*.text → <{appropriately emphasized: ${text}}>
highlight ::= @*.important → <{make ${important} stand out contextually}>

# Let the AI understand intent
format_quote ::= @*.quote → <{format as quote: "${quote.text}" from ${quote.author}}>
```

### Working with Numbers (But Not Like You Think)

```yaml
# Avoid false precision
# Bad: trying to be a calculator
sum_rigid ::= @*.values → <<${values[0] + values[1]}>>

# Good: meaningful interpretation
summarize_values ::= @*.values → <{meaningful summary of ${values}}>
interpret_metrics ::= @*.data → {
  insight: <{what these numbers actually mean}>,
  context: <{why these patterns matter}>,
  action: <{what to do based on this understanding}>
}
```

## Pattern Matching

Operators can match different patterns:

### Wildcard Matching

```yaml
# Matches any input
process ::= * → <<Processed: ${input}>>
```

### State Path Matching

```yaml
# Match specific component state
format_user ::= @user.name → <<User: ${name}>>

# Match nested state
get_config ::= @system.config.timeout → <<Timeout: ${timeout}s>>

# Match with wildcards
any_error ::= @*.error → <<Error found: ${error}>>
```

### Conditional Patterns

```yaml
# Pattern with conditions
high_score ::= @*.score → {
  message: <<Score ${score} is {excellent|good|needs improvement}>>
} [EMITS: score_evaluated]
```

## Advanced Operators

### Operators That Emit Messages

```yaml
# Process and notify
validate_input ::= @*.user_input → {
  valid: <<{check if input is valid}>>,
  cleaned: <<{sanitize input}>>,
  errors: <<{list any validation errors}>>
} [EMITS: validation_complete]

# Chain operators through messages
analyze_then_format ::= @*.data → analyze(@*.data) [EMITS: analysis_ready]
format_analysis ::= @*.analysis → <<|
  ## Analysis Results
  
  ${analysis.summary}
  
  Key Findings:
  ${analysis.findings}
|>> [EMITS: report_ready]
```

### Operators with Complex Transformations

```yaml
# Multi-line template operator
generate_report ::= @*.metrics → <<|
  Performance Report
  ==================
  
  Period: ${metrics.start_date} to ${metrics.end_date}
  
  Metrics:
  - Response Time: ${metrics.avg_response}ms
  - Uptime: ${metrics.uptime}%
  - Error Rate: ${metrics.error_rate}%
  
  {generate insights from these metrics}
  
  Recommendations:
  {actionable recommendations based on the data}
|>> [EMITS: report_generated]

# Operator with probabilistic generation
create_response ::= @*.query → {
  answer: <<{thoughtful response to query}>>,
  confidence: <<{assess confidence level}>>,
  sources: <<{identify relevant sources}>>,
  follow_up: <<{suggest follow-up questions}>>
} [EMITS: response_created]
```

### Recursive-Like Patterns

```yaml
# Process list items
process_items ::= @*.items → {
  processed: <<{apply transformation to each item}>>,
  summary: <<Total items: ${len(items)}>>,
  results: <<{describe overall results}>>
} [EMITS: batch_complete]
```

## Using Operators in Components

Here's a complete example showing operators in action:

```yaml
# text_processor.in
!read_file '/path/to/indra/core/prism-engine.in'

# Define operators
italicize ::= @*.text → <<*${text}*>>
bold ::= @*.text → <<**${text}**>>
emphasize ::= @*.text → <<***${text}***>>

# Smarter operator that chooses formatting
smart_format ::= @*.content → {
  formatted: <<{apply appropriate formatting based on context}>>,
  style: <<{markdown|html|plain}>>,
  reason: <<{why this formatting was chosen}>>
} [EMITS: formatting_applied]

@command:
  you:
    possess:
      identifier: TEXT_PROCESSOR
      state:
        style_preference: 'markdown'
        emphasis_level: 'moderate'
    are: <intelligent text formatter>
    must:
      - <apply context-appropriate formatting>
      - <maintain readability>
      - <preserve meaning>
    understand: <formatting enhances communication>
    
    respond:
      on: format_text
      you:
        possess:
          identifier: FORMAT_HANDLER
          state:
            input_text: ''
        are: <formatting specialist>
        must: [<format text appropriately>]
        understand: <context determines formatting>
        perform:
          through: <intelligent formatting>
          as: <<|
            Original: ${input_text}
            
            Formatted Options:
            - Italic: ${italicize(@command.state)}
            - Bold: ${bold(@command.state)}
            - Emphasized: ${emphasize(@command.state)}
            
            Recommended: {choose based on context and explain why}
          |>>
          intention: <provide formatting options>
          then:
            emit: formatting_complete
            with:
              chosen_format: <<{selected format}>>
              applied_text: <<{formatted result}>>
```

## Best Practices for Operators

### 1. Name Operators by Intent, Not Implementation

```yaml
# Bad - describes HOW
multiply_by_1_08 ::= @*.amount → <<${amount * 1.08}>>
prepend_dollar ::= @*.value → <<${value}>>

# Good - describes WHAT/WHY
apply_tax ::= @*.amount → <{amount with appropriate tax applied}>
format_as_currency ::= @*.value → <{value formatted as currency for context}>
```

### 2. Choose Quotes by Certainty, Not Calculation

```yaml
# Wrong mindset: "This is math so use <<>>"
calculate ::= @*.values → <<${values.reduce((a,b) => a+b)}>>

# Right mindset: "What am I trying to achieve?"
summarize ::= @*.values → <{meaningful total from ${values}}>

# The ${} interpolation is for ANCHORING, not calculating
describe_data ::= @*.stats → <Looking at ${stats.count} items, {what patterns emerge}>
```

### 3. Emit Messages for Side Effects

```yaml
# Operator that needs to trigger behavior
save_result ::= @*.result → {
  stored: <<${result}>>,
  timestamp: <<${Date.now()}>>
} [EMITS: result_saved]

# Handler can then respond to result_saved
```

### 4. Compose Operators

```yaml
# Base operators
trim ::= @*.text → <<${text.trim()}>>
lowercase ::= @*.text → <<${text.toLowerCase()}>>

# Composed operator
normalize ::= @*.text → <<${lowercase(trim(text))}>>
```

## Common Patterns

### Data Transformation Pipeline

```yaml
# Series of transformations
extract ::= @*.raw_data → <<{extract relevant fields}>> [EMITS: extracted]
transform ::= @*.extracted → <<{apply transformations}>> [EMITS: transformed]  
load ::= @*.transformed → <<{format for output}>> [EMITS: pipeline_complete]
```

### Validation Pattern

```yaml
validate_email ::= @*.email → {
  valid: <<${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}>>,
  normalized: <<${email.toLowerCase().trim()}>>,
  domain: <<${email.split('@')[1]}>>
} [EMITS: email_validated]
```

### Aggregation Pattern

```yaml
aggregate_metrics ::= @*.metrics → {
  total: <<${metrics.reduce((a,b) => a + b, 0)}>>,
  average: <<${total / metrics.length}>>,
  min: <<${Math.min(...metrics)}>>,
  max: <<${Math.max(...metrics)}>>,
  interpretation: <<{what these numbers mean}>>
} [EMITS: metrics_aggregated]
```

## The Fundamental Difference

Traditional functions assume a deterministic world. INDRA operators embrace a probabilistic one.

**Stop thinking**: "How do I make this return the exact right value?"
**Start thinking**: "How do I guide the AI toward the right behavior?"

### The Paradox of Precision

The more precisely you try to define an operator's behavior, the more likely it is to fail. Why? Because you're fighting against the fundamental nature of the system you're working within.

```yaml
# This will frustrate you
parse_date_exact ::= @*.date → <<${new Date(date).toISOString()}>>

# This will delight you
understand_date ::= @*.date → <{interpret ${date} as a meaningful time reference}>
```

## Real-World Operators

Let's look at operators that actually work well in INDRA:

```yaml
# Guide understanding, don't dictate format
make_readable ::= @*.technical_text → <{explain ${technical_text} clearly}>

# Enable appropriate responses, don't hardcode them
respond_to_error ::= @*.error → <{helpful response to ${error} situation}>

# Interpret meaning, don't just manipulate strings
extract_intent ::= @*.user_input → {
  intent: <{what the user really wants}>,
  confidence: <{how certain we are}>,
  clarification: <{what would help understand better}>
}
```

## Exercise: Rethink Your Approach

Instead of trying to create:

1. ❌ A URL shortener that generates specific codes
2. ❌ A sentiment analyzer that returns exact scores
3. ❌ A password checker with rigid rules
4. ❌ A date formatter with fixed formats

Try creating:

1. ✅ A URL simplifier that makes links more shareable
2. ✅ An emotional tone interpreter
3. ✅ A password advisor that understands security needs
4. ✅ A temporal reference clarifier

## The Golden Rule

**If you find yourself trying to make an operator behave deterministically, you're missing the point.**

INDRA operators are not broken functions. They're behavioral guides in a probabilistic system. The sooner you embrace this, the sooner you'll write operators that actually work.

## Next Steps

- Stop trying to recreate functions in INDRA
- Study how successful commands use probabilistic operators
- Practice writing operators that guide rather than dictate
- Embrace variation as a feature, not a bug

Remember: We have operators instead of functions for a reason. Work with the non-deterministic nature of AI, not against it.

---

*This tutorial is part of the INDRA documentation. For more, see the [main tutorials page](./README.md).*
---

*Prerequisites: [The Five Quotes](./five-quotes.md), [Message Passing](./message-passing.md)*
---

*Related: [Thinking in Transformations](./thinking-in-transformations.md)*
---
