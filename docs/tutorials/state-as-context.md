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

In INDRA, state isn't what you *have*, it's the context in which you *behave*. All state is stored in the global `&context` object.

```indra
# context block
context: {
  greeter: {
    mood: 'cheerful',
    energy_level: 'high'
  }
}

agent @greeter:
  identity: "contextual greeter"
  rules:
    - "greet appropriately for context"
  understands:
    - "greetings should match the situation"
  perform:
    method: "contextual greeting"
    output: <<|<greeting that reflects a $(&context.greeter.mood) mood and $(&context.greeter.energy_level) energy>|>>
    goal: "establish appropriate tone"
```

The `mood` and `energy_level` in the context influence how the greeter behaves.

## Why You Can't Mutate State Directly

Here's what traditional programmers try:

```indra
# WRONG - This isn't how INDRA works
perform:
  method: "welcome"
  output: <<|
    Welcome!
    # The following line is invalid syntax
    &context.visitor_count = &context.visitor_count + 1
    You are visitor number $(&context.visitor_count)
  |>>
```

This fails because state is immutable within a turn. You cannot reassign a context variable.

## State Evolves Through `set`

Instead of mutating state, you evolve it for the *next* turn using the `set:` block.

```indra
agent @visitor_tracker:
  identity: "visitor counter"
  rules:
    - "track visitor arrivals"
  understands:
    - "accurate counts matter"
  perform:
    method: "visitor registration"
    output: <<|Registering your arrival... You are visitor number $(&context.visitor_count + 1)!|>>
    goal: "track and announce visitor"
    then:
      set:
        &context.visitor_count: &context.visitor_count + 1
      say:
        to: @next_agent
        what: 'visitor_registered'
```

See what happened? The state didn't mutate during the `perform` block. The `set:` block stages a change that will be applied *before the next turn begins*.

## The `with:` Pattern in Dialogues

The `with:` block in a `dialogue` definition is how you initialize the context for a specific conversational flow.

```indra
dialogue process_order_flow:
  start: @order_processor
  with:
    context:
      order_id: "XYZ-123"
      customer: { name: "Alice" }
      status: 'pending'

# The @order_processor agent will start its first turn
# with these values already in the &context.
```

Think of `with:` as setting up the initial scene for the conversation.

## State Evolution, Not Mutation

Traditional thinking (mutation):
```python
user = {"name": "Alice", "score": 0}
user["score"] += 10  # Mutate in place
```

INDRA thinking (evolution):
```indra
agent @score_updater:
  perform:
    method: "score tracking"
    output: <<|Recording $(&context.points_earned) points earned...|>>
    goal: "acknowledge achievement"
    then:
      set:
        &context.user.score: &context.user.score + &context.points_earned
      say:
        to: @score_announcer
        what: 'score_updated'

agent @score_announcer:
  perform:
    method: "score announcement"
    output: <<|$(user.name) now has $(user.score) points! (+$(points_earned))|>>
    goal: "celebrate progress"
    then:
      say:
        to: @next_agent
        what: 'continue'
```

The user's score doesn't mutate. A new context is created for the next turn where the user has a different score.

## State as Behavioral Influence

State in INDRA influences behavior, it doesn't rigidly control it:

```indra
agent @assistant:
  identity: "adaptive assistant"
  rules:
    - "adjust communication to context"
  understands:
    - "different contexts need different approaches"
  perform:
    method: "contextual response"
    output: <<|<answer appropriate for a $(&context.user.expertise_level) user with $(&context.user.verbosity) detail>|>>
    goal: "help at the right level"
```

The context doesn't determine the exact response. It influences how the assistant interprets its role and generates its output.

## The Anti-Pattern: State as Control Flow

What traditional programmers try:

```indra
# ANTI-PATTERN - Don't do this!
perform:
  output: <<|
    $(if (&context.step is 1) "Starting..." else if (&context.step is 2) "Working..." else "Done!")
  |>>
  then:
    set:
      &context.step: &context.step + 1 # Trying to force a sequence
    say:
      to: @self
      what: 'continue'
```

This is trying to use state as a program counter. INDRA's turn-based `say:` accomplishes this more naturally.

Instead, use a sequence of agents:

```indra
agent @process_starter:
  perform:
    method: "process initiation"
    output: <<|Starting your process...|>>
    goal: "begin work"
    then:
      say:
        to: @main_processor
        what: 'step_1_complete'

agent @main_processor:
  perform:
    method: "main processing"
    output: <<|Working on your request...|>>
    goal: "do the work"
    then:
      say:
        to: @process_completer
        what: 'step_2_complete'
```

State describes context, not control flow.

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
- A global `&context` that holds the cart's state.
- Agents (`@cart_adder`, `@cart_remover`) that receive events.
- `set:` blocks that define the *next* state of the cart.

How would a shopping experience unfold as a series of contexts rather than mutations?

## The Mental Shift

Stop thinking: "State is data I store and change"
Start thinking: "State is context that influences behavior"

Stop thinking: "I mutate variables"
Start thinking: "I evolve context through `set` for the next turn"

Stop thinking: "State determines behavior"
Start thinking: "State influences interpretation"

## A Final Insight

In traditional programming, state is like furniture in a room. You move it around, add pieces, remove pieces. The room is passive.

In INDRA, state is like the weather. It influences everything but controls nothing. You don't change the weather; you work with it, and it evolves naturally through the system.

Which one feels more like how intelligence actually works?

---

*Next: [The Four Quotes: A Deep Dive](./five-quotes.md) - Understanding INDRA's subtle but crucial quote system*