# On Sequences and Operators

In INDRA, the process of thinking is given form through composition. The two fundamental units of this composition are **Operators** and **Sequences**. Understanding their distinct roles is the key to designing clear and expressive thought processes.

An Operator is a single, focused cognitive act. A Sequence is a narrative of those acts, woven together into a coherent journey.

## Operators (`::=`): The Atomic Moves of Thought

An Operator is the smallest unit of cognitive work. It is a stateless, reusable transformation that captures a single, focused "move" of the mind.

**Key Qualities:**

*   **Atomic:** An Operator does one thing well.
*   **Stateless:** It holds no memory of past invocations.
*   **Transformational:** Its purpose is to take an input and return a new insight or expression.

### Example: The Act of Wondering

Here is the foundational Operator `wonder_about`. It captures the simple, creative act of finding an interesting angle on a topic.

```indra
# Takes a topic, returns a generative question or angle.
wonder_about(topic) ::= <<|
  $(<What interesting question or angle comes to mind about $(topic)?>)
|>>
```

This Operator can now be used by any Actor to initiate a line of thought, to perform the atomic act of wondering.

## Sequences (`sequence`): The Choreography of Inquiry

A Sequence is a stateful orchestration of multiple steps. It defines a process, a narrative of thinking where each step can build on the last. If Operators are the individual brushstrokes, Sequences are the composition of the painting.

**Key Qualities:**

*   **Stateful:** A Sequence can create and modify a local context (`set: &...`) that is **immediately available** to subsequent steps within that same Sequence.
*   **Procedural:** It executes a series of steps in a defined order.
*   **Orchestrational:** It manages a flow of logic, calling Operators and shaping the cognitive environment for the inquiry.

### Example: A Multi-Step Exploration

This Sequence defines a simple, three-step process for an initial exploration of an idea:

```indra
sequence explore_thoroughly(thought) ::=
  # Step 1: Use an operator to have an initial thought.
  step:
    set:
      &context.exploration.initial_wonder: $(wonder_about(topic: thought))
  
  # Step 2: Use another operator on the result of the first step.
  # The '&context.exploration.initial_wonder' variable is immediately available.
  step:
    set:
      &context.exploration.assumptions: $(identify_assumptions(understanding: &context.exploration.initial_wonder))
  
  # Step 3: Synthesize the results into a final output.
  step:
    output: <<|
      When wondering about "$(thought)", I found myself thinking:
      > "$(&context.exploration.initial_wonder)"
      
      The key assumption I'm making here is:
      > "$(&context.exploration.assumptions)"
    |>>
```

The flow of state is what gives a Sequence its narrative power. The `set:` command within a Sequence has *immediate effect* in its local scope, allowing `step 2` to build directly on the insight from `step 1`.

## The Pipe Operator (`|>`): A Fluent Composition

The pipe operator `|>` is a more fluid way to compose Operators. It allows for the creation of elegant, readable "thought pipelines," where the output of one Operator flows directly into the next.

### Example: From Nested Calls to a Clean Flow

A series of transformations could be written with nested Operator calls:

```indra
# Nested and harder to read
set:
  &context.analysis: $(summarize_insights(insights: identify_key_points(text: &user.latest)))
```

The pipe operator reframes this as a clear, linear journey:

```indra
# A clean, readable pipeline
set:
  &context.analysis: $(&user.latest |> identify_key_points |> summarize_insights)
```

This reads like a story: "Take the user's latest input, identify the key points, and then summarize the insights." It makes the cognitive process self-documenting.

## On Designing Your Own Primitives

The real expressive power of INDRA emerges when you define your own Operators and Sequences, capturing the unique cognitive moves of your own domain.

For example, a musician might define these primitives:

```indra
# An operator to find a complementary chord
find_harmony(chord) ::= <...>

# An operator to suggest a rhythmic variation
vary_rhythm(melody) ::= <...>

# A sequence that orchestrates a compositional step
sequence develop_motif(motif) ::=
  step:
    set:
      &rhythm_idea: $(vary_rhythm(melody: motif))
  step:
    set:
      &harmony_idea: $(find_harmony(chord: motif.root_note))
  step:
    output: "A possible development: $(&rhythm_idea) over $(&harmony_idea)"
```

You have now codified a piece of domain-specific intuition into a reusable, expressive thought process.

---
**Next:** [Building Conversational Assistants](./03-building-a-conversational-assistant.md)
