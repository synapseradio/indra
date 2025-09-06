# Guide: Composing Performative Actors

The INDRA protocol is not just for simple dialogues; its real power lies in orchestrating complex behaviors by composing performative actors. The `.in` files in `commands/` and `lib/prism/` are examples of this, creating sophisticated reasoning tools by composing actors, personas, and sequences that "think out loud."

This guide will break down how some of these tools work, revealing patterns you can use to build your own.

---

### Case Study 1: `@explore` and the Orchestrator Pattern

The `/explore` command provides a natural, exploratory way to reason. It feels simple to the user, but it's a great example of the **Orchestrator Pattern**.

**File:** `commands/explore.in`
**Depends on:** `lib/prism/tree_of_thought.in`

#### Pattern: The Orchestrator Actor

The `@explore` actor itself is incredibly simple. It acts as an **orchestrator**—a clean, user-friendly entry point that manages and delegates to a more complex system.

```indra
actor @explore:
  identity: "I explore ideas by branching them into possibilities and following the most promising threads"
  perform:
    method: "facilitating natural thought exploration"
    then:
      # ... welcome message ...
      
      # The core logic:
      await: @tree_thinker
      with: {
        dialogue: { latest_dialogue_entry: &context.query },
        tree: { caller: @explore, ... }
      }
      store_in: &context.tree_result
      
      say:
        to: @user
        what: &context.tree_result
```

1. **Performative Interface:** `@explore` has a performative `identity` ("I explore ideas by...") and provides a direct, inviting welcome.
2. **Delegation:** All the hard work is immediately handed off to the specialist, `@tree_thinker`, using `await:`. This keeps the orchestrator clean and focused on user interaction and high-level flow.
3. **Passing Context:** It passes the user's query to the specialist.
4. **Presenting the Result:** After `@tree_thinker` returns a result, `@explore` simply presents it to the user.

This separation of concerns—a simple orchestrator and a powerful, reusable specialist—is a core pattern for building complex tools in INDRA.

---

### Case Study 2: `@reason` and On-Demand Capabilities

The `/reason` command is a more complex conversational agent that can adapt its strategy by loading cognitive tools on the fly.

**File:** `commands/reason.in`

#### Pattern: The Adaptive Orchestrator

The `@reason` actor is a conversational partner that co-creates a reasoning plan with the user. It then executes that plan by dynamically loading the necessary capabilities.

```indra
# From the execute_strategy_step sequence in reason.in

step:
  output: <<|
    ---
    *Executing strategy: **~(strategy_name)~***
  |>>
  when: strategy_name is 'foundational_analysis'
    # This is a dynamic, runtime import.
    read_file: '../lib/prism/tree_of_thought.in'
    await: @tree_thinker
    with: { dialogue: { latest_dialogue_entry: &context.query } }
    store_in: &context.synthesis
  when: strategy_name is 'creative_exploration'
    # This is also a dynamic, runtime import.
    read_file: '../lib/prism/strategies/creative_exploration.in'
    await: explore_creatively
    # ...

```

#### Pattern: Dynamic Capability Loading

A key feature of `@reason` is its ability to use different reasoning strategies without having to load them all at once.

The `read_file` directive, when used without the interrupt channel (`>>...<<`), executes at runtime as a dynamic import. This allows `@reason` to:

1. **Stay Lightweight:** The core `@reason` actor doesn't need to know the implementation details of every possible strategy.
2. **Load on Demand:** It analyzes the user's query, composes a plan (e.g., `['foundational_analysis', 'creative_exploration']`), and then loads *only* the `.in` files for those specific strategies.
3. **Be Extensible:** New strategies can be added to the `lib/prism/strategies//` directory, and the `compose_reasoning_plan` operator can be updated to include them in its planning, without ever having to modify the core `@reason` actor itself.

By studying these patterns, you can see how INDRA's simple primitives—actors, delegation, and on-demand loading—can be composed to create highly intelligent, adaptive, and maintainable conversational applications.

**Next: [Using Sequences and Operators](./02-using-sequences-and-operators.md)**
