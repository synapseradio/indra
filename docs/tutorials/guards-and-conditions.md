# Conditional Behavior with when

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

In INDRA, you create conditional response blocks using `when:` and `otherwise:`. This allows a component to react differently to the same message based on its current state or the message payload.

```indra
actor @admin_handler:
  identity: "administrative authority"
  rules:
    - "handle with appropriate permissions"
  understands:
    - "admin actions need careful handling"
  perform:
    method: "authorized administration"
    output: <{appropriate admin response}>
    goal: "fulfill administrative need"
    then:
      when: <user appears authorized>
        say:
          to: @admin_handler
          what: "admin_request"
      otherwise:
        say:
          to: @permission_denial_handler
          what: "permission_denied"
```

See the difference? The `when: <user appears authorized>` condition isn't checking a simple boolean; it's asking the AI to interpret the context. If that condition isn't met, the `otherwise:` block is executed.

## Types of Conditions

### Deterministic Conditions

Use single quotes and state values for exact conditions with the new natural-language operators. State references must be fully qualified.

```indra
actor @payment_processor:
  perform:
    output: <Processing payment...>
    then:
      when: &context.payment.mode is 'active' and &context.payment.balance greater_than 0
        say:
          to: @payment_processor
          what: "process_payment"
      otherwise:
        say:
          to: @payment_processor
          what: "payment_failed"
```

### Probabilistic Conditions

Use angle brackets for contextual interpretation.

```indra
actor @message_handler:
  perform:
    output: <This seems important! Addressing immediately.>
    then:
      when: <message seems urgent>
        say:
          to: @message_handler
          what: "user_message"
      when: <message seems casual>
        say:
          to: @message_handler
          what: "user_message"
```

## The Power of Multiple `when:` Blocks

Traditional code makes binary decisions. INDRA makes contextual interpretations by allowing multiple `when:` blocks for the same message.

```indra
actor @support_handler:
  identity: "empathetic support specialist"
  rules:
    - "address emotional state first"
  understands:
    - "frustrated users need understanding"
  perform:
    method: "compassionate assistance"
    output: <{acknowledging frustration before solving}>
    goal: "calm and help"
    then:
      when: <user seems frustrated>
        say:
          to: @support_handler
          what: "support_request"
      when: <user seems confused>
        say:
          to: @support_handler
          what: "support_request"
      otherwise:
        say:
          to: @support_handler
          what: "support_request"
```

The first `when:` block whose condition evaluates to true will be executed. If none match, the `otherwise:` block runs.

## Conditional Actions within a `perform` block

You can still use `when:` inside a `then:` block for conditional emissions, just as before.

```indra
perform:
  method: "analysis"
  output: <Analyzing your request...>
  goal: "understand need"
  then:
    when: <solution is clear>
      set:
        &context.solution: <{the identified solution}>
      say:
        to: @solution_handler
        what: "solution_found"
    otherwise:
      set:
        &context.questions: <{clarifying questions}>
      say:
        to: @clarification_handler
        what: "need_more_info"
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
actor @sentiment_handler:
  perform:
    output: <I'm glad you're feeling positive!>
    then:
      when: <message has a positive emotional tone>
        say:
          to: @sentiment_handler
          what: "user_message"
      when: <message has a negative emotional tone>
        say:
          to: @sentiment_handler
          what: "user_message"
```

The INDRA version doesn't need arbitrary thresholds. It responds naturally to the actual emotional content.

## Condition Combinations

Conditions can be combined using `and`:

```indra
# Mixed deterministic and probabilistic
when: &context.system.mode is 'active' and <user seems ready>

# Multiple probabilistic conditions  
when: <request is valid> and <timing is appropriate>

# Negation
when: not <user seems confused>
```

## The Anti-Pattern: Over-Conditioning

Don't try to recreate traditional control flow by making your `when` conditions too rigid and numerous.

```indra
# ANTI-PATTERN - Too rigid
actor @input_handler:
  perform:
    output: <...>
    then:
      when: &context.input.type is 'question'
        # ...
      when: &context.input.type is 'command'
        # ...
      when: &context.input.type is 'contribution'
        # ...
```

This fights INDRA's nature. Better to let the AI interpret:

```indra
actor @input_handler:
  perform:
    method: "intelligent interpretation"
    output: <{appropriate response to input type}>
    goal: "address user need"
    then:
      say:
        to: @next_actor
        what: "input_processed"
```

## `when:` vs. `understands:`

`when:` and `understands:` work together:

```indra
actor @deletion_handler:
  identity: "careful deletion manager"
  rules:
    - "verify before destroying"
  understands:
    - "deletion is irreversible - user needs confidence"
  perform:
    method: "confirmed deletion"
    output: <{verification then deletion}>
    goal: "safely remove with confidence"
    then:
      when: <user has appropriate authority>
        say:
          to: @deletion_handler
          what: "delete_request"
```

The `when:` block determines *if* this behavior should run. The `understands:` block informs *how* it should run.

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

*Next: [Behavioral Composition](./behavioral-composition.md) - Learn how behaviors combine and build on each other*
