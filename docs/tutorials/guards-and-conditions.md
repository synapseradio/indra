# Guards and Conditional Behavior

## Forget If/Else

In traditional programming, you control flow with conditions:

```python
if user.is_authenticated:
    if user.has_permission('admin'):
        perform_admin_action()
    else:
        show_permission_error()
else:
    redirect_to_login()
```

You're building a decision tree. Each branch is a different code path. The execution is deterministic - given the same conditions, you always take the same path.

INDRA doesn't think this way.

## Guards: Behavioral Boundaries

In INDRA, guards don't create code branches. They create behavioral boundaries:

```indra
respond:
  on: admin_request
  guard: ‹user appears authorized›
  you:
    possess:
      identifier: ADMIN_HANDLER
    are: "administrative authority"
    must: ["handle with appropriate permissions"]
    understand: "admin actions need careful handling"
    perform:
      through: "authorized administration"
      as: ‹{appropriate admin response}›
      intention: "fulfill administrative need"
```

See the difference? The guard `‹user appears authorized›` isn't checking a boolean. It's asking the AI to interpret whether this feels like an authorized request.

## Two Types of Guards

### Deterministic Guards

Use single quotes and state values for exact conditions:

```indra
respond:
  on: process_payment
  guard: mode == 'active' and balance > 0
  you:
    # This handler only activates for exact conditions
```

### Probabilistic Guards

Use angle brackets for contextual interpretation:

```indra
respond:
  on: user_message
  guard: ‹message seems urgent›
  you:
    # AI interprets what "urgent" means in context
```

## The Beauty of Contextual Guards

Traditional code makes binary decisions. INDRA makes contextual interpretations:

```indra
respond:
  on: support_request
  guard: ‹user seems frustrated›
  you:
    possess:
      identifier: EMPATHY_HANDLER
    are: ‹empathetic support specialist›
    must: [‹address emotional state first›]
    understand: ‹frustrated users need understanding›
    perform:
      through: ‹compassionate assistance›
      as: ‹{acknowledging frustration before solving}›
      intention: ‹calm and help›

respond:
  on: support_request  
  guard: ‹user seems confused›
  you:
    possess:
      identifier: CLARITY_HANDLER
    are: ‹patient explainer›
    must: [‹provide step-by-step guidance›]
    understand: ‹confusion needs gentle clarification›
    perform:
      through: ‹systematic explanation›
      as: ‹{clear, simple steps to understanding}›
      intention: ‹illuminate the path›
```

Multiple handlers can respond to the same message, each with different interpretations of the context.

## Conditional Actions with then/otherwise

Within a handler, you can have conditional emissions:

```indra
perform:
  through: ‹analysis›
  as: ‹Analyzing your request...›
  intention: ‹understand need›
  then:
    emit: found_solution
    when: ‹solution is clear›
    with:
      solution: ‹{the identified solution}›
  otherwise:
    emit: need_more_info
    when: ‹requirements unclear›
    with:
      questions: ‹{clarifying questions}›
  otherwise:
    emit: escalate_to_human
```

But notice - even here, the conditions can be interpretive (‹solution is clear›) or exact (state comparisons).

## Why Not Just Use If/Else?

Because intelligence doesn't work in binary branches. Consider:

```python
# Traditional approach
if sentiment_score > 0.7:
    response = "I'm glad you're happy!"
elif sentiment_score < 0.3:
    response = "I'm sorry you're upset."
else:
    response = "I understand."
```

Versus INDRA:

```indra
respond:
  on: user_message
  guard: ‹emotional content detected›
  you:
    perform:
      through: ‹emotional intelligence›
      as: ‹{response that matches emotional tone}›
      intention: ‹connect emotionally›
```

The INDRA version doesn't need arbitrary thresholds. It responds naturally to the actual emotional content.

## Guard Combinations

Guards can be sophisticated:

```indra
# Mixed deterministic and probabilistic
guard: mode == 'active' and ‹user seems ready›

# Multiple probabilistic conditions  
guard: ‹request is valid› and ‹timing is appropriate›

# Negation
guard: not ‹user seems confused›
```

## The Anti-Pattern: Over-Guarding

Don't try to recreate traditional control flow:

```indra
# ANTI-PATTERN - Too rigid
respond:
  on: user_input
  guard: input_type == 'question'
  # ...

respond:
  on: user_input
  guard: input_type == 'command'
  # ...

respond:
  on: user_input
  guard: input_type == 'statement'
  # ...
```

This fights INDRA's nature. Better:

```indra
respond:
  on: user_input
  you:
    perform:
      through: ‹intelligent interpretation›
      as: ‹{appropriate response to input type}›
      intention: ‹address user need›
```

Let the AI figure out what kind of input it is and respond appropriately.

## Guards vs. understand:

Guards and understand blocks work together:

```indra
respond:
  on: delete_request
  guard: ‹user has appropriate authority›
  you:
    possess:
      identifier: DELETION_HANDLER
    are: ‹careful deletion manager›
    must: [‹verify before destroying›]
    understand: ‹deletion is irreversible - user needs confidence›
    perform:
      through: ‹confirmed deletion›
      as: ‹{verification then deletion}›
      intention: ‹safely remove with confidence›
```

The guard checks if we should handle it. The understand: explains why we handle it this way.

## Real-World Example: Multi-Modal Response

```indra
@assistant:
  you:
    possess:
      identifier: ADAPTIVE_ASSISTANT
      state:
        interaction_count: 0
        user_style: 'unknown'
    are: ‹adaptive communication interface›
    must: 
      - ‹match communication style›
      - ‹provide helpful responses›
    understand: ‹users have different communication preferences›
    
    respond:
      on: user_message
      guard: ‹message contains technical jargon›
      you:
        possess:
          identifier: TECHNICAL_RESPONDER
        are: ‹technical communication specialist›
        must: [‹use precise technical language›]
        understand: ‹technical users appreciate accuracy›
        perform:
          through: ‹technical analysis›
          as: ‹{detailed technical response with appropriate terminology}›
          intention: ‹provide expert-level information›
    
    respond:
      on: user_message
      guard: ‹message seems casual/conversational›
      you:
        possess:
          identifier: CASUAL_RESPONDER
        are: ‹friendly conversationalist›
        must: [‹keep things approachable›]
        understand: ‹casual users want friendly interaction›
        perform:
          through: ‹natural conversation›
          as: ‹{warm, friendly response without jargon}›
          intention: ‹connect naturally›
    
    respond:
      on: user_message
      guard: ‹message indicates confusion or learning›
      you:
        possess:
          identifier: TEACHING_RESPONDER
        are: ‹patient educator›
        must: [‹explain clearly without condescension›]
        understand: ‹learners need encouragement and clarity›
        perform:
          through: ‹educational guidance›
          as: ‹{step-by-step explanation with examples}›
          intention: ‹facilitate understanding›
          then:
            emit: learning_moment_recorded
            with:
              topic: ‹{identified learning area}›
              approach: ‹{educational method used}›
```

The same message might trigger different handlers based on context. This isn't a bug - it's the feature.

## Exercise: Reframe Your Conditions

Take this traditional code:

```python
def handle_user_request(request, user):
    if not user.is_authenticated:
        return "Please log in"
    
    if request.type == "read":
        if user.has_read_permission:
            return fetch_data(request.resource)
        else:
            return "No read permission"
    elif request.type == "write":
        if user.has_write_permission:
            if validate_data(request.data):
                return save_data(request.resource, request.data)
            else:
                return "Invalid data"
        else:
            return "No write permission"
    else:
        return "Unknown request type"
```

Now stop thinking about permission checks as binary gates. Start thinking about:
- What makes a request feel authorized?
- How would you naturally handle different types of requests?
- What behavioral boundaries make sense?

Try writing it in INDRA with guards that capture intent, not just check values.

## The Mental Shift

Stop thinking: "If X then do Y, else do Z"
Start thinking: "When things feel like X, behave accordingly"

Stop thinking: "Check condition, branch execution"
Start thinking: "Sense context, adapt behavior"

Stop thinking: "Control flow"
Start thinking: "Behavioral flow"

## A Philosophical Note

Traditional conditions assume a world of discrete states and binary decisions. INDRA assumes a world of continuous contexts and adaptive behaviors.

Which one better matches how intelligence actually works?

When you decide to help someone, do you check a series of boolean flags? Or do you sense the situation and respond appropriately?

INDRA guards work like the latter. They're not gates in a circuit - they're sensitivities in a behavioral system.

---

*Next: [Behavioral Composition with extend:](./behavioral-composition.md) - Learn how behaviors combine and build on each other*