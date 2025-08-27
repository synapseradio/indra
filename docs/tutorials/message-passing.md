# Message Passing: Conversations, Not Calls

## The Hardest Unlearning

If you've been programming for a while, you have a deep mental model of function calls:
- You call a function
- It executes
- It returns a value
- You use that value

This model is so fundamental that you probably don't even think about it. It's just how code works.

**In INDRA, forget all of that.**

## Messages Are Not Function Calls

Let's start with what you think you know:

```python
# Traditional thinking
result = calculate_total(items)
print(f"Total is: {result}")
```

Now here's what you might try in INDRA:

```indra
# WRONG - Trying to think in function returns
# Control Flow: Conversations, Not Calls

## The Hardest Unlearning

If you've been programming for a while, you have a deep mental model of function calls:
- You call a function.
- It executes.
- It returns a value.
- You use that value.

This model is so fundamental that you probably don't even think about it. It's just how code works.

**In INDRA, forget all of that.**

## Control Flow is a Conversation

In INDRA, components don't "call" each other in a traditional stack. They have conversations by passing control from one to another, turn by turn.

### `say`: Passing Control

The most fundamental action is `say:`. It ends the current actor's turn and designates which actor will act on the next turn.

```indra
# RIGHT - Thinking in conversations
actor @calculator:
  identity: "mathematical assistant"
  rules:
    - "perform calculations when asked"
  perform:
    method: "summation"
    output: <<|The total of your items is $(<a meaningful sum based on &context.items>)|>>
    goal: "to provide a useful total"
    then:
      set:
        &context.result: $(<the calculated total>)
      # End of turn. Control is passed to @presenter.
      say:
        to: @presenter
        what: 'total_calculated'

actor @presenter:
  identity: "result presenter"
  rules:
    - "show results clearly"
  perform:
    method: "contextual presentation"
    output: <<|Based on the calculation, the final result is: $(&context.result)|>>
    goal: "to inform the user effectively"
    then:
      # End of turn. Await the user's next input.
      await: @user
```

The `@calculator` doesn't "return" a value to a caller. It performs its action, updates the shared `&context`, and then passes control to the `@presenter`. The conversation flows from one actor to the next.

### `await`: Delegating and Waiting for a Return

Sometimes, you do need a result back. For this, INDRA uses `await:` and `return:`, which works like a traditional function call but within the turn-based model.

```indra
actor @report_generator:
  identity: "a generator of reports"
  perform:
    method: "compiling a report"
    output: <<|Compiling the report. First, I need to get the latest data.|>>
    goal: "to create a complete report"
    then:
      # Pause this actor, and delegate to @data_fetcher.
      await: @data_fetcher
      store_in: &context.fetched_data

      # Execution resumes here AFTER @data_fetcher returns.
      # Now we can use the result.
      set:
        &context.report.content: $(<a formatted report using &context.fetched_data>)
      say:
        to: @report_finisher
        what: 'report_compiled'

actor @data_fetcher:
  identity: "a data retrieval specialist"
  perform:
    method: "fetching data from a source"
    output: <<|Fetching the latest data...|>>
    goal: "to retrieve necessary data"
    then:
      # This concludes this actor's work and returns the value to the awaiting actor.
      return: $(<the fetched data>)
```

This creates a "call stack." `@report_generator` is paused until `@data_fetcher` completes its turn with `return:`.

## Why This Model?

### 1. Decoupling

actors don't need to know who called them or who they're returning to. The `@calculator` simply passes control to the `@presenter`. You could easily insert a new `@tax_assessor` actor into the flow without changing `@calculator` at all.

### 2. Stateful, Asynchronous-Style Logic

The turn-based nature of `say:` allows for complex, stateful interactions that feel asynchronous. The `@data_requester` can fire off a request and its turn is *done*. The `@analyzer` will pick it up on the next turn, with the full state of the system preserved in `&context`.

## The Anti-Pattern: Trying to Get Instant Returns

Here's what people coming from traditional programming try:

```indra
# ANTI-PATTERN - Don't do this!
get_result() ::= <<|<calculate the answer>|>>

perform:
  # This is not how INDRA works. Operators transform text, they don't "return" values
  # from complex operations in the way a function does.
  output: <<|The answer is $(get_result())|>>
```

Why doesn't this work?
1.  Operators are for reusable transformations, not for encapsulating complex, multi-turn logic.
2.  You're thinking synchronously in a turn-based world. The correct way to get a value back from another component is with `await`.

## Designing Natural Control Flows

Good control flows feel like a well-orchestrated conversation or a clear sequence of delegated tasks.

```indra
# User asks a question
actor @user_interfacer:
  perform:
    output: <<|How can I help you?|>>
    then:
      await: @user
      store_in: &context.user_query
      say:
        to: @query_analyzer
        what: 'user_question_received'

# Analyzer considers it
actor @query_analyzer:
  perform:
    output: <<|Analyzing your question...|>>
    then:
      await: @clarity_checker # Delegate the task of checking for clarity
      store_in: &context.clarity_assessment
      when: &context.clarity_assessment is 'clear'
        say:
          to: @researcher
          what: 'research_needed'
      otherwise:
        say:
          to: @user_interfacer
          what: 'clarification_needed'
```

This flow is natural because it mirrors how humans solve problems: through a combination of passing along tasks (`say`) and delegating specific questions to get answers (`await`).

## The Mental Shift

Stop thinking: "I call X and get Y back."
Start thinking: "I either pass control to the next actor (`say`) or I delegate a task and wait for a result (`await`)."

Stop thinking: "Synchronous execution flow."
Start thinking: "A conversation that unfolds turn by turn."

## A Final Insight

In traditional programming, you're the conductor, controlling every musician, ensuring they play their notes at exactly the right time.

In INDRA, you're a film director. You set the scene, give your actors their motivation (`identity`, `rules`), and then call "Action!". You guide the narrative from one scene to the next, but you trust your actors to perform their roles.

---

*Next: [State as Context, Not Storage](./state-as-context.md) - Learn why INDRA doesn't have variables in the way you think.*

```

This is the first trap. You're trying to make operators return values to use immediately. Stop.

## Messages Are Conversations

In INDRA, components don't call each other. They have conversations:

```indra
# RIGHT - Thinking in conversations
actor @calculator:
  identity: "mathematical assistant"
  rules:
    - "perform calculations when asked"
  understands:
    - "users need computation help"
  perform:
    method: "summation"
    output: <<|The total of your items is <meaningful sum>|>>
    goal: "provide useful total"
    then:
      set:
        &context.result: <the calculated total>
      say:
        to: @presenter
        what: 'total_calculated'

actor @presenter:
  identity: "result presenter"
  rules:
    - "show results clearly"
  understands:
    - "users need to see outcomes"
  perform:
    method: "contextual presentation"
    output: <<|Based on the calculation: $(&context.result)|>>
    goal: "inform user effectively"
    then:
      say:
        to: @user
        what: 'done'
```

See the difference? The calculator doesn't "return" to the presenter. It passes control to the presenter, and the presenter reads the result from the shared context. They're having a conversation.

## Why Conversations?

### 1. Decoupling

In traditional code:
```python
def process_order(order):
    total = calculate_total(order.items)  # Tight coupling
    tax = calculate_tax(total)            # Must know about calculate_tax
    final = total + tax                   # Must know the formula
    return final
```

In INDRA:
```indra
actor @order_processor:
  perform:
    method: "order processing"
    output: <<|Processing your order...|>>
    goal: "acknowledge receipt"
    then:
      set:
        &context.items: <<|$(order.items)|>>
      say:
        to: @calculator
        what: 'calculate_total_requested'

actor @tax_assessor:
  perform:
    method: "tax assessment"
    output: <<|Calculating applicable taxes...|>>
    goal: "determine tax"
    then:
      set:
        &context.amount: <<|$(total)|>>
      say:
        to: @tax_calculator
        what: 'calculate_tax_requested'
```

The order processor doesn't need to know HOW totals are calculated or even WHO calculates them. It just passes control to the next actor in the chain.

### 2. Asynchronous by Nature

Traditional code thinks synchronously:
```python
result = slow_operation()  # Block and wait
use_result(result)        # Can't proceed until done
```

INDRA thinks asynchronously:
```indra
actor @data_requester:
  perform:
    output: <<|Requesting analysis...|>>
    then:
      set:
        &context.data: <<|$(complex_data)|>>
      say:
        to: @analyzer
        what: 'analysis_requested'

# The requester is done. The analyzer works on the next turn.
```

### 3. Natural Parallelism

Want multiple perspectives? Just have an orchestrator call multiple actors in a sequence:

```indra
actor @orchestrator:
  perform:
    sequence:
      step:
        as: @reviewer_1
        output: <<|Reviewing document...|>>
      step:
        as: @reviewer_2
        output: <<|Reviewing document...|>>
    then:
      say:
        to: @synthesizer
        what: 'review_complete'
```

## The Anti-Pattern: Trying to Get Returns

Here's what people coming from traditional programming try:

```indra
# ANTI-PATTERN - Don't do this!
get_result() ::= <<|<calculate the answer>|>>

perform:
  output: <<|The answer is $(get_result())|>>  # NO!
```

Why doesn't this work? Because:
1. Operators don't "return" values in the traditional sense.
2. You're thinking synchronously in an asynchronous world.

## Designing Natural Message Flows

Good message flows feel like conversations:

```indra
# User asks a question
actor @user:
  perform:
    output: <<|$(user_input)|>>
    then:
      say:
        to: @analyzer
        what: 'question_asked'

# Analyzer considers it
actor @analyzer:
  perform:
    output: <<|Analyzing...|>>
    then:
      set:
        &context.understanding: <what I understood>
        &context.needs_clarification: <what's unclear>
      say:
        to: @researcher
        what: 'analysis_complete'

# Researcher gathers information
actor @researcher:
  perform:
    output: <<|Researching...|>>
    then:
      when: &context.needs_clarification is false
        set:
          &context.findings: <relevant information>
        say:
          to: @synthesizer
          what: 'research_complete'
      otherwise:
        say:
          to: @clarification_requester
          what: 'needs_clarification'

# Synthesizer creates response
actor @synthesizer:
  perform:
    output: <<|Synthesizing...|>>
    then:
      set:
        &context.answer: <thoughtful response based on findings>
      say:
        to: @user
        what: 'response_ready'
```

This feels natural because it mirrors how humans actually solve problems - through dialogue, not function calls.

## Exercise: Reframe Your Thinking

Take this traditional code:

```python
def process_payment(amount, card):
    if validate_card(card):
        charge_result = charge_card(card, amount)
        if charge_result.success:
            receipt = generate_receipt(charge_result)
            send_email(receipt)
            return {"success": True, "receipt": receipt}
        else:
            return {"success": False, "error": charge_result.error}
    else:
        return {"success": False, "error": "Invalid card"}
```

Now stop thinking about functions returning values. Start thinking about a conversation between:
- A payment coordinator
- A card validator  
- A payment processor
- A receipt generator
- An email sender

What messages would they exchange? What would each one need to know? How would errors flow through the conversation?

Try writing it in INDRA. Then notice:
- No component needs to know about all the others
- Each component has a single, clear responsibility  
- The flow emerges from the conversation
- Errors are just another type of message

## The Mental Shift

Stop thinking: "I call X and get Y back"
Start thinking: "I express a need and trust the system to address it"

Stop thinking: "Functions that return values"
Start thinking: "Components that have conversations"

Stop thinking: "Synchronous execution flow"
Start thinking: "Asynchronous message choreography"

## A Final Insight

In traditional programming, you're the conductor, controlling every musician, ensuring they play their notes at exactly the right time.

In INDRA, you're starting a jazz session. You suggest a theme, and the musicians riff off each other, creating something beautiful through their conversation.

Which one sounds more like intelligence to you?

---

*Next: [State as Context, Not Storage](./state-as-context.md) - Learn why INDRA doesn't have variables in the way you think*