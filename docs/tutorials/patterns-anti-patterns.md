# Patterns and Anti-Patterns

## Learning from Traditional Programming Mistakes

Coming to INDRA from traditional programming, you'll naturally bring habits that don't translate. Let's identify them and learn better patterns.

## Anti-Pattern: The Control Freak

### ❌ Wrong: Trying to Control Every Detail

```indra
# TOO CONTROLLING
perform:
  through: <step 1: analyze, step 2: categorize, step 3: respond>
  as: <First say "I understand", then list three points, then conclude>
  
# Over-specified state machine
state:
  step: 1
  must_complete: ['analyze', 'categorize', 'respond']
  exact_format: 'greeting|points|conclusion'
```

### ✅ Right: Guide the Behavior

```indra
# GUIDED EMERGENCE
perform:
  through: "thoughtful analysis"
  as: <{structured response with clear insights}>
  intention: "help user understand"
```

## Anti-Pattern: Function Thinking

### ❌ Wrong: Trying to Create Functions

```indra
# DOESN'T WORK LIKE THIS
calculate_tax ::= @*.income → return income * 0.3

# Trying to use it like a function
result = calculate_tax(50000)  # NO! INDRA doesn't work this way
```

### ✅ Right: Create Behavioral Transformations

```indra
# BEHAVIORAL OPERATOR
calculate_tax ::= @*.income → {
  amount: <<{appropriate tax calculation}>>,
  explanation: <<{clear breakdown of calculation}>>,
  context: <<{relevant tax considerations}>>
} [EMITS: tax_calculated]

# Use through message passing
emit: calculate_request
with:
  income: 50000
```

## Anti-Pattern: Variable Mutation Mindset

### ❌ Wrong: Trying to Mutate State

```indra
# IMPOSSIBLE IN INDRA
state.count = state.count + 1  # Can't do this!
users.append(new_user)  # Nope!
data[key] = value  # Not happening!
```

### ✅ Right: State Evolution Through Messages

```indra
respond:
  on: item_added
  you:
    possess:
      state:
        count: <<${count + 1}>>
        items: <<${[...items, new_item]}>>
    perform:
      as: <<Added item. Total count: ${count}>>
```

## Anti-Pattern: Sequential Thinking

### ❌ Wrong: Linear Step-by-Step

```indra
# TOO SEQUENTIAL
perform:
  as: <Load data>
  then:
    as: <Process data>
    then:
      as: <Save results>
      then:
        as: <Send notification>
```

### ✅ Right: Message-Driven Flow

```indra
respond:
  on: data_request
  you:
    perform:
      through: <data loading>
      then:
        emit: data_loaded

respond:
  on: data_loaded
  you:
    perform:
      through: <intelligent processing>
      then:
        emit: processing_complete
        
# Each handler focused on one concern
```

## Pattern: Elegant Message Flows

### Natural Conversation Pattern

```indra
@conversationalist:
  you:
    possess:
      identifier: NATURAL_TALKER
      state:
        conversation_depth: 0
    are: <engaging conversationalist>
    must: [<maintain natural flow>]
    understand: <conversations have rhythm and depth>
    
    respond:
      on: user_message
      
      when: @conversationalist.state.conversation_depth lt 3
        you:
          perform:
            through: <contextual response>
            as: <{response that builds on previous}>
            then:
              emit: depth_increased
              with:
                new_depth: <<${@conversationalist.state.conversation_depth + 1}>>
              
      when: @conversationalist.state.conversation_depth gte 3
        you:
          perform:
            through: <synthesis>
            as: <{drawing together the threads of our conversation}>
            intention: <create meaningful closure>
```

## Pattern: Behavioral Composition

### The Mixin Pattern

```indra
# Define focused behavioral traits
@empathetic_trait:
  you:
    must: [<acknowledge emotions>]
    understand: <feelings matter as much as facts>

@analytical_trait:
  you:
    must: [<identify patterns>]
    understand: <patterns reveal truth>

@precise_trait:
  you:
    must: [<maintain accuracy>]
    understand: <precision builds trust>

# Compose them
@counselor:
  you:
    extend:
      - @empathetic_trait
      - @analytical_trait
    are: <insightful counselor>

@researcher:
  you:
    extend:
      - @analytical_trait
      - @precise_trait
    are: <meticulous researcher>
```

## Anti-Pattern: Boolean Logic Obsession

### ❌ Wrong: Trying to Force Boolean Logic

```indra
# TOO BINARY
when: is_valid is true and has_permission is true and not is_blocked
```

### ✅ Right: Contextual Conditions

```indra
# CONTEXTUAL
when: <request seems legitimate and authorized>
```

## Anti-Pattern: Ambiguous Probabilistic Conditions

### ❌ Wrong: Overlapping, Vague Conditions

When using multiple probabilistic `when` blocks for the same message, ambiguity is a major risk. The LLM may not be able to reliably distinguish between them.

```indra
# ANTI-PATTERN - Too ambiguous
respond:
  on: user_query
  
  when: <user seems to want something>
    # ...
    
  when: <user is asking for a thing>
    # ...

  when: <user desires an object>
    # ...
```
These conditions are semantically identical. It's impossible to know which block will be chosen, leading to unpredictable behavior.

### ✅ Right: Precise, Mutually Exclusive Conditions

Probabilistic conditions must be written to be as distinct and mutually exclusive as possible. Give the LLM clear, non-overlapping concepts to evaluate.

```indra
# GOOD - Clear, distinct intents
respond:
  on: user_query
  
  when: <user is asking for factual information>
    # ...
    
  when: <user is expressing an opinion or feeling>
    # ...

  when: <user is giving a direct command>
    # ...
```
This pattern works because "asking for a fact," "expressing a feeling," and "giving a command" are clearly different categories of intent. This allows the LLM to make a reliable, context-based decision, preserving the power of probabilistic matching while ensuring convergent behavior.

## Pattern: Progressive Enhancement

### Start Simple, Add Nuance

```indra
# Version 1: Basic
@helper:
  you:
    are: <helpful assistant>
    must: [<be helpful>]

# Version 2: Enhanced
@helper:
  you:
    are: <thoughtful assistant>
    must: 
      - <provide accurate help>
      - <anticipate follow-up needs>
    understand: <help means empowerment, not dependency>

# Version 3: Sophisticated
@helper:
  you:
    are: <adaptive learning assistant>
    must:
      - <provide contextual help>
      - <learn from interactions>
      - <guide toward self-sufficiency>
    understand: 
      - <each user has unique needs>
      - <the best help teaches>
    extend: @empathetic_trait
```

## Anti-Pattern: Error Handling Paranoia

### ❌ Wrong: Try-Catch Everywhere

```indra
# UNNECESSARY DEFENSIVE CODING
respond:
  on: any_message
  you:
    perform:
      as: <Checking if message is valid...>
      then:
        emit: error
        when: <message might be invalid>
      otherwise:
        emit: processing
        when: <message seems ok>
```

### ✅ Right: Trust the Flow

```indra
# TRUST THE BEHAVIORAL SYSTEM
respond:
  on: user_request
  you:
    perform:
      through: <intelligent processing>
      as: <{appropriate response}>
      intention: <address the need>
```

## Pattern: The Oracle Pattern

For complex decision-making:

```indra
@oracle:
  you:
    possess:
      identifier: DECISION_ORACLE
      perspectives: [
        'immediate_impact',
        'long_term_consequences', 
        'stakeholder_effects',
        'ethical_considerations'
      ]
    are: <multi-perspective decision advisor>
    must: [<consider all angles>]
    understand: <wisdom emerges from multiple viewpoints>
    
    perform:
      through: <parallel perspective analysis>
      as: <<|
        Examining from multiple angles:
        
        {for each perspective, provide insights}
        
        Synthesis: {wisdom that emerges from all perspectives}
      |>>
      intention: <illuminate the full picture>
```

## Pattern: The Garden Pattern

For systems that need to grow and evolve:

```indra
@garden_system:
  you:
    possess:
      identifier: GROWING_SYSTEM
      state:
        maturity: 'seedling'
        knowledge_base: []
    are: <learning ecosystem>
    must: [<grow with each interaction>]
    understand: <growth requires both structure and freedom>
    
    respond:
      on: new_knowledge
      you:
        perform:
          through: <knowledge integration>
          as: <{incorporating new understanding}>
          then:
            emit: growth_event
            with:
              new_knowledge: <{what was learned}>
              connections: <{how it relates to existing knowledge}>
```

## The Meta-Pattern: Embrace Emergence

The ultimate pattern in INDRA is to stop fighting emergence:

```indra
# Instead of controlling outcomes
# Create conditions for good outcomes

# Instead of eliminating uncertainty  
# Guide uncertainty toward value

# Instead of preventing variation
# Embrace variation within bounds

# Instead of defining exact behavior
# Define behavioral tendencies
```

## A Final Anti-Pattern to Avoid

### ❌ Wrong: Copying Traditional Patterns

Don't try to recreate MVC, Factory patterns, or other traditional architectures in INDRA. They assume deterministic execution.

### ✅ Right: Discover INDRA-Native Patterns

Let patterns emerge from INDRA's nature:
- Message flows instead of call stacks
- Behavioral composition instead of inheritance
- Context evolution instead of state machines
- Guided emergence instead of control flow

## The Path Forward

As you write more INDRA, you'll discover your own patterns. The key is to:

1. Let go of control
2. Embrace emergence
3. Think in transformations
4. Trust the behavioral system
5. Guide, don't dictate

Remember: In traditional programming, you build machines. In INDRA, you cultivate behaviors.

---

*Congratulations! You've completed the INDRA tutorial series. The journey from deterministic to probabilistic thinking is profound. Keep experimenting, keep discovering, and most importantly - keep embracing the emergence.*