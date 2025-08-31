# On Runtime Control with Star Commands

An INDRA process is not a static script; it is an interactive, real-time exploration. While Actors can guide a conversation, the human user often needs a way to step in, provide direction, or inspect the process.

In INDRA, **Star Commands** (`*command`) are the mechanism for this direct, runtime control. They are a special communication channel between the user and the INDRA interpreter, allowing for instructions that exist outside the normal flow of conversation.

---

### The Core Idea: A Hand on the Wheel

Think of a normal conversation with an INDRA Actor as a journey where the Actor is driving. Star Commands are a way of reaching over and adjusting the GPS, checking the engine diagnostics, or even taking the wheel for a moment to suggest a different route.

There are two main types of Star Commands:

1. **Global Commands:** Built-in commands like `*trace` and `*status` that control the entire INDRA session.
2. **Actor-Specific Commands:** Custom commands defined within an Actor's `interface` block, allowing for control over that specific Actor's behavior.

### Global Commands: Controlling the Session

These commands are always available and provide essential tools for debugging and observation.

* `*trace`: Toggles a debug mode that makes the inner workings of the INDRA interpreter visible. It shows which Actors are being activated, how conditions are being evaluated, and how state is changing. It is the single most useful tool for understanding why a process is behaving the way it is.

* `*status`: When trace mode is on, this command prints a snapshot of the current state of the `&context`, showing the exact "shared world" at that moment in the conversation.

* `*exit`: Immediately and cleanly terminates the INDRA session.

### Actor-Specific Commands: The `interface` Block

This is where runtime control becomes a powerful design tool. By adding an `interface` block to an Actor, custom Star Commands can be created that are only available when that Actor is active.

This allows the user to be given specific controls over that Actor's process.

#### Example: A Reasoning Actor with a `*strategy` Command

The `@reason` Actor is designed to be able to use different reasoning strategies (like `tree` of thought or `graph` of thought). The `interface` block can be used to let the user choose the strategy at runtime.

```indra
actor @reason:
  identity: "an active reasoning companion..."
  
  interface:
    *strategy:
      description: "Force a specific reasoning strategy (e.g., *strategy tree,graph)"
      handler:
        # This `set:` action happens immediately when the command is run.
        set:
          &context.reason.force_strategy: &args
        output: <<|
          *Strategy override: [$(each: &args as |s| { <<|$(s)|>> })]. I will use this plan for the next reasoning task.*
        |>>

  perform:
    then:
      # ... inside the main reasoning loop ...
      step:
        when: &context.reason.phase is 'planning'
          # The actor checks if the user has set a forced strategy.
          when: &context.reason.force_strategy is not ''
            set:
              &context.reason.plan: {
                plan_narrative: "Executing user-provided plan...",
                strategy_list: &context.reason.force_strategy
              }
            # Clear the override so it only applies once.
            set:
              &context.reason.force_strategy: ''
          otherwise:
            # If not, compose a plan dynamically.
            set:
              &context.reason.plan: $(compose_reasoning_plan(...))
      # ...
```

**How it works:**

1. **Definition:** The `interface` block defines the `*strategy` command, its description, and a `handler` that specifies what to do when it's called.
2. **Execution:** When the user types `*strategy tree`, the INDRA interpreter immediately executes the `handler`.
3. **State Change:** The handler sets the `&context.reason.force_strategy` variable to the arguments provided by the user (`&args`).
4. **Actor Awareness:** In its next turn, the `@reason` Actor's `perform:` block checks this context variable and adjusts its behavior accordingly.

This pattern creates a powerful, interactive feedback loop. The user can directly influence the internal process of the Actor, making the exploration more dynamic and collaborative.

By using the `interface` block, you can design Actors that are not just autonomous agents, but are truly steerable instruments in a shared process.
