# The PRISM Library

**P**erformative **R**easoning **I**n **S**tructured **M**onologues

Welcome to the PRISM library. This directory contains the core building blocks for creating sophisticated reasoning actors in INDRA. These are not standalone programs, but reusable fragments of thought—operators, sequences, and personas—designed to be composed into "thinking partners."

The name "PRISM" is a metaphor: just as a prism refracts white light into its constituent colors, this library provides the components to deconstruct a complex thought process into its constituent fragments, making the entire reasoning process visible.

## Core Philosophy

The primitives in this library are **performative**. They are designed as fragments of an inner monologue, allowing an INDRA actor to "think out loud." This makes the reasoning process transparent, collaborative, and natural. This "dual-voice" pattern—combining a first-person, internal monologue with second-person, collaborative guidance—is the soul of the INDRA style.

## Library Architecture: A Bloom-Aligned Approach

The library's architecture is inspired by cognitive developmental principles like Bloom's Taxonomy. It is organized into five distinct layers of increasing cognitive complexity, providing a clear model for how to compose simple thought-fragments into sophisticated reasoning.

### Level 1: Foundational Knowledge (`base.in`, `thinking_primitives.in`)

This layer corresponds to **Remembering and Understanding**.
-   **`base.in`**: Provides universal utility operators (like `count()`) available to all other modules. It does not define any context schema.
-   **`thinking_primitives.in`**: The heart of the library. This file contains the most atomic "verbs" of thought, such as `wonder_about()` and `connect_dots()`.

### Level 2: Cognitive Techniques (`techniques/`)

This layer corresponds to **Applying**.
-   This directory contains pure, domain-agnostic cognitive methods that can be applied to any situation.
-   Examples: `analysis_five_whys.in`, `creativity_scamper.in`, `perspective_six_hats.in`.
-   A "technique" is a reusable, procedural tool for thought.

### Level 3: Analytical Fragments & Personas (`fragments/`, `personas/`)

This layer corresponds to **Analyzing**.
-   **`fragments/`**: Contains specialized, domain-aware analytical capabilities. A fragment *uses* techniques to explore a specific area of cognition (e.g., `critique.in` uses critical thinking techniques).
-   **`personas/`**: Contains the reusable "lenses" or "mindsets" that actors can adopt to perform their analysis. Every fragment should have a corresponding persona that embodies its collaborative, performative voice.

### Level 4: Composed Strategies (`strategies/`)

This layer corresponds to **Evaluating**.
-   This directory contains high-level, multi-step reasoning strategies composed from the lower-level fragments and techniques.
-   These are complex "recipes" for thought that can be dynamically loaded and executed by orchestrator actors like `@reason`.
-   Examples: `creative_exploration.in`, `strategic_prioritization.in`.

### Level 5: Reasoning Modules (`modules/`)

This layer corresponds to **Creating and Synthesizing**.
-   This directory houses the most complex, self-contained "reasoning engines." A module often orchestrates multiple fragments, techniques, and strategies to perform a sophisticated cognitive task from end to end.
-   Examples: `tree_of_thought.in`, `graph_of_thought.in`, `citation.in`.

By composing components from these five layers, you can design sophisticated and nuanced reasoning actors tailored to any domain, with a clear understanding of how each piece contributes to the overall cognitive process.
