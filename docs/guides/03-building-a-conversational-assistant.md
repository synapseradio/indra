# Guide: Building a Conversational Assistant

While INDRA is excellent for creating single-purpose tools, its stateful, turn-based nature makes it uniquely suited for building persistent, multi-turn conversational assistants. These are actors that remain active across many interactions with the user, remember the context of the conversation, and adapt their behavior over time.

The `@ponder` actor (`/core/command-overlays/ponder.in`) is a perfect case study for this. It's a creative partner that doesn't just answer a single query, but engages in an extended dialogue to help an idea evolve.

This guide will break down the core pattern used in `@ponder` that you can use to build your own advanced conversational agents.

---

### The Core Pattern: The Suspendable `until` Loop

The heart of any persistent conversational actor in INDRA is an `until:` loop that is designed to be suspended and resumed. This creates a **conversational state machine**.

Here is the simplified structure from `@ponder`:

```indra
actor @ponder:
  perform:
    then:
      # 1. Initialization Step
      when: &context.ponder.phase is 'ready'
        # ... set up initial state ...
        say:
          to: @ponder  # -> Hands control back to itself for the next turn
          what: $(make_opening_move(...))

      # 2. Main Conversation Loop
      when: &context.ponder.phase is 'conversing'
        # ... update state based on user input ...
        
        # ... check if the conversation should end ...
        when: &context.ponder.conversation_complete is true
          say:
            to: @ponder # (or another actor to exit)
            what: "..."

        # ... handle different conversational states ...
        when: &context.ponder.response_style is 'explore_deeper'
          # ...
          say:
            to: @ponder # -> Loop continues
            what: 'continue'
        
        # ... other handlers ...
```

Let's break down the crucial mechanics here.

#### 1. The `until` Loop as a State Machine

While `@ponder` uses a series of `when` blocks, the principle is the same as an `until` loop. The actor's `perform:` block is the body of the loop. The key is that the actor's state, stored in `&context.ponder`, determines which `when` block is executed on any given turn.

*   **Turn 1 (Initialization):** The `&context.ponder.phase` is `'ready'`. The first `when` block executes, sets the phase to `'conversing'`, and makes an opening statement.
*   **Turn 2 and beyond (Conversation):** The `phase` is now `'conversing'`, so the second `when` block executes. This is the main loop where the conversation happens.

#### 2. Suspending and Resuming with `say: to: @self`

This is the most important concept. How does the loop wait for the user to reply?

The magic is in the terminating action: **`say: to: @ponder`**.

According to the INDRA execution model, every turn must end with a terminating action. When the actor passes control *back to itself*, it effectively does the following:
1.  Ends its current turn.
2.  Applies any staged `set:` operations to the `&context`.
3.  Yields control, allowing the user to provide input.
4.  The interpreter schedules `@ponder` to be the active actor for the *next* turn.
5.  When the next turn begins, `@ponder`'s `perform:` block is executed again from the top, but now with the updated `&context` (which includes the new user input in `&user.latest`).

This creates a durable conversation. The actor stays "alive" across turns, processing user input, updating its internal state, and deciding how to respond next, all within a single, elegant loop structure.

---

### Building Blocks of a Conversational Assistant

To build your own assistant like `@ponder`, you'll need these key components:

1.  **A State Namespace:** Create a dedicated space in the `&context` for your actor to store its internal state (e.g., `&context.my_assistant`). This should include things like the current phase, turn count, and any other conversational variables.

2.  **Initialization Logic:** A `when` block or similar logic that runs only on the first turn to set up the initial state and provide a welcome message.

3.  **A Main Loop:** An `until` loop or a `when` block that represents the active conversation. This is where the core logic will live.

4.  **State Analysis Operators:** Create operators that analyze the current state of the conversation. `@ponder` uses these to great effect:
    *   `detect_user_momentum`: Is the user making progress or are they stuck?
    *   `assess_idea_maturity`: How developed is the core idea of the conversation?
    *   `detect_conversation_ending`: Is the user signaling that they're finished?

5.  **Response Logic:** Inside your main loop, use `when` blocks to check the state you analyzed and deliver the appropriate response. This is how `@ponder` decides whether to explore deeper, redirect the conversation, or synthesize the results.

By combining the suspendable `until` loop pattern with stateful analysis, you can move beyond simple request-response interactions and start building truly intelligent conversational partners with INDRA.
