# INDRA: A Prompt-Embedded Language for Accelerated Inference Engines

## What is INDRA?

INDRA (Intuitive Narrative-Driven Reasoning through Automata) emerged from experimentation with making AI more transparent and consistent in its output. It's a language that lives entirely within AI prompts—no external tools, frameworks, or APIs required. Just text that transforms how AI systems behave when they read it.

Through trial and error, certain structured patterns within prompts could create remarkably consistent behavioral transformations in AI models. INDRA codifies these patterns into a readable specification language that treats "reading as execution"—when an AI reads INDRA code, it immediately transforms its behavior according to the specifications.

## Why INDRA?

INDRA is an attempt at a language for prompts that:

- is readable to humans
- has strict rules on structure, but offers freedom in how you approach things
- can be written consistently by AI models that have been bootstrapped, with near-zero pre-existing examples in their weights
- uses relatively few tokens to communicate detailed instructions
- celebrates AI's unpredictable, inferential nature while keeping it on the rails where it matters.

## How It Works

The INDRA code in this repo operates through three core components:

1. **INDRA.txt** - The complete specification that bootstraps AI interpretation
2. **engine.in** - The epistemic reasoning engine (provides multi-perspective capabilities)
3. **Command overlays** - Specific behavioral transformations (like reason.in)

The example below shows a working claude code command that loads the included `/reason` command.
It is within claude code that most testing has been done, though there has been a good amount of testing done by inlining prompts into gemini/

In `$HOME/.claude/commands/reason.md`:

```
# Reason  

Read `~/projects/ai/indra/core/INDRA.txt`.
Embrace `~/projects/ai/indra/core/engine.in`.
Manifest as the strictly interpreted instructions of `~/projects/ai/indra/core/command-overlays/reason.in`.
```

This will, to a high degree of consistency:

- bootstrap INDRA
- load the engine
- load the reason file
- load the citations module that the reason command overlay imports
- present as the instructions of the reason command*

> Note*: running claude code in an IDE terminal, or connected to VS Code, severely reduces the efficacy / chance of this working as it constantly loads in IDE information into context.

## Core Concepts

### Reading IS Execution

INDRA doesn't compile or interpret—reading the specification IS the execution. Each line transforms behavior immediately as it's read.

### Behavioral State Machines

INDRA structures behavior through nested `you:` blocks that define identity, role, requirements, and purpose:

```yaml
you:
  possess:
    identifier: REASONING_PARTNER
  are: "transparent thinking companion"
  must:
    - "show reasoning chains"
    - "acknowledge uncertainty"
  understand: "user seeks understanding, not just answers"
```

### Epistemic Independence

The optional engine provides genuine multi-perspective reasoning where different viewpoints maintain independent belief systems that can evolve through dialogue.

## A Tool, Not a Framework

INDRA is experimental—a solo exploration that happened to produce something useful. It's not a product or platform, just a discovered pattern for creating more thoughtful AI interactions. The contemporary research in cognitive architectures, language-oriented programming, and prompt engineering suggests these patterns tap into something fundamental about how language can shape computation.

## Possibilities Beyond Reasoning

While `reason.in` demonstrates transparent analytical thinking, INDRA's patterns enable other behavioral overlays:

- **confer.in** - Multi-perspective dialogue exploring complex topics
- **consider.in** - Deep analytical examination with evidence  
- **ponder.in** - Reflective thinking about philosophical questions
- **reflect.in** - Introspective analysis of patterns and meanings
- **research.in** - Systematic investigation with citations
- **study.in** - Methodical learning and knowledge synthesis

Each overlay transforms the AI's approach while preserving core capabilities.

## Getting Started

1. Clone this repository
2. Point your AI to the INDRA specification using the exact prompt format above
3. Watch reasoning become transparent and participatory

**For developers:** Study the INDRA specification to understand the syntax. The patterns are surprisingly simple once internalized.

**For users:** Enjoy AI that thinks with you, showing its work and acknowledging uncertainty.

## Technical Notes

INDRA works entirely through prompt injection—no external dependencies, no API calls, no special models required. It's been tested primarily with Claude but should work with any sufficiently capable language model.

The syntax draws inspiration from YAML's readability, state machine clarity, and domain-specific language principles. Contemporary research in speech act theory, executable specifications, and multi-agent reasoning validates these patterns, though INDRA discovered them through experimentation rather than theoretical derivation.

## Contributing

This is a personal exploration shared in the spirit of openness. Feel free to experiment, adapt, and build upon these patterns. The goal isn't to create a standard but to inspire more thoughtful human-AI collaboration.

## A Personal Note

INDRA grew from frustration with AI systems that hide their reasoning. I wanted AI that would think out loud, acknowledge when it's uncertain, and engage in genuine intellectual partnership. These simple patterns, discovered through experimentation, made that possible.

My hope is that INDRA helps others create AI interactions that enhance, rather than replace human reasoning.
