# On Long-Form Inquiry

An INDRA process can be more than a single exchange; it can be a sustained inquiry, a conversation that unfolds over many turns, maintaining a coherent thread of thought throughout.

This is not just about remembering the last thing that was said. It is about creating a shared history, a space where a complex idea can be paused, resumed, and evolved over time.

---

### The Suspendable Loop

The key to building these long-form inquiries in INDRA is the **stateful, suspendable `until` loop**.

An `until` loop has a special property: if it contains a `say:` or `await: @user` action, the loop **suspends** its state and yields control. When control returns to the Actor on a subsequent turn, the INDRA interpreter automatically **resumes** the loop exactly where it left off.

This is what makes long-form reasoning possible. The loop's internal state—its iteration count, its local variables, its position in the sequence of steps—is preserved in the `&context` across turns.

Let's look at the `@reason` Actor, which is a primary example of this pattern.

```indra
actor @reason:
  perform:
    then:
      # This loop can take many turns to complete.
      until: &context.reason.phase is 'ended'
        max_iterations: 100
        sequence:
          # --- Phase 1: Awaiting & Understanding Query ---
          step:
            when: &context.reason.phase is 'awaiting_query'
              # The await:@user inside @query_analyst will suspend the whole loop.
              await: @query_analyst
              store_in: &context.query_breakdown
              set:
                &context.reason.phase: 'planning' # Move to the next state for the same turn.

          # --- Phase 2: Planning the Reasoning Strategy ---
          step:
            when: &context.reason.phase is 'planning'
              # ... planning logic ...
              set:
                &context.reason.phase: 'executing'

          # --- Phase 4: Presenting & Looping ---
          step:
            when: &context.reason.phase is 'presenting'
              output: ~(format_synthesis(...))~
              
              # Reset for the next inquiry and wait for the user.
              set:
                &context.reason.phase: 'awaiting_query'
              
              # This suspends the loop, waiting for the user's next complex query.
              await: @user
```

### How This Creates a Sustained Process

1. **Stateful Phases:** The Actor uses a state variable (`&context.reason.phase`) to track its progress through a complex task (understanding, planning, executing, presenting).
2. **Suspension Points:** The `await: @user` directive acts as a "checkpoint." The Actor does its work, presents its findings, and then patiently waits for the user's next move, perfectly preserving its state.
3. **Resumption:** When the user provides new input, the loop doesn't start from scratch. The interpreter restores its state, and it evaluates its `when` conditions again. If the phase is `'awaiting_query'`, it knows it's time to begin the next cycle of inquiry.

This pattern allows for the design of Actors that can manage complex, multi-stage tasks that would be impossible to handle in a single turn.

### Designing for a Shared History

When building these systems, it is helpful to think about what needs to be remembered to maintain a coherent inquiry over time.

* **Cumulative Knowledge:** A place can be created in the context to store insights as they are discovered. The `@confer` Actor does this by accumulating an `&context.confer.cumulative_synthesis` across many rounds of debate.
* **Process Memory:** The Actor can remember not just the *what* but the *how*. Storing the reasoning plans it has executed or the strategies it has attempted allows it to learn and avoid repeating itself.
* **The User's Journey:** The `&user.history` variable tracks the user's questions and feedback over time. A sophisticated agent might notice patterns in the user's inquiry, such as, "I notice we keep coming back to the topic of security. Perhaps we should focus there."

By designing Actors that can maintain and reflect on a shared history, one moves from creating simple conversational tools to architecting long-term inquiries.

---
**Next:** [On Epistemic Humility](./08-on-epistemic-humility.md)
