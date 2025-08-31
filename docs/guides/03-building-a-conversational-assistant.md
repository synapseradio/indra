# On Building Conversational Agents

An INDRA program can be more than a single-pass tool; it can be a persistent, conversational agent that maintains a shared understanding over many turns.

This guide explores the patterns for building these stateful, multi-turn agents. The goal is to move from a simple, reactive script to a thoughtful agent that can remember, adapt, and evolve with a conversation.

### The `await: @user` Primitive

The foundation of any conversational agent is the `await: @user` directive. It is a simple, explicit instruction to the INDRA interpreter to:

1. Pause the execution of the current Actor.
2. Yield control entirely to the human user.
3. Wait for the user to provide their next input.
4. When input is received, resume the Actor's execution.

This primitive is what transforms an Actor from a simple command-line tool into a conversational agent.

### The Conversational Loop

To create a persistent conversation, the `await: @user` directive is typically placed inside a stateful `until:` loop. This creates a "conversational state machine" that stays alive across many turns.

Here is the essential structure for any conversational Actor:

```indra
actor @conversational_agent:
  perform:
    then:
      # This loop runs for the entire conversation.
      until: &context.conversation.phase is 'ended'
        max_iterations: 100 # A safeguard
        sequence:
          # 1. Analyze the user's input and the current state.
          step:
            set:
              &context.conversation.momentum: $(detect_user_momentum(input: &user.latest))

          # 2. Decide on a response based on the analysis.
          step:
            when: &context.conversation.momentum is 'stuck'
              set:
                &context.conversation.response: "It feels like we're circling a bit. Shall we try a new angle?"
            otherwise:
              set:
                &context.conversation.response: "Interesting. Tell me more about that."

          # 3. Present the response to the user.
          step:
            output: $(&context.conversation.response)

          # 4. Await the user's next input.
          # This suspends the loop until the user replies.
          step:
            await: @user
```

This loop creates a cycle of **Listen -> Think -> Respond -> Wait**. With each turn, the `&context` can be enriched, allowing the agent's understanding to deepen over time.

### Designing a Thoughtful Agent

A few key elements help transform a simple bot into a more thoughtful agent.

1. **A Dedicated State Namespace:** In the `dialogue` block, create a dedicated space in the `&context` for your agent to maintain its state (e.g., `&context.my_agent`). This becomes its memory.

2. **An Initialization State:** The first time the agent runs, it should introduce itself and set up its initial state.

    ```indra
    # In the agent's perform block:
    when: &context.my_agent.phase is 'initializing'
      set:
        &context.my_agent.phase: 'conversing'
      output: "Hello! I'm ready to begin. What's on your mind?"
      await: @user
    ```

3. **State Analysis Operators:** The "thinking" part of the loop is often best handled by specialized Operators that analyze the entire state of the conversation, not just the user's last sentence. The `@ponder` agent uses operators like:
    * `detect_user_momentum`: Is the user making progress or are they stuck?
    * `assess_idea_maturity`: How developed is the core idea of the conversation?

4. **Adaptive Response Logic:** The agent can change its behavior based on its analysis. This is how it evolves from a simple script to an intelligent conversationalist.

    ```indra
    # Inside the main loop...
    step:
      set:
        &idea_stage: $(assess_idea_maturity(conversation: &context.my_agent.transcript))
    step:
      when: &idea_stage is 'nascent'
        # Ask open, exploratory questions.
        set:
          &response: "That's a new idea. Where do you think it could lead?"
      when: &idea_stage is 'crystallizing'
        # Start synthesizing and looking for evidence.
        set:
          &response: "I'm seeing a clear claim emerging here. What evidence supports it?"
    ```

By combining these elements, you can design an agent that doesn't just execute a command, but participates in a cognitive process, building a shared understanding with the user over time.

---
**Next:** [Dynamic Actor Instantiation](./04-dynamic-actor-instantiation.md)
