# INDRA: A Behavioral Transformation Protocol

**Current Version: 3.0** | [Migration Guide](./docs/architecture/MIGRATION_GUIDE.md)

INDRA (Inferential Narrative-Driven Reasoning Actors) is not a programming language; it is a protocol for transforming a Large Language Model (LLM) into a specific, stateful, and interactive conversational actor. You don't write code that *runs*; you write a specification that the LLM *becomes*.

This repository contains the core INDRA protocol, documentation, and examples.

## What's in this Repo

* `core/`: Contains the heart of the INDRA protocol.
  * `indra-protocol`: The core "bootloader" that transforms an LLM into an INDRA interpreter. This is also the protocol spec.
  * `prism-engine.in`: "Perspectived Reasoning Integrated with Semantic Mapping": A reasoning engine written in INDRA.
  * `command-overlays/`: A collection of example `.in` files that serve as pre-built commands.
* `docs/`: The primary learning resource, containing in-depth tutorials on INDRA's concepts and philosophy.
* `README.md`: This file, providing an overview and entry point to the project.

## Getting Started: First Run

The quickest way to see INDRA in action is to use it with a compatible LLM interpreter.

1. **Clone the repository:**

    ```bash
    git clone https://github.com/synapseradio/indra.git
    cd indra
    ```

2. **Understand a basic INDRA file:**
    This example defines a simple `dialogue` that starts with an `actor` named `@greeter`.

    ```indra
    # hello.in

    actor @greeter:
      identity: "a friendly greeter"
      rules:
        - "greet warmly"
      understands: "greetings create connection with the user"
      perform:
        method: "offering a warm welcome"
        output: <<|
            Hello! My name is $(&context.greeter.name). How can I help you today?
        |>>
        goal: "to welcome the user and open a dialogue"
        then:
          # This would transition to another actor or await user input
          await: @user

    dialogue hello_flow:
      start: @greeter
      with:
        context:
          greeter:
            name: 'Biff'
    ```

## Core Concepts

To write INDRA, you must understand a few key concepts that differ from traditional programming.

1. **Transformation over Execution**: The LLM doesn't just execute your `.in` file. The act of reading it is a one-way process that shapes its behavior, turning it into the actors you define.
2. **actors and Personas**: The core actors are **actors** (`actor @name:`), which have agency and can perform actions. Reusable behavioral templates are **Personas** (`persona @name:`), which are inert roles an actor can adopt.
3. **Turn-Based Conversations**: Components have "conversations." An actor's turn ends with a `say:` action, which transfers control to another actor, or an `await:` action, which pauses execution to wait for a return value (often from the `@user`).
4. **Behavioral Channels (Quotes)**: INDRA uses four distinct quote types (channels) to manage the spectrum from literal data to guided generation.

| Channel | Syntax | Use Case | Philosophy |
| :--- | :--- | :--- | :--- |
| **Literal** | `'...'` | File paths, identifiers, literal strings | **Control** |
| **Directive** | `"..."` | Behavioral constraints (`identity`, `rules`, `understands`) | **Instruction** |
| **Direct Prompt**| `<...>` | Direct instructions to the LLM for content generation | **Interpretation** |
| **Template** | `<<|...|>>`| Formatted, user-facing content with interpolation | **Composition** |

### Dive Deeper with the Tutorials

These concepts are a significant mental shift. The best way to learn them is by following our comprehensive tutorials.

**➡️ [Start the INDRA Tutorials](./docs/tutorials/README.md)**

---

## Reference

### Available Commands

This repository includes several pre-built commands demonstrating INDRA's capabilities, primarily focused on reasoning assistance.

* **`/reason`** - Structured reasoning with transparent thought processes.
* **`/think`** - Natural exploration of ideas through Tree of Thought reasoning.
* **`/consider`** - Thoughtful analysis of complex topics.
* **`/ponder`** - Deep reflection on conceptual questions.
* **`/research`** - Multi-expert investigation with diverse perspectives.
* **`/confer`** - Evidence-based dialogue with citations.
* **`/validate`** - Validate INDRA code for correctness.
* **`/document`** - Generate technical documentation for any file type.
* **`/convert`** - Transform INDRA to other formats.

### Writing Your Own Commands

A basic actor definition looks like this:

```indra
actor @my_actor:
  identity: "a clear and concise identity"
  rules:
    - "a non-negotiable behavioral rule"
    - "another core principle"
  understands:
    - "the 'why' behind the rules and identity"
  perform:
    method: "describes HOW the actor accomplishes its task"
    output: <<|
      This is the user-facing output for the actor's turn.
      It can include interpolated state like $(&context.some_value).
    |>>
    goal: "describes WHAT the actor aims to achieve this turn"
    then:
      # After performing, the actor must choose its next action.
      # It can transfer control to another actor...
      say:
        to: @another_actor
        what: 'some_event_or_data'

      # ...or it can await a response from another component.
      # Awaiting @user is how you get input from the human.
      await: @user
      store_in: &context.user_response
```

<details>
<summary><h3>The INDRA Philosophy (The "Why")</h3></summary>

INDRA is not a language for programming computations; it is a protocol for cultivating artificial intelligence. Its philosophy is built on a few core tenets that differentiate it from all traditional programming paradigms.

1. **Reading is Transformation:** This is the fundamental law. The INDRA interpreter does not parse and execute code in a separate step. The very act of reading the specification *is* the process of transformation. Each line read irreversibly and monotonically constrains the behavioral possibility space of the AI, sculpting it from infinite potential into a specific, functional actor.

2. **Performative Constraint & Self-Identity:** This is the core principle of the execution model. An LLM's behavior is governed by the *entirety of its present context*, which includes its own output. Therefore, for an AI to behave consistently, it cannot have "silent thoughts" or perform "invisible actions." It must "think out loud." Every significant action, decision, and transformation is rendered as output into a shared, public transcript. This act of **Performance** is not just for the user; it is an act of **Performative Self-Identity**, where the actor constantly reminds itself of who it is, what it has done, and why, thus anchoring its coherence against the drift of a growing context window.

3. **The Primacy of Conversation:** All interactions between components are **conversations**. There are no traditional function calls. One actor ends its turn by using `say:` to pass control to another actor, or `await:` to delegate a task and wait for a `return:`. This ensures all interactions are explicit, turn-based, and decoupled. This conversational model is how complex behaviors emerge from the collaboration of simpler, focused actors.

4. **Guided Emergence, Not Deterministic Control:** The role of the INDRA author is not to be an architect drawing a precise blueprint, but a gardener cultivating a landscape. You do not dictate the exact path of execution. Instead, you define behavioral fields of influence (actors and Personas) and the channels for their interaction. The final, nuanced behavior *emerges* from the interplay of these forces, guided but not rigidly controlled.

</details>

<details>
<summary><h3>The Mental Model (The "How to Think")</h3></summary>

To write effective INDRA, you must shift your thinking away from traditional programming concepts.

* **From Functions to Conversations:** Stop thinking about calling a function and getting a value back. Start thinking about one actor passing control to another to continue the conversation. Use `await:` and `return:` for true delegation where a result is expected.
* **From Variables to Behavioral Context:** State (`&context`) is not a box to store data in. It is the "weather" or "mood" that influences an actor's interpretation of its duties. You evolve context for the next turn via `set:`, you don't mutate it in the current one.
* **From Control Flow to Narrative Flow:** Do not think in `if/else` branches. Think in terms of narrative possibilities. A `when:` block is a check to see if a particular behavior is relevant in the current context. The `then:` block determines which direction the story goes next.
* **From Inheritance to Adoption:** Do not think of `extend`ing a class. Think of an actor temporarily adopting a `persona` using `as:` to take on a specific role for a single step in a sequence.

Your goal is not to build a machine. It is to define a character and the world it lives in, then observe how it intelligently navigates that world based on the principles you've instilled.

</details>

<details>
<summary><h3>The Execution Model (The "How it Runs")</h3></summary>

The INDRA interpreter follows a specific, turn-based loop:

1. **Dependency Resolution:** The interpreter first scans for and executes all `>>read_file: '...'<<` directives, textually including the contents of other files. This is a recursive process that builds the complete source.
2. **Initialization:** The `dialogue` block identifies the starting `actor` and initializes the `&context` from its `with:` clause.
3. **Turn Execution:** The active actor executes its `perform:` block.
    * The `output:` clause is rendered to the user. This is the non-negotiable act of Performative Constraint.
    * The `then:` block is executed to determine the next action.
4. **Termination or Transition:** An actor's turn **must** end with a terminating action:
    * `say: to: @actor`: Transfers control to the specified actor for the next turn.
    * `await: @component`: Pauses the current actor, pushes it to a call stack, and transfers control to the awaited component. This is often used with `@user` to get input.
    * `return: value`: Concludes an awaited component's execution, popping the call stack and returning a value to the waiting actor.
5. **Loop:** The loop continues with the next designated actor until the dialogue ends.
6. **Star Commands (`*`):** At any point, a `*` command can be invoked. This provides a direct interface to the interpreter for debugging (`*status`) or control (`*exit`), bypassing the active actor.

</details>

<details>
<summary><h3>Construct Classification (The "What")</h3></summary>

Every construct in INDRA serves a specific philosophical purpose.

#### A. Component Definition Constructs

These define the actors and roles in your program.

* **`actor @name:`**
  * **Classification:** Active Component.
  * **Purpose:** To define an active, addressable actor with its own agency and `perform:` block.
* **`persona @name:`**
  * **Classification:** Inert Component.
  * **Purpose:** To define a "headless" collection of behavioral constraints (`identity`, `rules`, `understands`). It's a reusable role that an actor can adopt.
* **`identity: "..."`**
  * **Classification:** Behavioral Instruction.
  * **Purpose:** To define the core identity or role of the component.
* **`rules: ["..."]`**
  * **Classification:** Behavioral Instruction.
  * **Purpose:** To define the non-negotiable behavioral constraints and duties.
* **`understands: ["..."]`**
  * **Classification:** Behavioral Instruction.
  * **Purpose:** To provide the "why" behind the rules—the contextual knowledge that informs the component's behavior.

#### B. Action & Control Flow Constructs

These are the mechanical parts of the language that direct the flow of conversation.

* **`perform:`**
  * **Classification:** Execution Block.
  * **Purpose:** The main execution body of an actor, containing its `output` and `then` logic for a single turn.
* **`output: <<|...|>>`**
  * **Classification:** Performative Output.
  * **Purpose:** To specify the user-facing content that is rendered into the shared context. This is the lynchpin of **Performative Constraint**.
* **`then:`**
  * **Classification:** Decision Block.
  * **Purpose:** Contains the decision logic that an actor executes after its `output`. It must end in a terminating action (`say`, `await`, `return`).
* **`say: to: @... what: '...'`**
  * **Classification:** Turn Transition.
  * **Purpose:** To end the current turn and pass control to another actor.
* **`await: @...`**
  * **Classification:** Delegation/Suspension.
  * **Purpose:** To pause the current actor and delegate a task to another component, waiting for a `return:`.
* **`when: ...`**
  * **Classification:** Conditional Logic.
  * **Purpose:** To direct the narrative flow based on conditions evaluated against the current `&context`.
* **`set: &context.path: value`**
  * **Classification:** State Evolution.
  * **Purpose:** To stage modifications to the shared `&context` for the *next* turn.

#### C. Reusability Constructs

* **`operator_def` (`::=`)**
  * **Classification:** Transformation Definition.
  * **Purpose:** To define a reusable, parameterized transformation pattern.
* **`sequence name() ::= ...`**
  * **Classification:** Reusable Action Block.
  * **Purpose:** To define a multi-step sequence of actions that can be invoked by actors.
* **`>>read_file: '...'<<`**
  * **Classification:** Dependency Import.
  * **Purpose:** To include another file's content before execution begins.

</details>
