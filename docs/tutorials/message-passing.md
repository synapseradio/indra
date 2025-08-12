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
calculate() ::= <<|$(sum(&context.items))|>>

perform:
  output: <<|Total is: $(calculate())|>>  # This isn't how INDRA works!
```

This is the first trap. You're trying to make operators return values to use immediately. Stop.

## Messages Are Conversations

In INDRA, components don't call each other. They have conversations:

```indra
# RIGHT - Thinking in conversations
agent @calculator:
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

agent @presenter:
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
agent @order_processor:
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

agent @tax_assessor:
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

The order processor doesn't need to know HOW totals are calculated or even WHO calculates them. It just passes control to the next agent in the chain.

### 2. Asynchronous by Nature

Traditional code thinks synchronously:
```python
result = slow_operation()  # Block and wait
use_result(result)        # Can't proceed until done
```

INDRA thinks asynchronously:
```indra
agent @data_requester:
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

Want multiple perspectives? Just have an orchestrator call multiple agents in a sequence:

```indra
agent @orchestrator:
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
agent @user:
  perform:
    output: <<|$(user_input)|>>
    then:
      say:
        to: @analyzer
        what: 'question_asked'

# Analyzer considers it
agent @analyzer:
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
agent @researcher:
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
agent @synthesizer:
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