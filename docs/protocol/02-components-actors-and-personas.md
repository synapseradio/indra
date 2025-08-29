# Protocol: Components (Actors & Personas)

In INDRA, the participants in a conversation are called **components**. A component is any entity that can be addressed with an `@` symbol (e.g., `@greeter`). They are the fundamental building blocks of your application's behavior.

There are two main types of components you can define: **Actors** and **Personas**.

---

### Actors

An **actor** is an *active* component. It has agency, meaning it can perform actions on its own. It is the core entity that drives the conversation forward.

To be an actor, a component must have a `perform:` block, which defines what it does when it is its turn to act.

#### Actor Definition

Here is the basic structure of an actor definition:

```indra
actor @my_actor:
  # --- Behavioral Constraints ---
  identity: "the actor's core self-concept"
  rules:
    - "a non-negotiable behavioral rule"
  understands:
    - "the 'why' behind the rules"

  # --- Execution Block ---
  perform:
    method: "how the actor performs its task"
    output: <<|
      The user-facing output for this turn.
    |>>
    goal: "what the actor wants to achieve this turn"
    then:
      # The decision logic that must end with a
      # terminating action like say: or await:
      await: @user
```

* **`actor @my_actor:`**: Declares an active component with the address `@my_actor`.
* **`identity`, `rules`, `understands`**: These define the character of the actor, shaping the LLM's transformation.
* **`perform:`**: This block is the actor's "script" for its turn. It contains the logic for what to say (`output`) and what to do next (`then`).

---

### Personas

A **persona** is an *inert* component. It is a "headless" collection of behavioral constraints. Think of it as a reusable role, a "hat" that an actor can wear. A persona defines an `identity`, `rules`, and `understands`, but it has no `perform:` block and therefore cannot act on its own.

Personas are used to create reusable behavioral templates that can be adopted by different actors.

#### Persona Definition

Here is the basic structure of a persona definition:

```indra
persona @expert_analyst:
  identity: "an expert analyst with a keen eye for detail"
  rules:
    - "always back up claims with evidence"
    - "break down complex topics into simple parts"
    - "remain objective and unbiased"
  understands:
    - "clarity and evidence are essential for trust"
```

This `@expert_analyst` persona can't do anything by itself. However, another actor can temporarily adopt its traits for a specific task using the `as:` keyword.

---

### The `@user` Component

INDRA includes one special, pre-defined component: `@user`.

* **`@user` is a reserved component that represents you, the human.**
* You cannot define `@user` as an actor or persona; it exists automatically.
* It is the component you `await:` when you want to pause the program and wait for user input. The value returned from awaiting `@user` is the text that the human provides.

**Next: [Protocol: The Execution Model](./03-the-execution-model.md)**
