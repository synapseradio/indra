# The PRISM Library

**P**rimitives for **R**easoning, **I**nsight, and **S**tructured **M**eaning
**P**erformative **R**easoning **I**n **S**tructured **M**onologues
**P**atterns for **R**eusable **I**nsight & **S**emantic **M**odeling
**P**rimitive **R**efractions of **I**ntrospective **S**equences & **M**eaning

Welcome to the PRISM library. This directory contains the core building blocks of commands written in INDRA within this repository. These are not standalone programs, but reusable fragments of thought—operators, sequences, and personas—designed to be composed into sophisticated reasoning actors.

The name "PRISM" is a metaphor: just as a prism refracts white light into its constituent colors, this library provides the components to deconstruct a complex question or thought process into its constituent fragments and reflections, making the entire reasoning process visible.

## Core Philosophy

The primitives in this library follow a key principle: they are **performative, not just functional**. They are designed as fragments of an inner monologue, allowing an INDRA actor to "think out loud" by performing them. This makes the reasoning process transparent, natural, and observable.

## Library Structure

The library is organized by theme, with each file representing a different facet of the cognitive process.

### Foundational Modules

- **`base.in`**: The absolute foundation. It defines the global `&context` schema that all other modules share, providing a common workspace for reasoning. It also includes universal utility operators like `count()` and `get_at_index()`.
- **`thinking_primitives.in`**: The heart of the library. This file contains the most atomic "verbs" of thought, such as `wonder_about()`, `connect_dots()`, and `check_assumptions()`. It also defines a set of core personas (`@curious_explorer`, `@devil_advocate`) that embody different natural thinking styles.

### Reasoning Strategies & Structures

- **`tree_of_thought.in`**: Provides components for structured, hierarchical reasoning. This is best for problems that can be systematically decomposed into smaller, nested parts. It excels at methodical exploration.
- **`graph_of_thought.in`**: Implements a more non-linear, associative reasoning process. It's designed for discovering emergent, non-obvious connections between different threads of thought, much like a mind-map.
- **`multi_perspective.in`**: A powerful engine for facilitating dialogue between multiple, distinct expert personas. This module is the foundation for commands like `/confer` and is used to explore a topic from diverse, sometimes conflicting, viewpoints.
- **`web_of_understanding.in`**: The most intuitive and associative module. It focuses on the organic emergence of insights, weaving a "web" of understanding in a process akin to brainstorming or creative mind-mapping.

### Support & Validation Modules

- **`query_analysis.in`**: A specialized module for the crucial first step of any reasoning process: understanding the user's request. It provides a reusable actor (`@query_analyst`) that ensures clarity and confirmation before proceeding.
- **`citation.in`**: A complete, self-contained pipeline for grounding reasoning in external evidence. It handles searching for information, validating sources, and formatting citations, ensuring that claims can be backed by real-world data.
- **`epistemic.in`**: A module for meta-cognition. It provides components for analyzing the reasoning process itself, checking for logical fallacies, overconfidence, hidden assumptions, and conflicts between different lines of reasoning. It acts as the "immune system" for the thought process.

### Experimental Fragments

- **`fragments/`**: This directory is an incubator for new and experimental cognitive primitives. These fragments represent fundamental thinking operations that can be composed into more complex reasoning sequences.

  - **`critique.in`**: Rigorous critical thinking components including intellectual virtue personas (`@intellectual_humility`, `@intellectual_courage`) and operators for evidence assessment, assumption detection, fallacy checking, and alternative hypothesis generation. Embodies established critical thinking techniques as performative fragments.

  - **`expansion.in`**: Tools for breaking out of conventional thinking patterns, including SCAMPER method application and analogical reasoning operators. Features the `@lateral_thinker` persona for finding solutions in unexpected domains and deliberately broadening problem spaces beyond their initial framing.

  - **`reframing.in`**: Complete implementation of Edward de Bono's Six Thinking Hats method with dedicated personas for each hat (`@white_hat_thinker`, `@red_hat_thinker`, etc.). Also includes operators for examining problem boundaries, inverting problems to reveal solutions, and fundamentally shifting perspective on challenges.

  - **`compare.in`**: Foundational primitives for relational and evaluative thinking, including structured evaluation against criteria, finding shared ground between ideas, highlighting core distinctions, and consequential analysis (first-order vs. second-order effects, opportunity costs).

  - **`focus.in`**: Strategic prioritization and bottleneck analysis tools featuring the `@strategic_prioritizer` persona. Includes impact/effort matrix evaluation, process mapping, leverage point identification, and techniques for transforming vague questions into answerable ones.

  - **`divergence.in`**: Sophisticated epistemic awareness tools for detecting critical decision points in reasoning. The `@epistemic_guardian` persona identifies when reasoning reaches fundamental forks that require user guidance, preventing premature closure on complex questions.

  - **`convergence.in`**: Synthesis and unification primitives with the `@insight_distiller` persona for finding convergent themes across disparate ideas and distilling them into higher-level principles. The natural complement to divergence operations.

  - **`specificity.in`**: Anti-ambiguity tools for moving between abstraction levels, including abstraction ladder navigation, pre-mortem analysis, five whys root cause analysis, and concrete failure mode identification with corresponding mitigations.

  - **`sufficiency.in`**: Meta-cognitive assessment components featuring the `@intellectual_scout` persona for determining whether enough information exists to proceed responsibly. Includes knowledge gap identification and intellectual honesty safeguards against premature conclusions.

By combining primitives from these modules, developers can compose sophisticated and nuanced reasoning actors tailored to any domain.
