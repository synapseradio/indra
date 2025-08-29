# Protocol: The Execution Model

The INDRA Execution Model defines the "physics" of a cognitive process. It's a turn-based system that governs how actors communicate, how state evolves, and how control flows through a conversation. Understanding this model is key to choreographing complex and predictable reasoning architectures.

At its heart, the model is a simple loop: an actor performs a turn, and at the end of that turn, it passes control to another actor (or back to itself). But within that simplicity lies a sophisticated process for managing state and ensuring coherence.

---

### The Anatomy of a Turn

Every turn in INDRA follows a precise, eight-step sequence. This ensures that operations happen in a predictable order, which is crucial for building reliable systems.

Let's say Actor A is performing its turn:

1. **Activation:** Actor A's `perform:` block is activated.
2. **Method Execution:** The `method:` string is evaluated.
3. **Goal Execution:** The `goal:` string is evaluated.
4. **`then:` Block Evaluation:** The logic inside the `then:` block is executed from top to bottom.
5. **State Mutation Staging:** Any `set:` operations encountered are *staged*, but **not yet applied**. They are held in a temporary queue for this turn.
6. **Sequence Execution:** If a `sequence:` is called, its steps are executed immediately. `set:` operations *inside a sequence* are applied instantly within the sequence's scope.
7. **Terminating Action:** The turn must end with a single terminating action, like `say:`, `return:`, or `await:`. This action determines which actor will take the next turn and what information is passed to them.
8. **State Commit:** After the turn has officially ended, the staged `set:` operations from step 5 are now committed to the global `&context`, making them available for the *next* turn.

### The Two Horizons of State: Immediate vs. Staged

This distinction between when a state change is *staged* and when it is *committed* is the most critical concept in the execution model.

- **Inside a `sequence`:** State is **immediate**. When you `set:` a variable in step 1, it is instantly available in step 2. This allows you to build a narrative of thought where each step directly informs the next.

- **Inside an actor's `perform:` block:** State is **staged for the next turn**. When an actor changes a variable with `set:`, it's making a plan for the future. The change only becomes "real" after its turn is over. This prevents actors from reacting to their own state changes within a single turn, creating a more stable and predictable system.

**Example:**

```indra
actor @state_example:
  perform:
    then:
      # 1. Stage a change to the context.
      set: &context.value: "new value"

      # 2. Check the value.
      when: &context.value is "new value"
        # This block will NOT execute on this turn, because the
        # change to &context.value has not been committed yet.
        # It will only be "new value" on the *next* actor's turn.
        output: "I see the new value."
      otherwise:
        # This block WILL execute.
        output: "I see the old value."
```

### The Flow of Control: Delegation and Return

Actors don't have to do all the thinking themselves. They can delegate tasks to other actors or sequences using `await:`.

- **`await:`:** This command pauses the current actor and passes control to another component. It's like asking a colleague for help. The calling actor waits patiently until the awaited component is finished.
- **`return:`:** This is how an awaited component hands back its results. It's a special terminating action that can *only* be used by a component that has been `await`ed. It ends the sub-task and gives the result back to the original caller.
- **`store_in:`:** This is how the original actor catches the result from the `return:` statement.

This creates a **call stack**, allowing you to build complex reasoning by composing the capabilities of many specialist actors.

**Example:**

```indra
actor @orchestrator:
  perform:
    then:
      # 1. Delegate the task of analysis to a specialist.
      await: @query_analyst
      with: { query: &user.latest }
      store_in: &context.analysis_result

      # 3. Use the result to continue its own work.
      output: "The analyst reported: $(&context.analysis_result)"

actor @query_analyst:
  perform:
    then:
      # 2. Perform its specialized task and return the result.
      set: &result: $(understand_query(query: &context.query))
      return: &result
```

By mastering these three concepts—the turn anatomy, the two horizons of state, and the delegation model—you can design cognitive processes of any complexity with confidence and precision.

---
**Next: [State and Context](./04-state-and-context.md)**
