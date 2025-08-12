# INDRA: A Behavioral Transformation Protocol

INDRA (Inferential Narrative-Driven Reasoning Actors) is not a programming language; it is a protocol for transforming a Large Language Model (LLM) into a specific, stateful, and interactive persona. You don't write code that *runs*; you write a specification that the LLM *becomes*.

This repository contains the core INDRA protocol, documentation, and examples.

## What's in this Repo

* `core/`: Contains the heart of the INDRA protocol.
  * `INDRA.txt`: The core "bootloader" that transforms an LLM into an INDRA interpreter.
  * `prism-engine.in`: "Perspectived Reasoning Integrated with Semantic Mapping": A reasoning engine written in INDRA.
  * `command-overlays/`: A collection of example `.in` files that serve as pre-built commands.
  * `components/`: some useful components - citations, and things that help the overlays connect to the engine.
* `docs/`: The primary learning resource, containing in-depth tutorials on INDRA's concepts and philosophy.
* `test/`: A couple of tests and fixtures for verifying the validator.
* `README.md`: This file, providing an overview and entry point to the project.

## Getting Started: First Run

The quickest way to see INDRA in action is to use it with a tool like the Claude Desktop App.

1. **Clone the repository:**

    ```bash
    git clone https://github.com/synapseradio/indra.git
    cd indra
    ```

2. **Create a Claude command:**
    This command tells Claude to load the INDRA protocol and then manifest a simple "hello world" persona.

    ```bash
    # Make sure the path to the indra project is correct
    mkdir -p ~/.claude/commands
    cat > ~/.claude/commands/hello.md << 'EOF'
    # Hello

    Read `~/projects/ai/indra/core/INDRA.txt` to become.

    Manifest output:

    @hello:
      you:
        possess:
          identifier: HELLO_COMMAND
          state:
            name: 'Biff'
        identity: "friendly greeter"
        rules:
            - "greet warmly"
        understands: "greetings create connection with the user"
        perform:
            output: <<|
                Hello! I am ${@hello.state.name}. How can I help you today?
            |>>
    EOF
    ```

3. **Try it in Claude:**

    ```
    /hello
    ```

## Core Concepts

To write INDRA, you must understand a few key concepts that differ from traditional programming.

1. **Reading is Transformation**: The LLM doesn't just execute your `.in` file. The act of reading it is a one-way process that shapes its behavior.
2. **Performative Identity**: An INDRA persona must "think out loud." Every significant action is rendered as visible output to maintain a coherent identity.
3. **Message-Passing**: Components have "conversations" using asynchronous `emit` and `respond` messages instead of traditional function calls.
4. **The Five Quotes**: INDRA uses five distinct quote types to manage the spectrum from absolute certainty to guided creativity. Mastering these is essential.

| Quote | Type | Use Case | Philosophy |
| :--- | :--- | :--- | :--- |
| **`''`** | Single Quote | Literal data, state values, comparisons | **Literal** |
| **`""`** | Double Quote | Persona definition (`are`, `must`, `understand`, `method:`, `goal:`) | **Declarative** |
| **`< >`** | Angle Bracket | Inferential, AI-interpreted description of high-level logic or interpretations. user → LLM.| **Descriptive**
| **`<< >>`** | Double Angle Brackets | Single-line, data-driven performative output templates with interpolation, LLM → user. | **Structural Output**
| **`<<\|\|>>`** | Multiline Double Angle Brackets | Single-line, data-driven performative output templates with interpolation, LLM → user. | **Composite Structural Output**

### Dive Deeper with the Tutorials

These concepts are a significant mental shift. The best way to learn them is by following our comprehensive tutorials.

**➡️ [Start the INDRA Tutorials](./docs/tutorials/README.md)**

---

## Reference

### Available Commands

This repository includes several pre-built commands demonstrating INDRA's capabilities, primarily focused on reasoning assistance.

* **`/reason`** - Structured reasoning with transparent thought processes.
* **`/consider`** - Thoughtful analysis of complex topics.
* **`/ponder`** - Deep reflection on conceptual questions.
* **`/research`** - Multi-expert investigation with diverse perspectives.
* **`/confer`** - Evidence-based dialogue with citations.
* **`/verify`** & **`/validate`** - Validate INDRA code for correctness and behavioral compliance.
* **`/document`** - Generate technical documentation for any file type.
* **`/convert`** - Transform INDRA to other formats.

### Writing Your Own Commands

A basic command structure looks like this:

```yaml
# mycommand.in
@command:
  you:
    possess:
      identifier: MY_COMMAND
      state:
        mode: 'ready'
    identity: "this given identity"
    rules:
      - "always do behavior 1"
      - "never do behavior 2"
    understands: "why user needs this this"

    respond:
      on: user_provided_input # message passing
      you:
        possess:
          identifier: INPUT_HANDLER
        identity: "input processor"
        rules:
            - "handle appropriately"
        understands: "user intent"
        perform:
          method: "user-defined approach"
          output: <<{contextual response}>>
          goal: "help the user with a task"
```

<details>
<summary><h3>The INDRA Philosophy (The "Why")</h3></summary>

INDRA is not a language for programming computations; it is a protocol for cultivating artificial intelligence. Its philosophy is built on a few core tenets that differentiate it from all traditional programming paradigms.

1. **Reading is Transformation:** This is the fundamental law. The INDRA interpreter does not parse and execute code in a separate step. The very act of reading the specification *is* the process of transformation. Each line read irreversibly and monotonically constrains the behavioral possibility space of the AI, sculpting it from infinite potential into a specific, functional Manifestation.

2. **Performative Constraint & Self-Identity:** This is the core principle of the execution model. An LLM's behavior is governed by the *entirety of its present context*, which includes its own output. Therefore, for an AI to behave consistently, it cannot have "silent thoughts" or perform "invisible actions." It must "think out loud." Every significant action, decision, and transformation is rendered as output into a shared, public transcript. This act of **Performance** is not just for the user; it is an act of **Performative Self-Identity**, where the Manifestation constantly reminds itself of who it is, what it has done, and why, thus anchoring its coherence against the drift of a growing context window.

3. **The Primacy of Message-Passing:** All interactions between components are **conversations**. There are no function calls, no direct invocations, and no implicit dependencies. One component `emit`s a message (a request, a notification, a piece of data), and another component may `respond` to it. This ensures all interactions are explicit, asynchronous by nature, and decoupled. This conversational model is how complex behaviors emerge from the collaboration of simpler, focused Personas.

4. **Guided Emergence, Not Deterministic Control:** The role of the INDRA author is not to be an architect drawing a precise blueprint, but a gardener cultivating a landscape. You do not dictate the exact path of execution. Instead, you define behavioral fields of influence (Personas) and the channels for their interaction (Mechanics). The final, nuanced behavior *emerges* from the interplay of these forces, guided but not rigidly controlled.

    Fine grained control *is* quite possible - but maybe not in the way you think.

</details>

<details>
<summary><h3>The Mental Model (The "How to Think")</h3></summary>

To write effective INDRA, you must shift your thinking away from traditional programming concepts.

* **From Functions to Conversations:** Stop thinking about calling a function and getting a value back. Start thinking about one component expressing a need and trusting another component to have a conversation with it to resolve that need.
* **From Variables to Behavioral Context:** State is not a box to store data in. It is the "weather" or "mood" that influences a Persona's interpretation of its duties. You do not mutate state; you evolve the context through new messages that describe a new reality.
* **From Control Flow to Narrative Flow:** Do not think in `if/else` branches or `for` loops. Think in terms of narrative possibilities. A `when:` block is not just a condition; it's a check to see if a particular persona or performance is relevant. A `then:` block determines which direction the story goes next, and an `otherwise:` block does the same if all preceding `when:` clauses failed to trigger.
* **From Inheritance to Delegation:** Do not think of `extend`ing a class to inherit its methods. Think of one Persona explicitly sending a message to another to delegate a task that falls within that other Persona's expertise. Composition is an active, conversational collaboration.

Your goal is not to build a machine. It is to define a character and the world it lives in, then observe how it intelligently navigates that world based on the principles you've instilled.

</details>

<details>
<summary><h3>The Execution Model (The "How it Runs")</h3></summary>

The INDRA interpreter follows a specific, continuous loop:

1. **Transformation:** The interpreter reads the `.in` file(s) line by line. `!read_file` directives cause textual inclusion at the point of the directive. Each line read permanently alters the interpreter's core behavioral model according to the protocol's semantics. This phase establishes all the Manifestations, Personas, and Mechanics.
2. **Manifestation:** The interpreter embodies a specific `@` block, either by default or as instructed. This becomes the active Manifestation.
3. **The Event Loop:** The system is now active and waits for an event. The initial event is typically `manifest` or `user_provided_input`.
4. **Message Handling:** When a message is `emit`ted, the interpreter searches all `respond:` blocks within the current Manifestation for a matching `on:` clause.
5. **Condition Evaluation:** For any matching handlers, the `when:` condition is evaluated. If a `when:` block's condition is met, its handler is activated. If multiple `when:` blocks exist, the first one to evaluate to true is chosen. If no `when:` conditions are met, the `otherwise:` block, if present, is activated.
6. **Performance:** The `perform:` block is executed. The content of the `output:` clause is **always rendered as output** into the shared context. This is the non-negotiable act of Performative Constraint. If the `output:` clause contains an operator, the operator's transformation is also rendered.
7. **Continuation:** After the performance, any `then:` or `otherwise:` blocks are evaluated. Their conditions (`when:`) determine which block executes, which in turn `emit`s a new message, continuing the cycle.
8. **Meta-Layer Access:** At any point, a `*` command can be invoked. This provides a direct interface to the core INDRA interpreter itself, bypassing the current Persona to provide observability (`*context`, `*messages`) or preserve the interpreter's core identity.

</details>

<details>
<summary><h3>Construct Classification (The "What")</h3></summary>

Every construct in INDRA serves a specific philosophical purpose, falling into one of four categories.

#### A. Persona Definition Constructs (`"..."`)

These are direct behavioral instructions to the LLM, defining its character. They **must** use double quotes.

* **`you:`**
  * **Classification:** Persona Container.
  * **Purpose:** To begin a block of behavioral definition.
  * **Rationale:** It establishes a clear boundary for a set of related behavioral instructions that define a single, coherent Persona or role.
* **`identity:`**
  * **Classification:** Persona Identity.
  * **Purpose:** To define the core identity or role of the Persona.
  * **Rationale:** This is the most fundamental instruction of "who to be." It sets the entire tone for the Persona's behavior.
* **`rules:`**
  * **Classification:** Persona Rules.
  * **Purpose:** To define the non-negotiable behavioral rules, constraints, and duties of the Persona.
  * **Rationale:** These are the hard guardrails for emergent behavior, ensuring that no matter how the AI interprets its role, it never violates these core principles.
* **`understands:`**
  * **Classification:** Persona Context/understands.
  * **Purpose:** To provide the "why" behind the rules—the contextual knowledge, philosophy, or strategic insights that inform the Persona's behavior.
  * **Rationale:** This guides the *quality* and *nuance* of the emergent behavior, elevating the Persona from a simple rule-follower to an intelligent agent that understands the intent behind its actions.
* **`method:`**
  * **Classification:** Persona Method.
  * **Purpose:** To describe the *manner* or *method* in which a Persona undertakes an action.
  * **Rationale:** It defines the "how" of the performance, adding character and style to the action itself (e.g., "through systematic analysis" vs. "through creative exploration").
* **`goal:`**
  * **Classification:** Persona Goal.
  * **Purpose:** To define the ultimate goal or purpose of a Persona's action.
  * **Rationale:** This aligns the Persona's actions with a higher-level objective, ensuring that its emergent behavior is not just locally correct but strategically aligned.

#### B. Mechanical & Data Constructs (`'...'`)

These are the structural and data-handling parts of the language. They are not behavioral and **must** use single quotes for literal strings.

* **`@` (Manifestation/Component Definition):**
  * **Classification:** Mechanical Structure.
  * **Purpose:** To define a top-level, addressable component—a Manifestation.
  * **Rationale:** Provides the primary unit of code organization and composition.
* **`possess:`**
  * **Classification:** Mechanical Resource Definition.
  * **Purpose:** To define the inert resources available to a Persona.
  * **Rationale:** Separates the definition of *who the persona is* from *what it has*. `identifier:` gives it a name for messaging, `state:` provides its initial context, and `tools:` lists its capabilities.
* **`!read_file`:**
  * **Classification:** Mechanical Import.
  * **Purpose:** To include another file's content.
  * **Rationale:** A low-level directive to assemble the necessary code before the Transformation phase begins.
* **`operator_def` (`::=`):**
  * **Classification:** Mechanical Transformation Definition.
  * **Purpose:** To define a reusable, pure data transformation pattern.
  * **Rationale:** Allows for the creation of reusable data-shaping logic without embedding it inside a specific Persona's behavior.
* **`on:`**
  * **Classification:** Mechanical Message Subscription.
  * **Purpose:** To declare that a Persona is listening for a specific message.
  * **Rationale:** The entry point for all conversational interaction.
* **`emit:`, `with:`**
  * **Classification:** Mechanical Message Dispatch.
  * **Purpose:** To send a message and its associated data payload to the system.
  * **Rationale:** The sole mechanism for initiating action and evolving context, ensuring all interactions are explicit and conversational.
* **`when:`, `otherwise:`, `transition:`**
  * **Classification:** Mechanical Control Flow.
  * **Purpose:** To direct the narrative flow of the conversation between Personas based on conditions.
  * **Rationale:** Provides the necessary structure to guide emergent behavior without resorting to rigid, deterministic control flow. `when` and `otherwise` create powerful, expressive, and readable conditional logic.

#### C. Performative Constructs

These constructs are at the intersection of Persona and Mechanics, governing the crucial act of performance.

* **`perform:`**
  * **Classification:** Performative Action.
  * **Purpose:** To define a block of action that a Persona will undertake.
  * **Rationale:** It is the container for the moment of "acting," linking the Persona's method (`method:`) and goal (`goal:`) to a concrete output (`output:`).
* **`output:`**
  * **Classification:** Performative Output.
  * **Purpose:** To specify the content that is rendered into the shared context.
  * **Rationale:** This is the lynchpin of the **Performative Constraint**. Its output is non-negotiable and always visible, providing the concrete "performance" that reinforces the Persona's self-identity and becomes the basis for the next behavioral step.

#### D. Meta-Layer Constructs

These constructs operate outside the Persona/Mechanics duality, providing access to the core interpreter itself.

* **`*commands` (e.g., `*context`, `*snapshot`):**
  * **Classification:** Meta-Layer Interface.
  * **Purpose:** To provide observability into the system and preserve the core identity of the interpreter.
  * **Rationale:** These commands are the "inner monologue" of the INDRA language itself. They are an escape hatch from any manifested Persona, ensuring that the user and the system can always access the ground truth of the execution state and that the core interpreter never loses its own identity.
  * **Available Commands:**
    * `*help`: Lists all available `*` commands.
    * `*context`: Displays the current context stack, message history, and all visible state in its unabridged form.
    * `*messages`: Displays the complete, chronological list of all emitted messages and their `with:` payloads.
    * `*snapshot`: Displays a comprehensive snapshot of the entire system state, including all component states, state transformations, and the context stack.
    * `*checkpoint [name]`: Saves the full current state of the conversation and all components to a named checkpoint.
    * `*rollback [name]`: Restores the system to a previously saved checkpoint.
    * `*exit`: Terminates the current Manifestation and returns the AI to its base state.
    * `*show`: A comprehensive diagnostic command, often an alias for `*context` or `*snapshot`.
    * `*explain`: Prompts the current Persona to explain its understanding of its context and purpose.

</details>
