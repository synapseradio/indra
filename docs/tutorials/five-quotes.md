# The Five Quotes: A Deep Dive

## Why Five?

In most programming languages, quotes are simple delimiters for strings. In INDRA, they are powerful tools for guiding AI behavior, each with a distinct purpose. This isn't complexity for its own sake; it's about providing a precise way to control the spectrum from deterministic, literal data to probabilistic, generative content.

Mastering these five quote types is fundamental to writing effective INDRA code.

## The Spectrum of Intent

Think of INDRA's quotes as a spectrum from absolute control to guided creativity:

`'literal'` → `"persona"` → `<<template>>` → `<generated>` → `<<|canvas|>>`
**Control** → **Instruction** → **Structure** → **Interpretation** → **Composition**

Each quote type signals a different intent to the AI.

---

### 1. Single Quotes: `'Literal Data'`

**Purpose:** To define immutable, literal data. This is the anchor of certainty in your program.

```indra
state:
  mode: 'processing'
  status: 'active'
  
when: mode is 'processing' # Exact, case-sensitive string comparison
```

**Use single quotes when:**
- Defining exact state values (`'active'`, `'pending'`).
- Making literal comparisons in `guard` or `when` clauses.
- Specifying precise, non-negotiable identifiers or data payloads.
- Anywhere ambiguity would be dangerous or incorrect.

**Philosophy:** **Control.** This is you telling the AI, "This is a fact. Do not interpret it, do not change it. Hold it as-is."

---

### 2. Double Quotes: `"Persona Instruction"`

**Purpose:** To give direct, imperative instructions that define a persona's character, rules, or purpose.

```indra
are: "a thoughtful assistant who anticipates user needs"
must:
  - "always protect user privacy"
  - "explain complex topics in simple terms"
understand: "clarity builds trust"
```

**Use double quotes when:**
- Defining the `are:`, `must:`, and `understand:` blocks.
- Providing instructions within `through:` and `intention:` blocks.
- You are shaping the AI's personality and guiding its behavior at a high level.

**Philosophy:** **Instruction.** This is you telling the AI, "This is who you are and what you believe. Let these principles guide your emergent behavior."

---

### 3. Guillemets: `<<Structured Template>>`

**Purpose:** To create single-line strings that mix literal text with interpolated data. They are your workhorse for formatted, data-driven output.

```indra
as: <<Processing item ${count} of ${total}...>>
with:
  message: <<Status for ${user.name}: ${user.status}>>
```

**Use guillemets when:**
- You need to construct a string with known values from your state.
- You are creating formatted log messages, IDs, or simple data payloads.
- The structure is mostly fixed, with specific data points filled in.
- Supports both deterministic `${...}` and probabilistic `{...}` interpolation.

**Philosophy:** **Structure.** This is you telling the AI, "Follow this format, but fill in the blanks with this specific data."

---

### 4. Angle Brackets: `<Generated Content>`

**Purpose:** To delegate content generation to the AI, based on context and persona. This is where you embrace probabilistic behavior.

```indra
perform:
  through: "careful analysis of user sentiment"
  as: <{an empathetic response that acknowledges the user's feelings}>
  intention: "to make the user feel heard"
```

**Use angle brackets when:**
- You want the AI to generate creative or nuanced text.
- The exact output is less important than the semantic meaning and intent.
- You are defining the `as:` block for a `perform` action that requires interpretation.

**Philosophy:** **Interpretation.** This is you telling the AI, "You understand the context and my intent. You figure out the best way to say this."

---

### 5. Multiline Markers: `<<|...|>>` (The Canvas)

**Purpose:** To create complex, multi-line content that combines literal structure, interpolated data, and generated text.

```indra
perform:
  as: <<|
    System Status Report
    ====================
    Timestamp: ${timestamp}
    Mode: ${mode}

    Analysis:
    {a detailed, generated analysis of the current system state}

    Recommendations:
    {actionable suggestions based on the analysis}
  |>>
```

**Use multiline markers when:**
- You are generating reports, documents, or complex formatted outputs.
- You need to preserve whitespace and line breaks.
- You want to create a large "canvas" that mixes all other string types.
- Like guillemets, it supports both `${...}` and `{...}` interpolation.

**Philosophy:** **Composition.** This is you telling the AI, "Here is a large canvas. Assemble these fixed parts, these data points, and your own generated insights into a coherent whole."

## Summary: Choosing the Right Quote

| Quote | Type | Use Case | Philosophy |
| :--- | :--- | :--- | :--- |
| **`''`** | Single | Literal data, state values, comparisons | **Control** |
| **`""`** | Double | Persona definition (`are`, `must`, `understand`) | **Instruction** |
| **`<<>>`** | Guillemet | Single-line, data-driven templates | **Structure** |
| **`<>`** | Angle Bracket | Probabilistic, AI-generated content | **Interpretation** |
| **`<<| |>>`**| Multiline | Complex documents mixing all types | **Composition** |

Mastering the five quotes is the key to moving from simply writing code to skillfully guiding intelligent, emergent behavior.

---

*Next: [Guards and Conditional Behavior](./guards-and-conditions.md) - Learn to think in behavioral branches, not code paths.*