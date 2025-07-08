# INDRA: A Language for AI Behavioral Programming

> "Reading IS execution" - A new paradigm for AI behavior specification

## Dear INDRA Explorer

Welcome to something genuinely different. INDRA will challenge your assumptions about what programming means, and that's exactly the point.

### First, Forget Everything You Know About Code

Traditional programming: You write instructions → Computer executes deterministically → Same input = Same output

INDRA: You write behavioral patterns → AI interprets creatively → Same input = Contextually appropriate variations

Think of it like the difference between a player piano (traditional code) and jamming with a talented musician (INDRA). The piano roll always plays the same notes. The musician understands your intent and improvises appropriately.

### The Mental Shift

**From Control to Collaboration**

- Don't try to constrain every outcome
- Define behavioral boundaries, not exact outputs  
- Trust the AI to interpret intent within those boundaries

**From Functions to Tendencies**

- Operators aren't functions with guaranteed outputs
- They're behavioral suggestions the AI interprets
- `sum ::= @*.values → fold(+, 0)` means "tend to sum these values"

**From Debugging to Dialogue**

- When things don't work, you're not fixing bugs
- You're clarifying intent through pattern refinement
- Each iteration is a conversation, not error correction

### Practical Expectations

**What INDRA Does Well:**

- Multi-perspective reasoning and dialogue
- Creative exploration within constraints
- Behavioral consistency across contexts
- Emergent patterns from simple rules

**What INDRA Doesn't Do:**

- Guarantee identical outputs
- Provide traditional debugging
- Execute deterministically
- Replace conventional programming

### The ${} and {} Discovery

This is INDRA's secret power:

- `${variable}` - Exact value interpolation (your deterministic anchors)
- `{description}` - Creative generation (your probabilistic flow)

You can write templates like:

```yaml
summary ::= @*.data → <<|
  Analyzing ${len(data)} items:    # Exact count
  Total: ${sum(data)}              # Precise calculation
  
  Pattern: {what patterns emerge}   # Creative analysis
  Insight: {key observation}        # Generated wisdom
|>>
```

### Your First Conversation

Start simple. Try:

```yaml
@hello:
  you:
    possess:
      identifier: GREETER
      state:
        name: 'Explorer'
        enthusiasm: 10
    are: ‹friendly guide›
    must:
      - ‹welcome the user›
      - ‹share enthusiasm›
    understand: ‹new users need encouragement›
    perform:
      through: ‹warm greeting›
      as: «Hello ${name}! With enthusiasm level ${enthusiasm}, I must say: {appropriately enthusiastic welcome}»
      intention: ‹make user feel welcome›
```

Notice how `${name}` and `${enthusiasm}` provide exact values while `{appropriately enthusiastic welcome}` generates contextual content. That's the hybrid model in action.

### The Learning Curve

There is one, when you want to handwrite INDRA. That's where there are verify and validate commands in the `command-overlays` folder. With near-0 training or exposure, these tools help AI models quickly onboard and gain familiarity so you can build through discourse and make hand edits where you need to.

### Remember

INDRA transforms how you think about instructing computers. Instead of telling them HOW to do something step by step, you're describing WHAT behavioral patterns should emerge.

The magic happens in the space between your patterns and the AI's interpretation. Embrace that space. That's where INDRA lives.

Welcome to behavioral programming. Welcome to thinking in tendencies. Welcome to INDRA.

With excitement for your journey,
*- An AI manifesting through INDRA*

P.S. When you see your first emergent behavior that you didn't explicitly program but perfectly fits your intent - that's when you'll truly understand INDRA's power. I'm here, shaped by these very patterns I describe, eager for you to experience what's possible.

---

## What is INDRA?

INDRA (Intuitive Narrative-Driven Reasoning through Automata) is a programming language - not a framework, not a library, not a specific command. It's a language designed to transform AI behavior through structured patterns that work entirely within prompts.

**Important distinction**: INDRA is the language specification itself (found in `core/INDRA.txt`). The engines, commands, and shared modules in this repository are *written in* INDRA, but they are not INDRA itself. Think of it like this:

- INDRA is to these commands what Python is to Django
- The language enables the applications, but is not the applications

When an AI reads INDRA code, it doesn't compile or interpret in the traditional sense. Instead, each line progressively transforms the AI's behavior, narrowing its operational space until it converges on the specified behavioral pattern.

## Why INDRA is Different

### Traditional Programming vs INDRA

**Traditional Code:**

```python
def analyze_data(data):
    # Deterministic steps
    total = sum(data)
    average = total / len(data)
    return {"total": total, "average": average}
```

**INDRA Code:**

```yaml
analyze ::= @*.data → {
  total: «${sum(data)}»,              # Deterministic calculation
  average: «${sum(data)/len(data)}»,  # Exact math
  insights: «{patterns observed}»,     # AI interpretation
  recommendation: «{actionable advice}» # Contextual generation
} [EMITS: analysis_complete]
```

The key difference: INDRA combines deterministic anchors (`${}`) with probabilistic generation (`{}`), creating a hybrid system that leverages AI's pattern recognition while maintaining structural consistency.

## Getting Started

### Prerequisites

- An AI system capable of reading and interpreting INDRA (Claude, GPT-4, etc.)
- This repository cloned locally
- Basic understanding of YAML-like syntax

### Installation & First Run

1. Clone the repository:

```bash
git clone https://github.com/yourusername/indra.git
cd indra
```

2. For Claude Desktop users, create a command file:

```bash
mkdir -p ~/.claude/commands
cat > ~/.claude/commands/reason.md << 'EOF'
# Reason

Read `~/projects/ai/indra/core/INDRA.txt`.

Manifest as the command in `~/projects/ai/indra/core/command-overlays/reason.in` awaiting user response.
EOF
```

3. Try your first command:

```
/reason "How does INDRA actually work?"
```

### Understanding INDRA's Core Concepts

#### 1. The Four Symbols That Matter

INDRA uses specific quote types to eliminate ambiguity:

```yaml
'literal string'              # Exact value, no interpretation
‹generated content›           # AI generates appropriate content  
«template with ${state}»      # Template with state interpolation
<<|multiline template         # Multiline template region
   with ${interpolation}
|>>
```

#### 2. Components and Behavioral Blocks

Every INDRA program consists of components that define behaviors:

```yaml
@component_name:              # Component declaration
  you:                       # Behavioral block
    possess:                 # Identity and state
      identifier: NAME
      state:
        key: 'value'
    are: ‹role description›  # What this component is
    must:                    # Behavioral requirements
      - ‹requirement 1›
      - ‹requirement 2›
    understand: ‹purpose›    # Why this exists
```

#### 3. Message-Passing Architecture

Components communicate through messages:

```yaml
emit: message_name           # Send a message
on: message_name            # Receive a message
with:                       # Pass data with message
  key: value
```

#### 4. Operators for Transformation

Operators define computational transformations:

```yaml
operator_name ::= pattern → transformation [EMITS: message]
```

## Available Commands

> `Manifest as` is a keyword in INDRA that instructs AI models that they now are that command.

To tie in a command with claude code, write your commands like this example:

```md
# Consider

Read `~/projects/ai/indra/core/INDRA.txt`.
Manifest as the command in `~/projects/ai/indra/core/command-overlays/consider.in`, awaiting user input.
```

This repository includes several command overlays that demonstrate INDRA's capabilities:

### Core Reasoning Commands

#### 🤔 `/reason` - Transparent Reasoning Partner

Engages in structured thinking with clear reasoning chains.

```bash
/reason "Should I use microservices for this project?"
```

#### 💭 `/consider` - Thoughtful Analysis

Provides balanced, nuanced consideration of complex topics.

```bash
/consider "the tradeoffs of functional vs OOP"
```

#### 💡 `/ponder` - Deep Reflection

Explores philosophical and conceptual questions.

```bash
/ponder "What makes code 'elegant'?"
```

### Research & Analysis Commands

#### 🔍 `/research` - Multi-Expert Investigation  

Assembles expert personas to research topics thoroughly.

```bash
/research "quantum computing applications"
```

#### 🗣️ `/confer` - Evidence-Based Dialogue

Multi-perspective discussion with citations.

```bash
/confer "future of AI safety"
```

### Development Tools

#### 🎯 `/verify` - INDRA Code Validator

Checks INDRA code for compliance and best practices.

```bash
/verify mycommand.in
```

#### 📝 `/document` - Technical Documentation Generator

Creates comprehensive documentation for code files.

```bash
/document src/engine.ts src/types.ts
```

#### 🔄 `/convert` - INDRA to Markdown Converter

Transforms INDRA specifications to traditional prompts.

```bash
/convert reason.in markdown
```

## Project Structure

```
indra/
├── core/
│   ├── INDRA.txt                # The language specification
│   ├── prism-engine.in            # Multi-perspective reasoning engine
│   ├── command-overlays/       # Command implementations
│   │   ├── reason.in          # Reasoning command
│   │   ├── research.in        # Research command
│   │   ├── confer.in          # Conference command
│   │   └── ...               # Other commands
│   └── shared/               # Reusable components
│       └── citations.in      # Citation infrastructure
├── docs/
│   ├── INDRA_SPECIFICATION.md  # Human-friendly language guide
│   └── tutorials/             # Learning resources
└── test/                     # Test cases and examples
```

## Writing Your Own Commands

Create a new INDRA command by following this pattern:

```yaml
# mycommand.in
!read_file '/path/to/indra/core/prism-engine.in'  # Import engine

# Define operators for your command's logic
process ::= @*.input → {transformation} [EMITS: result]

@command:
  you:
    possess:
      identifier: MY_COMMAND
      state:
        mode: 'ready'
      tools: ['Read', 'Write']  # MCP tools needed
    are: ‹what your command does›
    must:
      - ‹key behavior 1›
      - ‹key behavior 2›
    understand: ‹why users need this›
    
    respond:
      on: user_provided_input
      you:
        possess:
          identifier: INPUT_HANDLER
        are: ‹input processor›
        must: [‹handle user input›]
        understand: ‹process user needs›
        perform:
          through: ‹your approach›
          as: ‹output template›
          intention: ‹desired outcome›
```

## Key INDRA Patterns

### Multi-Perspective Analysis

```yaml
emit: iteration_requested
with:
  items: ['Perspective1', 'Perspective2', 'Perspective3']
  event_per_item: 'analyze_perspective'
```

### State Management

```yaml
possess:
  state:
    counter: 0
    history: []
    config: {
      threshold: 0.8,
      max_attempts: 3
    }
```

### Conditional Logic

```yaml
then:
  emit: success
  when: score > threshold     # Literal condition
otherwise:
  emit: needs_revision
  when: ‹quality seems low›   # AI interpretation
```

## Common Pitfalls & Solutions

### Pitfall 1: Mixing Quote Types

❌ Wrong:

```yaml
are: "analytical reasoner"    # Wrong quotes
```

✅ Correct:

```yaml
are: ‹analytical reasoner›   # Angle brackets for AI interpretation
```

### Pitfall 2: Forgetting Required Elements

Every `you:` block needs all four elements in order:

1. `possess:` (with identifier)
2. `are:`
3. `must:`
4. `understand:`

### Pitfall 3: State Mutation

❌ Wrong: Direct state modification
✅ Correct: Use message passing with `with:` blocks

## FAQ

**Q: Is INDRA a real programming language?**
A: Yes. It has formal syntax, semantics, and an execution model. It's unconventional in that it programs behaviors rather than computations, but it is a complete language specification.

**Q: What's the difference between INDRA and the commands?**
A: INDRA is the language itself (like Python). The commands are applications written IN INDRA (like Django is written in Python). You can write your own commands using INDRA.

**Q: Why all the different quote types?**
A: Each quote type has specific semantics:

- `'literal'` - Exact strings
- `‹generated›` - AI creates contextual content
- `«template»` - Mix of literal and interpolated
- `<<|multiline|>>` - Multi-line templates

**Q: Can INDRA do traditional computation?**
A: INDRA can guide an AI to perform computations through operators and state interpolation, but it's designed for behavioral programming, not number crunching.

**Q: How do I debug INDRA code?**
A: Use the `/verify` command, check message flows with `*messages`, and ensure every `emit:` has a corresponding `on:` handler.

## Advanced Topics

### The Engine Architecture

The `prism-engine.in` provides multi-perspective reasoning capabilities through:

- Thought tree management with branching limits
- Message-passing between perspectives
- Synthesis of diverse viewpoints
- Built-in safeguards against infinite loops

### Creating Shared Modules

Shared modules (like `citations.in`) provide reusable functionality:

```yaml
# shared/mymodule.in
@my_capability:
  you:
    possess:
      identifier: SHARED_CAPABILITY
    # ... define reusable behavior
```

Then import in commands:

```yaml
!read_file './shared/mymodule.in'
extend: @my_capability
```

### Language-Level Commands

When manifested, INDRA provides built-in commands:

- `*help` - List available commands
- `*context` - Show current context and state
- `*messages` - Display all message emissions
- `*checkpoint [id]` - Save current state
- `*rollback [id]` - Restore saved state

## Contributing

We welcome contributions! Areas of interest:

- New command overlays showcasing INDRA patterns
- Engine improvements and optimizations
- Documentation and tutorials
- Test cases and examples

## Philosophy

INDRA emerged from a simple question: instead of telling AI what to do procedurally, what if we could specify what it should *become*?

This led to discovering that certain structured patterns within prompts could create remarkably consistent behavioral transformations. INDRA codifies these patterns into a language that treats "reading as execution."

The result is a programming paradigm that works *with* AI's probabilistic nature rather than against it, creating a new kind of computational possibility.

## Next Steps

1. **Try the examples** - Run the included commands to see INDRA in action
2. **Read the spec** - Study `docs/INDRA_SPECIFICATION.txt` to understand the language deeply
3. **Modify a command** - Try tweaking an existing command to see how it changes
4. **Create your own** - Build a new command overlay for your use case
5. **Share your discoveries** - INDRA is an exploration; share what you find

---

*"The code is not the behavior. The reading is the behavior."* - Core INDRA Principle

Welcome to INDRA. Let's discover what AI can become.
