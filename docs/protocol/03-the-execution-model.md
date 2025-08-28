# Protocol: The Execution Model

The INDRA interpreter operates on a simple but strict execution model: a **single-threaded, turn-based event loop**. Every action in an INDRA program happens within a "turn," and each turn is executed to completion before the next one begins. This ensures that the flow of conversation is always predictable and explicit.

### The Turn

An actor's turn consists of two main phases:

1.  **Performance:** The `perform:` block of the active actor is executed. This always involves rendering the `output:` clause, which is the visible, user-facing part of the turn.
2.  **Decision:** The `then:` block is executed immediately after the `output`. This is where the actor decides what to do next, based on the current state of the `&context`.

### Turn Termination: Transferring Control

This is the most critical rule of the execution model: **every turn must end with a terminating action.** An actor cannot simply "finish" its turn and do nothing. It must explicitly hand off control to another component or pause for input.

There are three terminating actions:

1.  **`say: to: @another_actor`**
    *   **Purpose:** To end the current turn and pass control to another actor.
    *   **Analogy:** This is like saying, "I'm done, it's your turn to speak now."
    *   **Flow:** The current actor's turn ends immediately, and the interpreter schedules `@another_actor` to take the next turn.

2.  **`await: @some_component`**
    *   **Purpose:** To delegate a task to another component and pause execution until a result is received.
    *   **Analogy:** This is like asking a question and waiting for an answer. It creates a "call stack."
    *   **Flow:** The current actor's execution is suspended. The interpreter activates `@some_component`. When that component finishes, it must use `return:` to send a value back, at which point the original actor wakes up and continues its `then:` block.
    *   **Special Case:** `await: @user` is a unique version of this action. It suspends the actor's turn and waits for input from the human, but does not require an explicit `return:` from another component. The user's input implicitly becomes the return value.

3.  **`return: some_value`**
    *   **Purpose:** To conclude the execution of an awaited component and return a value to the caller.
    *   **Analogy:** This is providing the answer to the question that was asked via `await:`.
    *   **Flow:** This action "pops the call stack," ending the current component's turn and resuming the execution of the actor that was waiting for it.

### Blocking Operations

All operations in INDRA are **blocking**. When an actor performs an action, whether it's generating output, setting a context variable, or awaiting another component, that action must fully complete before the next one begins. This single-threaded, blocking model removes ambiguity and ensures a deterministic flow of logic within a turn.

### Execution Order: Interrupts vs. Runtime

The interpreter processes an INDRA file in distinct phases:

1.  **Dependency Resolution (Pre-Runtime):** Before any actor takes a turn, the interpreter scans the entire file for directives wrapped in the **Interrupt Channel** (`>>...<<`). It executes these immediately. This is primarily used for `>>read_file: '...'<<` to ensure all necessary code is loaded before the program starts.
2.  **Runtime Execution:** After all interrupts are handled, the `dialogue` block is initiated, and the `start` actor takes the first turn. The turn-based loop continues from here. Any `read_file` directives encountered *without* the interrupt channel are executed dynamically as part of a turn.

**Next: [Protocol: State and Context](./04-state-and-context.md)**
