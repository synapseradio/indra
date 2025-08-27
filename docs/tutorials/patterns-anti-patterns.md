# Patterns and Anti-Patterns

## Learning from Traditional Programming Mistakes

Coming to INDRA from traditional programming, you'll naturally bring habits that don't translate. Let's identify them and learn better patterns.

## Anti-Pattern: The Control Freak

### ❌ Wrong: Trying to Control Every Detail

```indra
# TOO CONTROLLING
perform:
  method: "step 1: analyze, step 2: categorize, step 3: respond"
  output: <<|First say "I understand", then list three points, then conclude|>
```

### ✅ Right: Guide the Behavior

```indra
# GUIDED EMERGENCE
perform:
  method: "thoughtful analysis"
  output: <<|<structured response with clear insights>|>>
  goal: "help user understand"
```

## Anti-Pattern: Function Thinking

### ❌ Wrong: Trying to Create "Functions" that Return Values

```indra
# DOESN'T WORK LIKE THIS
calculate_tax(income) ::= &context.income * 0.3

# Trying to use it like a function
perform:
  output: <<|result = calculate_tax(50000)|>>  # NO! INDRA doesn't work this way
```

### ✅ Right: Create actors that Transform State

```indra
# BEHAVIORAL actor
actor @tax_calculator:
  identity: "a tax calculation specialist"
  perform:
    method: "tax calculation"
    output: <<|Calculating tax on $(&context.income)...|>>
    goal: "to calculate the tax amount"
    then:
      set:
        &context.tax_info: {
          amount: <appropriate tax calculation>,
          explanation: <clear breakdown of calculation>
        }
      say:
        to: @next_actor
        what: 'tax_calculated'

# Use through message passing
actor @some_actor:
  perform:
    output: <<|Requesting tax calculation...|>>
    then:
      set:
        &context.income: 50000
      say:
        to: @tax_calculator
        what: 'calculate_request'
```

## Anti-Pattern: Direct Variable Mutation

### ❌ Wrong: Trying to Mutate State Directly

```indra
# IMPOSSIBLE IN INDRA
# This syntax is not valid.
&context.count = &context.count + 1
```

### ✅ Right: State Evolution Through `set`

```indra
actor @item_adder:
  perform:
    output: <<|Added item. Total count is now $(&context.count + 1)|>>
    then:
      set:
        &context.count: &context.count + 1
        &context.items: &context.items.append(&context.new_item)
      say:
        to: @next_actor
        what: 'item_added'
```

## Anti-Pattern: Nested `perform` Blocks

### ❌ Wrong: Deeply Nested Sequential Logic

```indra
# TOO SEQUENTIAL AND INVALID
perform:
  output: <<|Load data|>>
  then:
    perform: # Invalid: cannot nest perform blocks
      output: <<|Process data|>>
```

### ✅ Right: Message-Driven Flow with `say`

```indra
actor @data_loader:
  perform:
    method: "data loading"
    output: <<|Loading data...|>>
    then:
      say:
        to: @data_processor
        what: 'data_loaded'

actor @data_processor:
  perform:
    method: "intelligent processing"
    output: <<|Processing data...|>>
    then:
      say:
        to: @result_saver
        what: 'processing_complete'
        
# Each actor is focused on one concern.
```

## Pattern: Elegant State Machines

### Natural Conversation Pattern

```indra
actor @conversationalist:
  identity: "engaging conversationalist"
  rules:
    - "maintain natural flow"
  understands:
    - "conversations have rhythm and depth"
  perform:
    method: "contextual response"
    output: <<|<response that builds on the previous turn>|>>
    then:
      when: &context.conversation_depth < 3
        set:
          &context.conversation_depth: &context.conversation_depth + 1
        say:
          to: @conversationalist
          what: 'continue_conversation'
      otherwise:
        perform:
          method: "synthesis"
          output: <<|<drawing together the threads of our conversation>|>>
          goal: "create meaningful closure"
        say:
          to: @user
          what: 'conversation_complete'
```

## Pattern: Behavioral Composition with `as:`

### The Mixin Pattern

The old `extend:` keyword is deprecated. The modern way to compose behaviors is to define headless `persona`s and have an `actor` adopt them using `as:` within a `sequence`.

```indra
# Define focused behavioral traits as personas
persona @empathetic_trait:
  rules:
    - "acknowledge emotions"
  understands:
    - "feelings matter as much as facts"

persona @analytical_trait:
  rules:
    - "identify patterns"
  understands:
    - "patterns reveal truth"

# Compose them in an actor's sequence
actor @counselor:
  identity: "insightful counselor"
  perform:
    method: "empathetic analysis"
    sequence:
      step:
        as: @empathetic_trait
        output: <<|<Acknowledge the user's feelings about the situation.>|>>
      step:
        as: @analytical_trait
        output: <<|<Identify the underlying patterns in the user's story.>|>>
      step:
        as: self
        output: <<|<Synthesize the emotional and analytical insights into helpful advice.>|>>
    goal: "to provide empathetic and insightful guidance"
    then:
      say:
        to: @user
        what: 'counseling_session_complete'
```

## Anti-Pattern: Boolean Logic Obsession

### ❌ Wrong: Trying to Force Brittle Boolean Logic

```indra
# TOO BINARY
when: &context.is_valid is true and &context.has_permission is true and not &context.is_blocked
```

### ✅ Right: Contextual, Probabilistic Conditions

```indra
# CONTEXTUAL
when: <request seems legitimate and authorized>
```

## Anti-Pattern: Ambiguous Probabilistic Conditions

### ❌ Wrong: Overlapping, Vague Conditions

```indra
# ANTI-PATTERN - Too ambiguous
actor @ambiguous_handler:
  perform:
    output: <<|...|>>
    then:
      when: <user seems to want something>
        # ...
      when: <user is asking for a thing>
        # ...
```
These conditions are semantically identical, leading to unpredictable behavior.

### ✅ Right: Precise, Mutually Exclusive Conditions

```indra
# GOOD - Clear, distinct intents
actor @clear_handler:
  perform:
    output: <<|...|>>
    then:
      when: <user is asking for factual information>
        # ...
      when: <user is expressing an opinion or feeling>
        # ...
      when: <user is giving a direct command>
        # ...
```
This pattern works because the intents are clearly different categories, allowing for reliable, context-based decisions.

## Pattern: Progressive Enhancement

### Start Simple, Add Nuance

```indra
# Version 1: Basic
actor @helper:
  identity: "helpful assistant"
  rules:
    - "be helpful"

# Version 2: Enhanced
actor @helper:
  identity: "thoughtful assistant"
  rules: 
    - "provide accurate help"
    - "anticipate follow-up needs"
  understands:
    - "help means empowerment, not dependency"

# Version 3: Sophisticated (using composition)
actor @helper:
  identity: "adaptive learning assistant"
  rules:
    - "provide contextual help"
    - "learn from interactions"
  understands: 
    - "each user has unique needs"
    - "the best help teaches"
  perform:
    sequence:
      step:
        as: @empathetic_trait
        output: <<|<Acknowledge the user's perspective first>|>>
      step:
        as: self
        output: <<|<Provide the helpful information>|>>
```

## The Meta-Pattern: Embrace Emergence

The ultimate pattern in INDRA is to stop fighting for absolute control and instead guide emergent behavior.

- Instead of controlling outcomes, **create conditions for good outcomes.**
- Instead of eliminating uncertainty, **guide uncertainty toward value.**
- Instead of preventing variation, **embrace variation within behavioral bounds.**
- Instead of defining exact behavior, **define behavioral tendencies.**

## A Final Anti-Pattern to Avoid

### ❌ Wrong: Copying Traditional Design Patterns

Don't try to recreate MVC, Factory, or other traditional architectures directly in INDRA. They assume a synchronous, control-flow-based paradigm that is at odds with INDRA's nature.

### ✅ Right: Discover INDRA-Native Patterns

Let patterns emerge from INDRA's core principles:
- **Message flows** instead of call stacks
- **Behavioral composition (`as:`)** instead of inheritance
- **Context evolution (`set:`)** instead of direct mutation
- **Guided emergence** instead of rigid control flow

## The Path Forward

As you write more INDRA, you'll discover your own patterns. The key is to:

1. Let go of absolute control
2. Embrace emergence
3. Think in transformations
4. Trust the behavioral system
5. Guide, don't dictate

Remember: In traditional programming, you build machines. In INDRA, you cultivate behaviors.

---

*Congratulations! You've completed the INDRA tutorial series. The journey from deterministic to probabilistic thinking is profound. Keep experimenting, keep discovering, and most importantly - keep embracing the emergence.*