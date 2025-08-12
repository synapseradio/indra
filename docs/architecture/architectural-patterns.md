# INDRA Architectural Patterns

This document outlines a set of high-level, idiomatic design patterns for building robust, maintainable, and elegant INDRA programs. These patterns address common challenges in structuring complex AI behavior and should be considered after internalizing the core concepts from the tutorials.

---

### 1. The Stateful Analysis Sequence Pattern

**When to Use:** When an agent needs to perform a complex, multi-step analysis to decide its next action. This pattern is ideal for replacing complex, nested `when:` blocks that rely on parsing text output.

**How it Works:**
1.  Encapsulate the entire analysis process within a `sequence` operator.
2.  Within the sequence, dedicate steps to making specific determinations (e.g., checking for conflicts, assessing quality, scoring options).
3.  Each analytical step should explicitly save its conclusion as a clean, reliable data type (e.g., a boolean flag, a numerical score, a generated user prompt) into the global context using `set:`.
4.  The orchestrating agent's `then:` block becomes very simple. It doesn't perform the analysis itself; it just reads the pre-computed results from the context using simple `when:` conditions.

**Example:**
```indra
# The sequence does the heavy lifting and sets explicit state.
sequence epistemic_analysis(responses) ::=
  step:
    output: <<|*Checking for framework forks...*|>>
    set:
      &context.epistemic.fork_detected: $(<Analyze... Respond with 'true' or 'false'>)
  step:
    when: &context.epistemic.fork_detected is true
    output: <<|*Generating user prompt...*|>>
    set:
      &context.epistemic.user_prompt: $(<Formulate the clarification question...>)

# The agent's logic becomes clean and easy to read.
agent @epistemic_guardian:
  perform:
    sequence: epistemic_analysis(responses: ...)
  then:
    when: &context.epistemic.fork_detected is true
      say:
        to: &context.dialogue.caller
        what: { event: 'clarification_needed', payload: &context.epistemic.user_prompt }
    otherwise:
      say:
        to: @next_agent
        what: 'analysis_clear'
```

**Benefit:** This pattern decouples complex analysis from control flow, making the agent's logic more robust, readable, and easier to debug. It avoids the anti-pattern of parsing generative text to make decisions.

---

### 2. Agent Specialization & Separation of Concerns

**When to Use:** Always. This is a foundational principle for any non-trivial INDRA program.

**How it Works:**
1.  Design agents to have a single, clearly defined responsibility.
2.  If an agent starts doing two or more distinct things, refactor it into multiple, more focused agents.
3.  Complex behavior should emerge from the *conversation* between these simple, specialized agents, not from a single, monolithic agent trying to do everything.

**Example:**
-   **Bad (Monolithic):** An `@orchestrator` agent that manages expert turn-taking, also checks for epistemic conflicts, and also synthesizes the final result.
-   **Good (Specialized):**
    -   `@multi_perspective_agent`: Manages turn-taking only.
    -   `@epistemic_guardian`: Is responsible only for detecting conversational conflicts.
    -   `@synthesis_agent`: Is responsible only for integrating the final contributions.

**Benefit:** This leads to a system that is more modular, easier to understand, and far more maintainable. Each component is simple, and the complexity lives in their interactions.

---

### 3. The Orchestrator/Worker Pattern

**When to Use:** When implementing a complex, self-contained subsystem, such as a Tree of Thought or Graph of Thought reasoner.

**How it Works:**
1.  **The Orchestrator Agent:** Create a single agent (e.g., `@graph_reasoner`) that serves as the clean, public-facing entry point for the entire subsystem. Its `perform` block should be very simple.
2.  **The Worker Sequence:** The orchestrator agent's primary job is to execute a master `sequence` operator (e.g., `graph_of_thought`). This sequence contains all the detailed, step-by-step implementation logic for the subsystem.

**Example:**
```indra
# The main engine only needs to know about the orchestrator.
agent @master_orchestrator:
  perform:
    then:
      when: &context.reasoning.strategy is 'graph'
        say:
          to: @graph_reasoner # Simple, clean handoff
          what: 'begin_graph_analysis'

# The orchestrator hides the complexity.
agent @graph_reasoner:
  perform:
    sequence: graph_of_thought(query: &context.query) # Manages the complex worker sequence
    then:
      say:
        to: @synthesis_agent
        what: 'graph_reasoning_complete'

# The worker sequence contains the actual implementation.
sequence graph_of_thought(query) ::=
  step:
    # ... all the complex logic for GoT lives here ...
```

**Benefit:** This pattern hides the internal complexity of a subsystem from the main engine controller, leading to a cleaner high-level architecture.

---

### 4. Explicit State Over Inferred State

**When to Use:** This is a core principle that informs all other patterns.

**How it Works:**
1.  Always prefer to have a process that explicitly determines a condition and saves it to the context as a clean data type (boolean, number, string) using `set:`.
2.  Avoid control flow that relies on parsing the string output of a generative operation within a `when:` block.

**Example:**
-   **Anti-Pattern (Inferred State):** `when: <the response contains the word 'error'>`
-   **Good Pattern (Explicit State):**
    -   A prior sequence step determines if there was an error: `set: &context.process.has_error: true`
    -   The `when:` block then becomes a clean, reliable check: `when: &context.process.has_error is true`

**Benefit:** Explicit state is more reliable, more efficient, and makes the agent's decision-making process transparent and easier to debug.
