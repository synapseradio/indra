# Protocol: Complete Grammar Reference

This document provides a human-readable reference for the INDRA v3.0 grammar. It is a companion to the formal `indra-protocol.yaml` specification, organized by concept for easier understanding.

---

### **1. Top-Level Definitions**

These are the main constructs that structure an INDRA file.

* **`actor @name: ...`**
  * **Purpose:** Defines an active, addressable component that can perform actions.
  * **Contains:** `identity`, `rules`, `understands`, `perform`, and optional `has` and `interface` blocks.

* **`persona @name: ...`**
  * **Purpose:** Defines an inert, reusable set of behavioral traits (a "role").
  * **Contains:** `identity`, `rules`, `understands`, and an optional `has` block. Cannot have a `perform` block.

* **`dialogue name: ...`**
  * **Purpose:** Defines an entry point or a complete conversational flow.
  * **Contains:** `start:` (a component reference) and an optional `with:` (an object to initialize `&context`).

* **`operator_def ::= ...`**
  * **Purpose:** Defines a reusable transformation or sequence of actions.
  * **Syntax:** `name(param1, param2) ::= ...` or `sequence name(...) ::= ...`

---

### **2. Component Structure**

These are the blocks that define the behavior and characteristics of Actors and Personas.

* **`identity: "..."`**: The core self-concept of the component.
* **`rules: ["..."]`**: A list of non-negotiable behavioral constraints.
* **`understands: ["..."]`**: Contextual knowledge that informs the "why" behind the rules.
* **`has: { ... }`**: Declares resources the component can use, like `available_mcp_tools`.
* **`interface: { ... }`**: Declares actor-specific star commands (`*command`).
* **`perform: { ... }`**: The main execution block for an actor, defining what it does on its turn.
* **`method: "..."`**: Inside `perform`, describes *how* the task is done.
* **`goal: "..."`**: Inside `perform`, describes *what* the task aims to achieve.
* **`output: <<|...|>>`**: The user-facing content rendered during a turn.
* **`then: { ... }`**: The decision logic block that executes after `output`. It must contain a terminating action.

---

### **3. Actions & Directives**

These are the executable statements that perform operations.

* **`set: &context.path: value`**: Stages a modification to the context for the *next* turn.
* **`await: @component`**: Pauses the current actor and delegates control to another component, waiting for a `return:`.
* **`say: to: @component what: '...'`**: Terminates the current turn and passes control to another actor.
* **`return: value`**: Ends an awaited component's turn and returns a value to the caller.
* **`read_file: '...'`**: Loads an external `.in` file. When wrapped in `>>...<<`, it's executed before runtime.
* **`as: @persona`**: A directive used within a sequence for an actor to temporarily adopt the traits of a persona.
* **`become: @persona with: {...} perform: {...}`**: Creates and executes a temporary, single-turn actor from a persona.

---

### **4. Control Flow**

These constructs direct the flow of execution within a `then:` block or sequence.

* **`when: condition { ... }`**: Executes the block if the `condition` is true.
* **`otherwise: { ... }`**: The fallback block if no preceding `when:` condition was true.
* **`each: collection as |item, index| { ... }`**: Iterates over an array or object.
* **`until: condition { ... }`**: A loop that continues as long as `condition` is true. Can be suspended across turns if it contains a `say:` action.
* **`max_iterations: number`**: A safeguard used inside an `until` loop to prevent infinite execution.

---

### **5. Values & Types**

INDRA supports standard primitive types and special reference types.

* **Strings:**
  * `'literal string'`: A raw string, no interpolation.
  * `"directive string"`: An instruction, allows interpolation.
  * `<direct prompt>`: A command for the LLM to generate content.
  * `<<|template string|>>`: User-facing output, allows interpolation and preserves whitespace.
* **`number`**: e.g., `123`, `45.6`.
* **`boolean`**: `true` or `false`.
* **`array`**: `[value1, value2, ...]`.
* **`object`**: `{ key1: value1, key2: value2, ... }`.
* **References:**
  * `@component_ref`: A reference to an actor or persona.
  * `&state_ref`: A reference to a value in a state namespace (e.g., `&context.user.name`).

---

### **6. Expressions & Operators**

These are used for evaluation and data transformation.

* **Interpolation: `$(...)`**
  * Evaluates the expression inside the parentheses and inserts the result into a string.

* **Conditional (Ternary) Expression: `condition ? value_if_true : value_if_false`**
  * A compact `if/else` for value selection.

* **Comparison Operators:**
  * `is`, `not`, `greater_than`, `less_than`, `greater_than_or_eq`, `less_than_or_eq`.

* **Existence Check: `exists(&context.path)`**
  * Returns `true` if the state variable is defined.

* **Pipeline Operator: `|>`**
  * Chains transformations or components together, passing the output of one as the input to the next.
  * Example: `&user.latest |> clean_text |> analyze_sentiment`

**Previous: [Protocol: State and Context](./04-state-and-context.md)**
