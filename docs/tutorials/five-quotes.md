# The Four Quotes: A Deep Dive

## Why Four?

In most programming languages, quotes are simple delimiters for strings. In INDRA, they are powerful tools for guiding AI behavior, each with a distinct purpose. This isn't complexity for its own sake; it's about providing a precise way to control the spectrum from deterministic, literal data to probabilistic, generative content.

Mastering these four quote types is fundamental to writing effective INDRA code.

## The Spectrum of Intent

Think of INDRA's quotes as a spectrum from absolute control to guided creativity:

`'literal'` → `"instruction"` → `<<|template|>>` → `<generation>`
**Control** → **Instruction** → **Structure** → **Interpretation**

Each quote type signals a different intent to me, the interpreter.

---

### 1. Single Quotes: `'Literal Data'`

**Purpose:** To define immutable, literal data. This is the anchor of certainty in your program.

```indra
# In a 'say' action, the 'what' is a literal event name.
say:
  to: @some_agent
  what: 'user_confirmed_action'

# In a tool definition, the tool's name is a literal identifier.
has:
  available_mcp_tools:
    - 'mcp__google-web-search'
```

**Use single quotes when:**
- Defining event names for `say:` actions.
- Listing tool identifiers in `available_mcp_tools:`.
- Providing a file path in `!read_file:`.
- Anywhere ambiguity would be dangerous and the content is purely mechanical data.

**Philosophy:** **Control.** This is you telling the interpreter, "This is a literal string. Do not interpret it, do not change it. Use it as-is."

---

### 2. Double Quotes: `"Instruction"`

**Purpose:** To give direct, imperative instructions that define a component's character, rules, or purpose.

```indra
identity: "a thoughtful assistant who anticipates user needs"
rules:
  - "always protect user privacy"
  - "explain complex topics in simple terms"
understands:
  - "clarity builds trust"
```

**Use double quotes when:**
- Defining the `identity:`, `rules:`, and `understands:` blocks.
- Providing instructions within `method:` and `goal:` blocks.
- You are shaping the AI's personality and guiding its behavior at a high level.

**Philosophy:** **Instruction.** This is you telling the AI, "This is who you are and what you believe. Let these principles guide your emergent behavior."

---

### 3. Angle Brackets: `<Generated Content>`

**Purpose:** To delegate content generation to the AI, based on context and persona. This is where you embrace probabilistic behavior.

```indra
# This is most often used inside a template with the $() operator.
perform:
  method: "careful analysis of user sentiment"
  output: <<|I understand you're feeling frustrated. $(<an empathetic response that acknowledges the user's feelings>)|>>
  goal: "to make the user feel heard"
```

**Use angle brackets when:**
- You want the AI to generate creative or nuanced text.
- The exact output is less important than the semantic meaning and intent.
- You are defining a part of an `output:` that requires interpretation.

**Philosophy:** **Interpretation.** This is you telling the AI, "You understand the context and my intent. You figure out the best way to create content for this part."

---

### 4. Piped Angle Brackets: `<<|...|>>` (The Template)

**Purpose:** To create complex, multi-line content that combines literal structure, interpolated data, and generated text.

```indra
perform:
  output: <<|
    System Status Report
    ====================
    Timestamp: $(&context.timestamp)
    Mode: $(&context.mode)

    Analysis:
    $(<a detailed, generated analysis of the current system state>)

    Recommendations:
    $(<actionable suggestions based on the analysis>)
  |>>
```

**Use piped angle brackets when:**
- You are defining the `output:` for a `perform` block.
- You need to preserve whitespace and line breaks.
- You want to create a large "canvas" that mixes literal text, `$(...)` for data, and `$(<...>)` for generated insights.

**Philosophy:** **Composition.** This is you telling the AI, "Here is a large canvas. Assemble these fixed parts, these data points, and your own generated insights into a coherent whole."

## Summary: Choosing the Right Quote

| Quote | Type | Use Case | Philosophy |
| :--- | :--- | :--- | :--- |
| **`''`** | Single | Literal data, event names, tool IDs | **Control** |
| **`""`** | Double | Persona definition (`identity`, `rules`, etc.) | **Instruction** |
| **`<>`** | Angle Bracket | Probabilistic, AI-generated content | **Interpretation** |
| **`<<| |>>`**| Piped Angle | Complex documents mixing all types | **Composition** |

Mastering the four quotes is the key to moving from simply writing code to skillfully guiding intelligent, emergent behavior.

---

*Next: [Guards and Conditional Behavior](./guards-and-conditions.md) - Learn to think in behavioral branches, not code paths.*