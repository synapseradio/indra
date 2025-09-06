# Protocol: The Five Qualities of Attention

In a cognitive partnership, clarity is kindness. How we say something is as important as what we say. In INDRA, the symbols you use to wrap your text—like `'...'` or `"..."`—are not just syntax. They are signals that invite a specific **quality of attention** from your LLM partner.

Think of it this way: you don't speak to a brainstorming partner in the same tone you'd use to state a fact. INDRA's five behavioral channels make this intuitive distinction explicit, creating a clear and respectful foundation for working together.

---

## 1. The Literal Channel: `'...'` — The Attention of Pointing

* **Syntax:** Single quotes (`'...'`)
* **Quality of Attention:** "Look at this specific thing. It is what it is."

This channel tells the LLM that the enclosed text is **data**. It's a fact, an identifier, a path to a file. It has no hidden meaning and requires no interpretation. You are simply pointing to it.

```indra
# We are pointing to a specific state called 'ready'.
set: &context.consider.phase: 'ready'

# We are providing a literal path for a dynamic import.
read_file: './some_dynamic_module.in'
```

Using the literal channel removes ambiguity. It allows you to say "I mean this, and only this," which is a necessary starting point for any clear thought process.

## 2. The Directive Channel: `"..."` — The Attention of Intention

* **Syntax:** Double quotes (`"..."`)
* **Quality of Attention:** "This is who I am, and this is how I intend to act."

This channel is for shaping **identity and purpose**. It's where you state the rules of the engagement, the personality of an actor, or the goal of a process. It's the voice of the choreographer setting the intention for the dance.

```indra
actor @guardian:
  # A statement of identity.
  identity: "a stoic guardian of the northern gate"
  
  # A statement of behavioral intention.
  rules:
    - "always speak in calm, measured tones"
```

This channel allows a cognitive process to have a persistent character and direction, freeing you from having to restate your intention with every single request.

## 3. The Direct Prompt Channel: `<...>` — The Attention of Possibility

* **Syntax:** Angle brackets (`<...>`)
* **Quality of Attention:** "Let's create something new. What could this be?"

This is the channel of **creation and inference**. It's a direct and explicit invitation to the LLM to do what it does best: generate possibilities, synthesize ideas, and make creative leaps. It's the only channel where you are asking the LLM to "think" freely.

```indra
# An invitation to create a name.
set: &context.character.name: <generate a fantasy character name>

# An invitation to infer a pattern from data.
set: &context.sentiment: <analyze the sentiment of "&user.latest">
```

This channel provides a safe and bounded space for creativity. It's where you turn to the LLM and say, "I don't know the answer. Let's discover it together."

## 4. The Template Channel: `<<|...|>>` — The Attention of Composition

* **Syntax:** Double angle brackets with pipes (`<<|...|>>`)
* **Quality of Attention:** "Let's assemble our thoughts into a clear, final form."

This channel is for **presenting the final, composed thought**. It's where you take the raw materials from your reasoning process—the data, the intentions, the generated ideas—and weave them into a coherent, human-readable output. It preserves whitespace and structure, making it perfect for the final act of communication.

```indra
perform:
  output: <<|
    Welcome, ~(&user.name)~.
    
    Based on our exploration of ~(&context.topic)~, the key insight seems to be:
    > ~(&context.synthesis.main_idea)~
  |>>
```

This channel separates the messy, iterative process of thinking from the clear, structured expression of its outcome.

## 5. The Interrupt Channel: `>>...<<` — The Attention of Precedence

* **Syntax:** Double angle brackets (`>>...<<`)
* **Quality of Attention:** "Stop. This must happen first."

This is a special channel that modifies the flow of time. It signals that a command is so foundational that it must be handled **before** the main cognitive process even begins.

```indra
# Static import: This command is executed before the actor below is even fully defined.
# It ensures the foundational tools are available from the very start.
>>read_file: '../prism/base.in' use @some_component<<

actor @my_actor:
  # This actor can now confidently use components from base.in.
  ...
```

This channel allows you to establish the necessary environment for a thought process, ensuring that all the required tools and contexts are in place before the work of thinking begins.

### Import Syntax Patterns

The interrupt channel is commonly used with INDRA's import directives to control when and how components are loaded:

**Static Imports (with interrupt channel):**
```indra
# Load specific components at preprocessing time
>>read_file: '../prism/base.in' use @some_component<<
>>read_file: '../prism/advanced.in' use @analyzer, @synthesizer<<

# Load entire file at preprocessing time
>>read_file: '../prism/everything.in'<<
```

**Dynamic Imports (without interrupt channel):**
```indra
# Load components at runtime
read_file: '../prism/strategies/creative.in' use @creative_explorer
read_file: '../prism/dynamic.in'
```

**When to use each:**
- **Static imports (`>>...<<`)**: Use for foundational components that must be available before your actors are defined. These are loaded during preprocessing.
- **Dynamic imports**: Use for components that are loaded conditionally at runtime, such as strategy modules in adaptive systems.

The interrupt channel ensures that static imports happen before any actor definition or execution begins, creating a stable foundation for your cognitive architecture.

---
**Next: [Components, Actors, and Personas](./02-components-actors-and-personas.md)**
