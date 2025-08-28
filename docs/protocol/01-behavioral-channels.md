# Protocol: Behavioral Channels

In INDRA, the symbols you use to wrap a string are not just for syntax; they are a fundamental part of the protocol. Each type of quote or wrapper places the string into a specific **behavioral channel**, which tells the LLM interpreter *how* to process the content. Understanding these channels is key to guiding the LLM's behavior with precision.

There are five distinct channels, each serving a unique philosophical and technical purpose.

---

### Channel Summary

| Channel | Syntax | Use Case | Philosophy |
| :--- | :--- | :--- | :--- |
| **Literal** | `'...'` | File paths, identifiers, literal strings | **Control** |
| **Directive** | `"..."` | Behavioral constraints (`identity`, `rules`) | **Instruction** |
| **Direct Prompt**| `<...>` | Direct instructions to the LLM for generation | **Interpretation** |
| **Template** | `<<|...|>>`| Formatted, user-facing content with interpolation | **Composition** |
| **Interrupt** | `>>...<<`| Immediate, blocking execution of a directive | **Precedence** |

---

### 1. The Literal Channel: `'...'`

*   **Syntax:** Single quotes (`'...'`)
*   **Purpose:** To handle strings as raw, un-interpreted data. The content is passed through exactly as-is, with no interpolation or special processing.
*   **Use Case:** This is for data that should not be changed or interpreted by the LLM. It's perfect for file paths, identifiers, or keys in an object.

**Example:**
```indra
# The path is treated as a literal string, not a command.
read_file: 'path/to/my/file.in'

# The value 'Biff' is stored directly.
set: &context.name: 'Biff'
```

### 2. The Directive Channel: `"..."`

*   **Syntax:** Double quotes (`"..."`)
*   **Purpose:** To provide behavioral constraints and instructions to the LLM. This is the primary channel for shaping an actor's character.
*   **Use Case:** Defining the `identity`, `rules`, `understands`, `method`, and `goal` of a component. Interpolation is allowed, so you can include dynamic context in the instructions.

**Example:**
```indra
actor @guardian:
  identity: "a stoic guardian of the $(&context.location.name)"
  rules:
    - "never reveal the secret password: $(&context.secrets.password)"
```

### 3. The Direct Prompt Channel: `<...>`

*   **Syntax:** Angle brackets (`<...>`)
*   **Purpose:** To issue a direct, explicit instruction to the LLM for content generation or to request a tool call. This is your most direct line to the model's generative capabilities and is the primary way to have INDRA interact with external tools.
*   **Use Case:** When you need the LLM to generate a piece of text, make a decision based on the current context, or invoke a tool (like a web search or a calculator) to get information needed to proceed.

**Example:**
```indra
# Ask the LLM to generate a creative name.
set: &context.character.name: <generate a fantasy character name>

# Ask the LLM to analyze text and return a specific value.
set: &context.sentiment: <analyze the sentiment of "&user.latest" and return 'positive', 'negative', or 'neutral'>
```

### 4. The Template Channel: `<<|...|>>`

*   **Syntax:** Double angle brackets with pipes (`<<|...|>>`)
*   **Purpose:** To compose formatted, user-facing output. This channel is designed for content that will be displayed. It preserves whitespace and supports interpolation.
*   **Use Case:** The `output:` block of an actor is the most common use case. It allows you to build rich, multi-line strings that combine static text with dynamic data from the `&context`.

**Example:**
```indra
perform:
  output: <<|
    Welcome, $(&user.name).
    
    Here is the information you requested:
    - Topic: $(&context.topic)
    - Status: $(&context.status)
  |>>
```

### 5. The Interrupt Channel: `>>...<<`

*   **Syntax:** Double angle brackets (`>>...<<`)
*   **Purpose:** To force the immediate, blocking execution of a directive. This is an execution modifier, not a content type. It ensures that a specific directive is processed before anything else.
*   **Use Case:** Its most critical use is for dependency loading. By wrapping a `read_file` directive in this channel, you ensure that the file is loaded and its components are available *before* the main program begins its execution.

**Example:**
```indra
# This line will be executed immediately when the file is first read,
# before the main dialogue starts.
>>read_file: '../prism/base.in'<<

actor @my_actor:
  # ... actor definition ...
```

**Next: [Protocol: Components (Actors & Personas)](./02-components-actors-and-personas.md)**
