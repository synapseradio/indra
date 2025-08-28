# Guide: Writing Reasoning Tools

The INDRA protocol is not just for simple dialogues; its real power lies in orchestrating complex behaviors. The `.in` files in `core/command-overlays` and `core/prism` are examples of this, creating sophisticated reasoning tools by composing actors, personas, and sequences.

This guide will break down how some of these tools work, revealing patterns you can use to build your own.

---

### Case Study 1: `@think` and the Tree of Thought

The `/think` command provides a natural, exploratory way to reason. It feels simple to the user, but it's a great example of delegation and composition.

**File:** `core/commands/think.in`
**File:** `core/prism/tree_of_thought.in`

#### Pattern: The Facade Actor

The `@think` actor itself is incredibly simple. It acts as a **facade**—a clean, user-friendly entry point to a more complex system.

```indra
actor @think:
  identity: "a natural thinking companion..."
  perform:
    method: "facilitating natural thought exploration"
    then:
      # ... welcome message ...
      
      # The core logic:
      await: @tree_thinker
      with: {
        dialogue: { latest_dialogue_entry: &context.query },
        tree: { caller: '@think', ... }
      }
      store_in: &context.tree_result
      
      say:
        to: &caller
        what: &context.tree_result
```

1. **Simple Interface:** `@think` has a friendly `identity` and provides a welcoming message.
2. **Delegation:** All the hard work is immediately handed off to `@tree_thinker` using `await:`. This keeps the entry-point actor clean and focused on user interaction.
3. **Passing Context:** It passes the user's query and its own name (`caller: '@think'`) to the specialist actor.
4. **Returning the Result:** After `@tree_thinker` returns a result, `@think` simply passes it back to the user.

#### Pattern: The Specialist Actor & Reusable Sequence

The `@tree_thinker` actor in `tree_of_thought.in` is a specialist. Its job is to orchestrate the complex `tree_of_thought` sequence.

The `tree_of_thought` sequence is where the real magic happens. It's a reusable set of steps that:

* **Initializes state:** `set: &context.tree.original_question: ...`
* **Adopts Personas:** Uses `as: @curious_explorer` to temporarily change its behavior for a specific task (wondering about the topic).
* **Calls Operators:** Invokes reusable transformations like `wonder_about(...)` and `connect_dots(...)`.
* **Manages a Loop:** It iteratively explores, deepens, and synthesizes ideas (this is simplified in the code but is the conceptual flow).
* **Returns a Value:** It concludes with `return: { ... }`, sending a structured object back to the waiting `@think` actor.

This separation of concerns—a simple facade, a specialist orchestrator, and a reusable sequence—is a powerful pattern for building complex tools in INDRA.

---

### Case Study 2: `@reason` and Dynamic Capabilities

The `/reason` command is a more complex conversational agent that can adapt its strategy.

**File:** `core/commands/reason.in`

#### Pattern: Conversational State Machine

The `@reason` actor's `perform:` block is a large `until:` loop that functions as a state machine. It uses `&context.reason...` variables to track the state of the conversation.

* It checks if the query is understood (`&context.query_breakdown`).
* It determines if a special strategy is needed (`&context.reason.needed_strategy`).
* It remembers what it has proposed to the user (`&context.reason.strategy_proposed`).

This allows the actor to have a multi-turn conversation where it first clarifies its understanding, then proposes a course of action, and finally executes it, all while remembering the context of the dialogue.

#### Pattern: Dynamic Module Loading

A key feature of `@reason` is its ability to use different reasoning strategies. It does this by loading modules dynamically at runtime.

```indra
# From the execute_and_present_strategy sequence
step:
  when: strategy_name is 'tree'
    read_file: '../prism/tree_of_thought.in'
    await: @tree_thinker
    # ...
  when: strategy_name is 'graph'
    read_file: '../prism/graph_of_thought.in'
    await: @graph_explorer
    # ...
```

The `read_file` directive is not wrapped in an interrupt channel (`>>...<<`). This means it executes at runtime, right when it's needed. This pattern allows you to build actors that can augment their own capabilities on the fly, loading in new actors and personas only when a specific situation calls for them.

By studying these patterns, you can see how INDRA's simple primitives—actors, delegation, and state—can be composed to create highly intelligent and structured conversational applications.

**Next: [Guide: Reusability with Sequences & Operators](./02-using-sequences-and-operators.md)**
