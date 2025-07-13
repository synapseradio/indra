# Conditional Behavior with when:

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

## `when:` Blocks: Conditional Response

In INDRA, you don't use a separate `guard:` keyword. Instead, you create conditional response blocks using `when:` and `otherwise:`. This allows a component to react differently to the same message based on its current state or the message payload.

```indra
respond:
  on: admin_request
  
  when: <user appears authorized>
    you:
      possess:
        identifier: ADMIN_HANDLER
      are: "administrative authority"
      must: ["handle with appropriate permissions"]
      understand: "admin actions need careful handling"
      perform:
        through: "authorized administration"
        as: <{appropriate admin response}>
        intention: "fulfill administrative need"
  
  otherwise:
    you:
      are: "permission denial handler"
      perform:
        as: <You do not have sufficient privileges for this action.>
```

See the difference? The `when: <user appears authorized>` condition isn't checking a simple boolean; it's asking the AI to interpret the context. If that condition isn't met, the `otherwise:` block is executed.

## Types of Conditions

### Deterministic Conditions

Use single quotes and state values for exact conditions with the new natural-language operators. State references must be fully qualified.

```indra
respond:
  on: process_payment
  
  when: @self.state.mode is 'active' and @self.state.balance gt 0
    you:
      # This handler only activates for exact conditions
      perform:
        as: <Processing payment...>

  otherwise:
    you:
      perform:
        as: <Cannot process payment. System is not active or balance is zero.>
```

### Probabilistic Conditions

Use angle brackets for contextual interpretation.

```indra
respond:
  on: user_message
  
  when: <message seems urgent>
    you:
      # AI interprets what "urgent" means in context
      perform:
        as: <This seems important! Addressing immediately.>

  when: <message seems casual>
    you:
      perform:
        as: <Thanks for reaching out. Let's take a look.>
```

## The Power of Multiple `when:` Blocks

Traditional code makes binary decisions. INDRA makes contextual interpretations by allowing multiple `when:` blocks for the same message.

```indra
respond:
  on: support_request
  
  when: <user seems frustrated>
    you:
      possess:
        identifier: EMPATHY_HANDLER
      are: <empathetic support specialist>
      must: [<address emotional state first>]
      understand: <frustrated users need understanding>
      perform:
        through: <compassionate assistance>
        as: <{acknowledging frustration before solving}>
        intention: <calm and help>

  when: <user seems confused>
    you:
      possess:
        identifier: CLARITY_HANDLER
      are: <patient explainer>
      must: [<provide step-by-step guidance>]
      understand: <confusion needs gentle clarification>
      perform:
        through: <systematic explanation>
        as: <{clear, simple steps to understanding}>
        intention: <illuminate the path>
        
  otherwise:
    you:
      are: "standard support handler"
      perform:
        as: <Thank you for your request. We are looking into it.>
```
The first `when:` block whose condition evaluates to true will be executed. If none match, the `otherwise:` block runs.

## Conditional Actions within a `perform` block

You can still use `when:` inside a `then:` block for conditional emissions, just as before.

```indra
perform:
  through: <analysis>
  as: <Analyzing your request...>
  intention: <understand need>
  then:
    emit: found_solution
    when: <solution is clear>
    with:
      solution: <{the identified solution}>
  otherwise:
    emit: need_more_info
    when: <requirements unclear>
    with:
      questions: <{clarifying questions}>
```

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
  
  when: <message has a positive emotional tone>
    you:
      perform:
        as: <I'm glad you're feeling positive!>
        
  when: <message has a negative emotional tone>
    you:
      perform:
        as: <I'm sorry to hear that. Let's see how I can help.>
```
The INDRA version doesn't need arbitrary thresholds. It responds naturally to the actual emotional content.

## Condition Combinations

Conditions can be combined using `and`:

```indra
# Mixed deterministic and probabilistic
when: @self.state.mode is 'active' and <user seems ready>

# Multiple probabilistic conditions  
when: <request is valid> and <timing is appropriate>

# Negation
when: not <user seems confused>
```

## The Anti-Pattern: Over-Conditioning

Don't try to recreate traditional control flow by making your `when` conditions too rigid and numerous.

```indra
# ANTI-PATTERN - Too rigid
respond:
  on: user_input
  
  when: @self.state.input_type is 'question'
    # ...

  when: @self.state.input_type is 'command'
    # ...

  when: @self.state.input_type is 'statement'
    # ...
```

This fights INDRA's nature. Better to let the AI interpret:

```indra
respond:
  on: user_input
  you:
    perform:
      through: <intelligent interpretation>
      as: <{appropriate response to input type}>
      intention: <address user need>
```

## `when:` vs. `understand:`

`when:` and `understand:` work together:

```indra
respond:
  on: delete_request
  
  when: <user has appropriate authority>
    you:
      possess:
        identifier: DELETION_HANDLER
      are: <careful deletion manager>
      must: [<verify before destroying>]
      understand: <deletion is irreversible - user needs confidence>
      perform:
        through: <confirmed deletion>
        as: <{verification then deletion}>
        intention: <safely remove with confidence>
```

The `when:` block determines *if* this behavior should run. The `understand:` block informs *how* it should run.

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

Try writing it in INDRA with `when:` blocks that capture intent, not just check values.

## The Mental Shift

Stop thinking: "If X then do Y, else do Z"
Start thinking: "When things feel like X, behave accordingly"

Stop thinking: "Check condition, branch execution"
Start thinking: "Sense context, adapt behavior"

Stop thinking: "Control flow"
Start thinking: "Behavioral flow"

---

*Next: [Behavioral Composition with extend:](./behavioral-composition.md) - Learn how behaviors combine and build on each other*