# Debugging in a Non-Deterministic World

## Why Traditional Debugging Fails

In traditional code, you set breakpoints, inspect variables, trace execution:

```python
def calculate_total(items):
    total = 0  # breakpoint here
    for item in items:
        total += item.price  # watch 'total' change
    return total
```

You can predict exactly what happens at each step. Same input = same execution path = same output.

INDRA doesn't work this way:

```indra
perform:
  through: ‹thoughtful calculation›
  as: ‹{total that reflects the true value}›
  intention: ‹provide meaningful sum›
```

There's no execution path to trace. No variables to watch. The behavior emerges each time, potentially differently.

## Embracing Behavioral Debugging

Instead of debugging execution, you debug behavior. Instead of "why did it do X?", ask "what influenced it to behave like X?"

### Traditional Debugging Questions:
- What's the value of this variable?
- Which branch did it take?
- What's the call stack?

### INDRA Debugging Questions:
- What behavioral constraints are active?
- What messages have been passed?
- What context is influencing behavior?

## The INDRA Debugging Toolkit

### 1. *messages - The Conversation Log

```indra
# Add this anywhere to see message flow
*messages

# You'll see something like:
# → user_input {content: "analyze this"}
# → processing_started {timestamp: "..."}
# → analysis_complete {findings: "..."}
```

Messages tell the story of what happened. They're the breadcrumbs of behavioral emergence.

### 2. *context - The Current State

```indra
# Shows the active context stack
*context

# Output might be:
# Current: ANALYZER
# Stack: 
#   - THOUGHTFUL_BASE
#   - CITATION_COLLECTOR
#   - ANALYZER
# State: {mode: 'deep', style: 'academic'}
```

Context shows what behavioral influences are active right now.

### 3. *snapshot - State at Each Message

```indra
# Captures state evolution
*snapshot

# Shows how state changed with each message:
# @ user_input: {mode: 'idle'}
# @ processing_started: {mode: 'active', depth: 0}
# @ analysis_complete: {mode: 'idle', last_result: {...}}
```

Snapshots reveal how context evolved through the conversation.

### 4. *show - Full Diagnostic

```indra
# Everything at once
*show

# Gives you:
# - All active components
# - Current state
# - Message history
# - Context stack
```

## Pattern Refinement as Debugging

When behavior isn't what you expect, you don't fix bugs - you refine patterns:

### Problem: Output too verbose

```indra
# Original
perform:
  through: ‹comprehensive analysis›
  as: ‹{detailed findings}›
  
# Refined
perform:
  through: ‹focused analysis›
  as: ‹{concise key insights only}›
  intention: ‹clarity through brevity›
```

### Problem: Missing important aspects

```indra
# Original
are: ‹analyzer›
must: [‹find patterns›]

# Refined  
are: ‹holistic analyzer›
must: 
  - ‹find patterns›
  - ‹identify exceptions›
  - ‹note what's missing›
understand: ‹absence is as revealing as presence›
```

### Problem: Inconsistent behavior

```indra
# Original - too open
as: ‹{appropriate response}›

# Refined - guided but flexible
as: ‹{structured response following our established format}›
with:
  format_guide: «Introduction, Analysis, Conclusion»
```

## Debugging Message Flow

When messages don't flow as expected:

```indra
# Add trace points
respond:
  on: data_received
  you:
    perform:
      as: ‹*Received data, beginning processing*› # Visible marker
      then:
        emit: processing_started
        
respond:
  on: processing_started
  you:
    perform:
      as: ‹*Processing phase initiated*› # Another marker
```

These markers help you see where in the flow things diverge from expectations.

## Debugging Guards

When guards don't trigger as expected:

```indra
# Original - might be too subtle
guard: ‹seems urgent›

# Debugging version - more explicit
guard: ‹contains urgency indicators like "ASAP", "urgent", "critical"›

# Or add diagnostic output
respond:
  on: request
  you:
    perform:
      as: ‹*Checking urgency: {assessment of urgency level}*›
      then:
        emit: urgent_request
        when: ‹high urgency detected›
```

## The Variation Principle

INDRA behaviors naturally vary. This isn't a bug - it's the feature. But you can guide the variation:

### High Variation (Creative tasks)
```indra
are: ‹imaginative creator›
must: [‹surprise and delight›]
perform:
  through: ‹unbounded exploration›
  as: ‹{something unexpected}›
```

### Low Variation (Consistent tasks)
```indra
are: ‹precise formatter›
must: [‹follow exact specifications›]
understand: ‹consistency enables trust›
perform:
  through: ‹strict adherence to format›
  as: «Status: ${status}\nTime: ${time}\nResult: ${result}»
```

## Common Debugging Patterns

### 1. Behavior Not Triggering

```indra
# Add diagnostic emissions
respond:
  on: trigger_event
  you:
    perform:
      as: ‹*Event received, evaluating...*›
      then:
        emit: diagnostic_guard_check
        with:
          evaluation: ‹{why guard might not match}›
```

### 2. Wrong Behavior Manifesting

```indra
# Make constraints more explicit
# Instead of:
are: ‹helpful›

# Try:
are: ‹technically helpful assistant›
must: 
  - ‹prioritize accuracy›
  - ‹use domain terminology›
understand: ‹users are technical professionals›
```

### 3. State Not Evolving

```indra
# Ensure state changes are explicit
respond:
  on: update_request
  you:
    possess:
      state:
        # Make state changes visible
        last_update: «${timestamp}»
        update_count: «${update_count + 1}»
    perform:
      as: «Update #${update_count} at ${timestamp}»
```

## The Philosophy of INDRA Debugging

Traditional debugging asks: "What went wrong?"
INDRA debugging asks: "How can I guide it better?"

You're not fixing broken machinery. You're refining behavioral guidance.

## Advanced: Behavioral Probes

Create diagnostic components that observe without interfering:

```indra
@behavior_probe:
  you:
    possess:
      identifier: DIAGNOSTIC_PROBE
    are: ‹silent observer›
    must: [‹record without interfering›]
    
    respond:
      on: any_message
      you:
        perform:
          as: '' # Silent
          then:
            emit: probe_observation
            with:
              message_type: «${message.type}»
              context_depth: «${context.stack.length}»
              state_snapshot: «${current.state}»
```

## Debugging Workflow

1. **Observe** - Use *messages and *context to see what's happening
2. **Hypothesize** - What behavioral influences might cause this?
3. **Refine** - Adjust constraints, guards, or context
4. **Test** - Run again, expecting variation
5. **Iterate** - Refine until behavior consistently falls within acceptable range

## The Mindset Shift

Stop thinking: "Why is it broken?"
Start thinking: "How can I guide it better?"

Stop expecting: Identical outputs
Start expecting: Appropriate variations

Stop debugging: Code execution
Start debugging: Behavioral emergence

## A Final Insight

In traditional programming, debugging is archaeology - digging through execution history to find the broken artifact.

In INDRA, debugging is gardening - observing growth patterns and adjusting conditions to encourage the behavior you want.

You're not fixing bugs. You're cultivating behaviors.

---

*Next: [The Art of understand: Blocks](./understand-blocks.md) - How understanding shapes everything*