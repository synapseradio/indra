# INDRA Protocol Migration Guide: Agent/Persona Model

This document outlines the architectural refactoring of the INDRA protocol to a clearer and more powerful Agent/Persona model. This change resolves semantic ambiguities in the previous specification and enables more elegant and robust implementations.

## 1. The Core Problem

The previous protocol had two overlapping concepts: `persona` and `persona_template`. This created confusion about when to use each and led to semantic conflicts, particularly regarding the `as:` and `become:` actions. The line between a reusable "role" and an active "actor" was blurry.

## 2. The New Model: Agents and Personas

To resolve this, we have simplified the protocol to a single core concept, `persona`, which is differentiated by its components and a new keyword, `agent`.

* **Persona (`persona @name:`)**
  * A **Persona** is a "headless" collection of behavioral constraints (`are`, `must`, `understand`).
  * It represents a role, a "hat," or a mode of being.
  * It has **no `perform` block** and therefore has no agency of its own. It cannot initiate actions or be the target of a `dialogue`'s `start:` block.
  * It is a reusable, inert blueprint of a behavior.

* **Agent (`agent @name:`)**
  * An **Agent** is an active, addressable actor in the system.
  * It is defined like a Persona but **includes a `perform` block**.
  * This `perform` block grants it agency, allowing it to be a dialogue entry point and execute turns.

This distinction removes the ambiguity of the old system.

## 3. Clarified Roles of `as:` and `become:`

This new model allows for a crystal-clear definition of the two primary methods of persona interaction:

* `as: @persona_name`
  * **Function:** Role Adoption.
  * **Context:** Used inside a `sequence` block by an active **Agent**.
  * **Action:** The Agent temporarily adopts the behavioral constraints of the specified Persona for a single step. The Agent is still the actor, but it's "wearing the hat" of the Persona.

* `become: @persona_name`
  * **Function:** Temporary Instantiation.
  * **Context:** Used in a `then:` block.
  * **Action:** Takes an inert **Persona**, injects a `perform` block, and turns it into a complete, temporary **Agent** for a single turn of execution.

## 4. Practical Example: Refactoring `tree_of_thought`

This new model allows us to refactor complex operations like the Tree of Thought sequence elegantly.

### Before (Old, Flawed Model)

The old model forced the `thought_*` personas to be full-fledged actors, making the sequence clunky and leading to protocol violations.

```indra
# This was a full persona with a perform block
@thought_decomposer:
  you:
    # ... identity ...
  perform:
    # ... full perform block ...
  then:
    say: to: @thought_generator ...

# The sequence was a series of "say" actions, transferring turns
# between heavyweight actors.
```

### After (New Agent/Persona Model)

The `thought_*` constructs become lightweight, headless Personas. A single Agent can then adopt them sequentially to perform the cognitive work within a single turn.

```indra
# A headless, reusable Persona (a role)
persona @thought_decomposer:
  you:
    possess:
      identifier: 'THOUGHT_DECOMPOSER'
    are: "someone who breaks problems into parts"
    must:
      - "identify sub-problems"
    understand: "complex problems have structure"

# A single Agent executes the sequence, adopting Personas as needed
agent @tree_of_thought_agent:
  you:
    # ... identity ...
  perform:
    through: "Tree of Thought analysis"
    sequence:
      step:
        as: @thought_decomposer
        output: <<| Breaking down the problem... |>>
        set: &context.tree.subproblems: ...
      step:
        as: @thought_generator
        output: <<| Generating solutions for subproblems... |>>
        set: &context.tree.options: ...
      step:
        as: @thought_evaluator
        output: <<| Evaluating best path... |>>
        set: &context.tree.best_path: ...
    intention: "to perform a structured analysis in a single turn"
  then:
    say:
      to: @synthesis_engine
      what: 'tree_reasoning_complete'
```

This new approach is more efficient, protocol-compliant, and better reflects the underlying cognitive model.
