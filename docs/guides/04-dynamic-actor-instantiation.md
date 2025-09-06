# On Dynamic Actor Instantiation

In INDRA, you can define a fixed cast of Actors in an `.in` file. Sometimes, however, a thought process calls for a specialist that wasn't anticipated, or requires a specific cognitive "lens" for just a single moment.

This is the purpose of **Dynamic Actor Instantiation**. It is a pattern that allows for a more fluid and adaptive process, where specialist agents can be summoned on the fly.

---

### The Core Idea: Personas as Blueprints

The foundation of this pattern is the distinction between a **Persona** and an **Actor**.

* A **Persona** is a *stateless blueprint* for behavior. It's a "role" or a "hat." It has an `identity`, `rules`, and `understands`, but it has no `perform:` block. It knows *how* to be, but it doesn't know what to *do*. It cannot act on its own.

* An **Actor** is a *stateful instance* of a character. It has a `perform:` block and can be part of a `dialogue`. It is a participant in the cognitive process.

Think of a Persona as a job description, and an Actor as the person hired to do that job.

### The `become:` Action: Bringing a Persona to Life

The `become:` action is the bridge between these two concepts. It is an instruction that tells the INDRA interpreter to:

1. Take a Persona (the blueprint).
2. Give it a temporary `perform:` block (the specific task).
3. Instantiate it as a temporary, anonymous Actor.
4. Execute its `perform:` block immediately for a single turn.
5. Let the temporary Actor disappear.

This allows for the summoning of a specialist for a single, focused task, without having to define a permanent Actor for it.

### A Practical Example

Imagine a reasoning system where the main `@orchestrator` Actor is managing the flow. At a key moment, it needs a highly skeptical perspective to challenge an emerging conclusion.

Instead of defining a permanent `@skeptic` Actor, a `@skeptic` *Persona* can be defined and instantiated only when needed.

**1. Define the Persona (The Blueprint):**

```indra
# in 'personas.in'

persona @skeptic:
  identity: "a rigorous and skeptical analyst"
  rules:
    - "question the primary assumption of any claim"
    - "demand evidence for all assertions"
  understands:
    - "the first conclusion is often not the best one"
```

**2. Dynamically Instantiate it in Your Actor:**

```indra
actor @orchestrator:
  perform:
    then:
      # ... some reasoning happens, a conclusion is reached ...
      set:
        &context.conclusion: "The data suggests X is the cause."

      # Now, summon the skeptic for a single turn to challenge this.
      become: @skeptic
      with:
        # We can even pass context to the temporary actor
        conclusion_to_test: &context.conclusion
      perform:
        method: "challenging the current conclusion"
        output: <<|
          I have been asked to challenge the conclusion: "~(&context.conclusion_to_test)~".

          My skeptical analysis is:
          ~(<As a skeptic, what is the primary flaw or alternative explanation for this conclusion?>)~
        |>>
        goal: "to provide a rigorous counter-argument"
        then:
          # A temporary actor still needs to terminate its turn.
          # Here, it simply returns control to the main flow.
          say:
            to: @orchestrator
            what: 'challenge_complete'
```

### Why This Pattern is Powerful

1. **Keeps Your System Clean:** You don't need to define dozens of Actors for every possible task. You can define a few core Personas (like `@skeptic`, `@synthesizer`, `@creative_explorer`) and instantiate them as needed.
2. **Separation of Concerns:** Personas are purely about *behavioral style*. The `perform:` block provided by the `become:` action is purely about the *task at hand*. This is a clean separation of "who you are" from "what you're doing."
3. **Enables Adaptive Systems:** Your Actors can learn to summon different specialists based on the context of the conversation. An Actor could decide, "This problem seems to have a logical flaw; I should `become:` a `@logician` to analyze it."

By mastering the distinction between Personas and Actors and using the `become:` action, you can design cognitive systems that are not just pre-programmed, but are truly adaptive, responsive, and capable of summoning the right perspective for the right moment.

---
**Next:** [Component Pipelines and Composition](./05-component-pipelines-and-composition.md)
