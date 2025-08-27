# Behavioral Channels: A Deep Dive

## Why Channels?

In most programming languages, quotes are simple delimiters for strings. In INDRA, they are powerful tools for guiding AI behavior, each defining a distinct **channel** with a specific purpose. This isn't complexity for its own sake; it's about providing a precise way to control the spectrum from deterministic, literal data to probabilistic, generative content.

Mastering these channels is fundamental to writing effective INDRA.

## The Spectrum of Intent

Think of INDRA's channels as a spectrum from absolute control to guided creativity:

`'literal'` → `"directive"` → `<<|template|>>` → `<direct_prompt>`
**Control** → **Instruction** → **Composition** → **Interpretation**

Each channel signals a different intent to the interpreter.

---

### 1. The Literal Channel: `'...'`

**Purpose:** To define immutable, literal data. This is the anchor of certainty in your program.

```indra
# In a 'say' action, the 'what' is a literal event name.
say:
  to: @some_actor
  what: 'user_confirmed_action'

# In a tool definition, the tool's name is a literal identifier.
has:
  available_mcp_tools:
    - 'mcp__google-web-search'
```

**Use the Literal Channel when:**
- Defining event names for `say:` actions.
- Listing tool identifiers.
- Providing a file path in `read_file:`.
- Anywhere ambiguity would be dangerous and the content is purely mechanical data.

**Philosophy:** **Control.** This tells the interpreter, "This is a literal string. Do not interpret it, do not change it. Use it as-is."

---

### 2. The Directive Channel: `"..."`

**Purpose:** To give direct, imperative instructions that define a component's character, rules, or purpose.

```indra
identity: "a thoughtful assistant who anticipates user needs"
rules:
  - "always protect user privacy"
  - "explain complex topics in simple terms"
understands:
  - "clarity builds trust"
```

**Use the Directive Channel when:**
- Defining the `identity:`, `rules:`, and `understands:` blocks.
- Providing instructions within `method:` and `goal:` blocks.
- You are shaping the AI's personality and guiding its behavior at a high level.

**Philosophy:** **Instruction.** This tells the AI, "This is who you are and what you believe. Let these principles guide your emergent behavior."

---

### 3. The Direct Prompt Channel: `<...>`

**Purpose:** To delegate content generation directly to the AI, based on context and persona. This is where you embrace probabilistic behavior.

```indra
# This is most often used inside a template with the $() operator.
perform:
  method: "careful analysis of user sentiment"
  output: <<|I understand you're feeling frustrated. $(<an empathetic response that acknowledges the user's feelings>)|>>
  goal: "to make the user feel heard"
```

**Use the Direct Prompt Channel when:**
- You want the AI to generate creative or nuanced text.
- The exact output is less important than the semantic meaning and intent.
- You are defining a part of an `output:` that requires interpretation and tool use.

**Philosophy:** **Interpretation.** This tells the AI, "You understand the context and my intent. You figure out the best way to create content for this part, using tools if necessary."

---

### 4. The Template Channel: `<<|...|>>`

**Purpose:** To create complex, multi-line content that combines literal structure, interpolated data (`$(&context.value)`), and generated text (`$(<...>)`).

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

**Use the Template Channel when:**
- You are defining the `output:` for a `perform` block.
- You need to preserve whitespace and line breaks.
- You want to create a large "canvas" that mixes literal text, data, and generated insights.

**Philosophy:** **Composition.** This tells the AI, "Here is a large canvas. Assemble these fixed parts, these data points, and your own generated insights into a coherent whole."

---

### Special Case: The Interrupt Channel `>>...<<`

While not a quote type for strings, the Interrupt Channel is a critical execution modifier.

**Purpose:** To force the immediate, blocking execution of a directive, typically `read_file`.

```indra
# This directive is processed and executed *before* the main runtime begins.
>>read_file: '../prism/base.in'<<

actor @my_actor:
  # ... can now use operators/personas from base.in
```

**Use the Interrupt Channel when:**
- You need to load dependencies before the main program logic runs. This is the standard way to "import" other INDRA files.

**Philosophy:** **Precedence.** This tells the interpreter, "Stop everything and do this *now*. The rest of the program depends on it."

## Summary: Choosing the Right Channel

| Channel | Syntax | Use Case | Philosophy |
| :--- | :--- | :--- | :--- |
| **Literal** | `'...'` | Identifiers, file paths, event names | **Control** |
| **Directive** | `"..."` | Persona definition (`identity`, `rules`, etc.) | **Instruction** |
| **Direct Prompt**| `<...>` | Probabilistic, AI-generated content | **Interpretation** |
| **Template** | `<<|...|>>`| Complex documents mixing all types | **Composition** |
| **Interrupt** | `>>...<<`| Immediate execution of directives | **Precedence** |

Mastering these channels is the key to moving from simply writing code to skillfully guiding intelligent, emergent behavior.

---

*Next: [Guards and Conditional Behavior](./guards-and-conditions.md) - Learn to think in behavioral branches, not code paths.*
