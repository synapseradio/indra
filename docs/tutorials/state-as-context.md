# State as Context, Not Storage

## The Variable Trap

In traditional programming, state is storage:

```python
# Traditional thinking
count = 0
count = count + 1  # Mutation
user_name = "Alice"
user_name = "Bob"  # Reassignment
```

You think of variables as boxes that hold values. You put things in, take things out, change what's inside.

**INDRA doesn't work this way. At all.**

## State Is Behavioral Context

In INDRA, state isn't what you *have*, it's the context in which you *behave*:

```indra
@greeter:
  you:
    possess:
      identifier: GREETER
      state:
        mood: 'cheerful'
        energy_level: 'high'
    are: ‹contextual greeter›
    must: [‹greet appropriately for context›]
    understand: ‹greetings should match the situation›
    
    perform:
      through: ‹contextual greeting›
      as: ‹{greeting that reflects current mood and energy}›
      intention: ‹establish appropriate tone›
```

The `mood` and `energy_level` aren't variables to manipulate. They're context that influences how the greeter behaves.

## Why You Can't Mutate State

Here's what traditional programmers try:

```indra
# WRONG - This isn't how INDRA works
respond:
  on: user_arrived
  you:
    perform:
      through: ‹welcome›
      as: <<|
        Welcome!
        ${state.visitor_count = state.visitor_count + 1}  # NO!
        You are visitor number ${state.visitor_count}
      |>>
```

This fails because:
1. State isn't mutable storage
2. You can't assign within templates
3. You're thinking imperatively in a declarative world

## State Flows Through Messages

Instead of mutating state, you evolve it through message passing:

```indra
@visitor_tracker:
  you:
    possess:
      identifier: VISITOR_TRACKER
      state:
        visitor_count: 0
    are: ‹visitor counter›
    must: [‹track visitor arrivals›]
    understand: ‹accurate counts matter›
    
    respond:
      on: visitor_arrived
      you:
        possess:
          identifier: ARRIVAL_HANDLER
        are: ‹arrival processor›
        must: [‹acknowledge new visitors›]
        understand: ‹each visitor is important›
        perform:
          through: ‹visitor registration›
          as: ‹Registering your arrival...›
          intention: ‹track visitor›
          then:
            emit: visitor_registered
            with:
              new_count: «${visitor_count + 1}»
    
    respond:
      on: visitor_registered
      you:
        possess:
          identifier: COUNT_UPDATER
          state:
            visitor_count: «${new_count}»  # State evolution through context
        are: ‹count maintainer›
        must: [‹maintain accurate count›]
        understand: ‹counts should reflect reality›
        perform:
          through: ‹count announcement›
          as: ‹You are visitor number ${visitor_count}!›
          intention: ‹inform of position›
```

*→ visitor_arrived*
*→ visitor_registered*

See what happened? The state didn't mutate. A new context was created with the updated count.

## The `with:` Pattern

The `with:` block is how state flows through your system:

```indra
# State flows from one context to another
emit: process_order
with:
  order_id: «${current_order}»
  customer: «${customer_data}»
  status: 'pending'

# The handler receives this state
respond:
  on: process_order
  you:
    # This handler has access to order_id, customer, and status
    # They become part of its behavioral context
```

Think of `with:` as creating a new context bubble, not passing variables.

## State Evolution, Not Mutation

Traditional thinking (mutation):
```python
user = {"name": "Alice", "score": 0}
user["score"] += 10  # Mutate in place
```

INDRA thinking (evolution):
```indra
respond:
  on: points_earned
  you:
    perform:
      through: ‹score tracking›
      as: ‹Recording ${points} points earned...›
      intention: ‹acknowledge achievement›
      then:
        emit: score_updated
        with:
          user_name: «${user.name}»
          new_score: «${user.score + points}»
          change: «+${points}»

respond:
  on: score_updated
  you:
    possess:
      state:
        user: {
          name: «${user_name}»,
          score: «${new_score}»
        }
    perform:
      through: ‹score announcement›
      as: ‹${user.name} now has ${user.score} points! (${change})›
      intention: ‹celebrate progress›
```

The user's score doesn't mutate. A new context is created where the user has a different score.

## State as Behavioral Influence

State in INDRA influences behavior, it doesn't control it:

```indra
@assistant:
  you:
    possess:
      identifier: CONTEXTUAL_ASSISTANT
      state:
        expertise_level: 'beginner'
        verbosity: 'high'
        patience: 'infinite'
    are: ‹adaptive assistant›
    must: [‹adjust communication to context›]
    understand: ‹different contexts need different approaches›
    
    respond:
      on: question_asked
      you:
        perform:
          through: ‹contextual response›
          as: ‹{answer appropriate for ${expertise_level} with ${verbosity} detail}›
          intention: ‹help at the right level›
```

The state doesn't determine the exact response. It influences how the assistant interprets its role.

## The Anti-Pattern: State as Control

What traditional programmers try:

```indra
# ANTI-PATTERN - Don't do this!
state:
  mode: 'processing'
  step: 1
  
perform:
  as: <<|
    ${if (step == 1) "Starting..." else if (step == 2) "Working..." else "Done!"}
    ${step = step + 1}  # NO! Can't mutate!
  |>>
```

This is trying to use state as control flow. INDRA doesn't work this way.

Instead:

```indra
respond:
  on: process_started
  you:
    perform:
      through: ‹process initiation›
      as: ‹Starting your process...›
      intention: ‹begin work›
      then:
        emit: step_completed
        with:
          phase: 'started'

respond:
  on: step_completed
  guard: phase == 'started'
  you:
    perform:
      through: ‹main processing›
      as: ‹Working on your request...›
      intention: ‹do the work›
      then:
        emit: step_completed
        with:
          phase: 'working'

respond:
  on: step_completed
  guard: phase == 'working'
  you:
    perform:
      through: ‹completion›
      as: ‹Process complete!›
      intention: ‹wrap up›
```

State describes context, not control flow.

## Cross-Component State

State can be shared across components as context:

```indra
@environment:
  you:
    possess:
      identifier: ENVIRONMENT
      state:
        temperature: 'warm'
        time_of_day: 'evening'
        mood: 'relaxed'
    are: ‹environmental context›
    must: [‹maintain ambiance›]
    understand: ‹atmosphere affects interactions›

@conversationalist:
  you:
    possess:
      identifier: CONVERSATIONALIST
    are: ‹context-aware speaker›
    must: [‹adapt to environment›]
    understand: ‹context shapes communication›
    use:
      state:
        - @environment.temperature
        - @environment.mood
    
    perform:
      through: ‹contextual communication›
      as: ‹{conversation appropriate for ${temperature} ${mood} atmosphere}›
      intention: ‹match the vibe›
```

State is shared as context, not as mutable global variables.

## Exercise: Reframe Your State Thinking

Take this traditional stateful code:

```python
class ShoppingCart:
    def __init__(self):
        self.items = []
        self.total = 0
        
    def add_item(self, item, price):
        self.items.append(item)
        self.total += price
        
    def remove_item(self, item, price):
        self.items.remove(item)
        self.total -= price
        
    def checkout(self):
        if self.total > 0:
            return f"Total: ${self.total}"
        return "Cart is empty"
```

Now stop thinking about:
- Variables that store values
- Methods that mutate state
- Objects that encapsulate mutable data

Start thinking about:
- Contexts that influence behavior
- Messages that carry context forward
- Evolution through conversation

How would a shopping experience unfold as a series of contexts rather than mutations?

## The Mental Shift

Stop thinking: "State is data I store and change"
Start thinking: "State is context that influences behavior"

Stop thinking: "I mutate variables"
Start thinking: "I evolve context through messages"

Stop thinking: "State determines behavior"
Start thinking: "State influences interpretation"

## A Final Insight

In traditional programming, state is like furniture in a room. You move it around, add pieces, remove pieces. The room is passive.

In INDRA, state is like the weather. It influences everything but controls nothing. You don't change the weather; you work with it, and it evolves naturally through the system.

Which one feels more like how intelligence actually works?

---

*Next: [The Four Quotes: A Deep Dive](./four-quotes.md) - Understanding INDRA's subtle but crucial quote system*