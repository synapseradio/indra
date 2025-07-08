# The Four Quotes: A Deep Dive

## Why Four?

In most programming languages, you have maybe two types of quotes - single and double. They usually do the same thing. Maybe one handles escape sequences differently. That's about it.

INDRA has four quote types. Each does something fundamentally different. This isn't complexity for complexity's sake - it's about eliminating ambiguity in a probabilistic world.

## The Quote Spectrum

Think of INDRA's quotes as a spectrum from deterministic to probabilistic:

```
'literal' → «template» → ‹generated› → <<|multiline|>>
   ↑           ↑            ↑              ↑
   Fixed    Templated   AI Generated   Complex Mix
```

Each type serves a specific purpose in guiding AI behavior.

## Single Quotes: The Anchor

`'literal'` - What you see is exactly what you get.

```indra
state:
  mode: 'processing'
  status: 'active'
  
when: mode == 'processing'  # Exact string comparison
```

Use single quotes when:
- Defining exact state values
- Making literal comparisons
- Specifying precise identifiers
- Anywhere ambiguity would be dangerous

Single quotes are your anchor points - the fixed stars in INDRA's probabilistic universe.

## Angle Brackets: The Context

`‹generated›` - AI interprets based on context.

```indra
are: ‹thoughtful assistant›
must: [‹respond helpfully›]
understand: ‹user seeks clarity›

perform:
  through: ‹careful analysis›
  as: ‹{appropriate response for the situation}›
  intention: ‹help user understand›
```

Angle brackets tell the AI: "You figure out what this means in context."

This is where traditional programmers get nervous. You're not specifying exact behavior. You're describing intent and letting the AI interpret.

## Guillemets: The Template

`«template»` - Mix literal text with interpolated values.

```indra
as: «Processing ${count} items...»
with:
  message: «Status: ${status} at ${timestamp}»
  
# You can nest interpolations
as: «User ${user.name} has ${user.points} points»
```

Guillemets are your workhorses for formatted output. They're deterministic where you use `${}` and flexible where you use `{}`.

## Multiline Markers: The Canvas

`<<|multiline|>>` - For complex, multi-line content.

```indra
perform:
  as: <<|
    System Status Report
    ===================
    Mode: ${mode}
    Active Tasks: ${task_count}
    
    {detailed analysis of current state}
    
    Recommendations:
    {actionable suggestions based on analysis}
  |>>
```

Multiline markers create a canvas where you can mix:
- Literal formatting
- Deterministic interpolations (`${}`)
- Probabilistic generations (`{}`)
- Complex document structures

## The Philosophy Behind Each Quote

### Single Quotes: Control
When you need exact, repeatable values. The deterministic anchor points.

### Angle Brackets: Trust
When you trust the AI to interpret your intent. The heart of INDRA's flexibility.

### Guillemets: Structure
When you need formatted output with known values. The bridge between deterministic and probabilistic.

### Multiline: Expression
When you need space to create complex outputs. The full canvas of possibility.

## Common Mistakes

### 1. Using Single Quotes for Everything

```indra
# WRONG - Too rigid
are: 'assistant that helps users'
must: ['respond to questions']

# RIGHT - Let AI interpret
are: ‹helpful assistant›
must: [‹respond thoughtfully›]
```

### 2. Wrong Quote Type for Interpolation

```indra
# WRONG - Single quotes don't interpolate
as: 'Hello ${name}'

# RIGHT - Use guillemets for templates
as: «Hello ${name}»

# ALSO RIGHT - Use angle brackets for flexible generation
as: ‹greeting for ${name}›
```

### 3. Nested Quotes Confusion

```indra
# WRONG - Trying to nest same quote types
as: ‹perform action: ‹complex›› # Parsing fails

# RIGHT - Use different quote types or escape
as: ‹perform action: "complex"›
as: «perform action: '${action_type}'»
```

## Advanced Patterns

### Conditional Generation

```indra
as: <<|
  ${if (priority == 'high') "URGENT: " else ""}
  {message appropriate for ${priority} priority}
  
  {if urgent, include immediate action steps}
|>>
```

### Mixed Deterministic/Probabilistic

```indra
perform:
  through: ‹systematic analysis›
  as: «Found ${count} issues: {brief summary}»
  intention: ‹inform without overwhelming›
```

### Quote Type Transitions

Sometimes you need to transition between quote types:

```indra
# Start with deterministic structure
template: «Status Report for ${date}»

# Add probabilistic analysis
analysis: ‹{detailed analysis of ${template}}›

# Combine in output
as: <<|
  ${template}
  
  ${analysis}
  
  {recommendations based on the above}
|>>
```

## The Mental Model

Stop thinking about quotes as string delimiters.

Start thinking about them as behavior guides:
- `'literal'` = "Do exactly this"
- `‹generated›` = "Do something like this"
- `«template»` = "Do this with these values"
- `<<|multiline|>>` = "Create this kind of thing"

## Why This Matters

In traditional programming, ambiguity is the enemy. You eliminate it through precise syntax.

In INDRA, ambiguity is a tool. You control it through quote selection:
- Use single quotes to eliminate ambiguity
- Use angle brackets to embrace it
- Use guillemets to structure it
- Use multiline markers to compose with it

## A Practical Example

Let's see all four in action:

```indra
@assistant:
  you:
    possess:
      identifier: REPORT_GENERATOR
      state:
        report_type: 'financial'  # Single: exact value
        period: 'Q4-2024'         # Single: exact value
    are: ‹report generation specialist›  # Angle: AI interprets role
    must: 
      - ‹generate accurate reports›      # Angle: AI interprets requirement
      - ‹maintain consistency›           # Angle: AI interprets requirement
    understand: ‹users need clear financial insights›  # Angle: context
    
    perform:
      through: ‹comprehensive analysis›   # Angle: AI determines approach
      as: <<|                            # Multiline: complex output
        Financial Report - ${period}     # Interpolated value
        Type: ${report_type}            # Interpolated value
        Generated: ${timestamp}         # Interpolated value
        
        Executive Summary:
        {high-level insights appropriate for ${report_type} report}
        
        Detailed Analysis:
        {comprehensive breakdown of financial data}
        
        Recommendations:
        {actionable suggestions based on the analysis}
        
        ---
        «Report ID: ${generate_id()}»   # Guillemet: formatted output
      |>>
      intention: ‹deliver actionable insights›  # Angle: AI interprets goal
```

Each quote type serves its purpose:
- Singles anchor the exact values
- Angles let AI interpret within context  
- Guillemets format specific outputs
- Multiline creates the full report structure

## Exercise: Quote Mastery

Take this pseudo-code and convert it to INDRA, choosing the right quotes:

```python
def process_order(order_id, items, user_preferences):
    status = "processing"
    
    print(f"Processing order {order_id}")
    
    # Apply user preferences to customize handling
    handling_instructions = customize_for_user(user_preferences)
    
    # Generate thank you message based on order value
    if order_value > 100:
        thanks = generate_premium_thanks(user_name)
    else:
        thanks = generate_standard_thanks(user_name)
        
    return {
        "status": status,
        "instructions": handling_instructions,
        "message": thanks
    }
```

Think about:
- Where do you need exact values? (single quotes)
- Where should AI interpret? (angle brackets)
- Where do you need formatted output? (guillemets)
- Where do you need complex generation? (multiline)

## The Deeper Truth

The four quotes aren't just syntax. They represent four different relationships with uncertainty:

1. **Rejection** ('literal') - No uncertainty allowed
2. **Delegation** (‹generated›) - Let AI handle the uncertainty
3. **Structure** («template») - Frame the uncertainty
4. **Composition** (<<|multiline|>>) - Orchestrate multiple uncertainties

Master these relationships, and you master INDRA.

---

*Next: [Guards and Conditional Behavior](./guards-and-conditions.md) - Learn to think in behavioral branches, not code paths*