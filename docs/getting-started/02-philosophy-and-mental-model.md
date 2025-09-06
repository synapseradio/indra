# The Philosophy & Mental Model

INDRA is based on a few simple ideas about how to structure a thinking process. Understanding them makes it easier to design with.

## The Choreography of Thought

A helpful way to think about INDRA is like choreography. A choreographer designs a sequence of movements, and a dancer performs them. The final dance comes from the combination of the design and the performance.

INDRA works in a similar way:

* The human is the **choreographer**, designing a sequence of thinking steps.
* The LLM is the **dancer**, executing those steps with its ability to rapidly generate text and ideas.
* The result is the **performance**—a structured exploration of an idea.

## Core Ideas

This approach is built on a few key principles.

### 1. A Specification to Embody

An INDRA file isn't a script that runs from top to bottom. It's a specification that the LLM *embodies*. As it processes the file, its behavior is shaped by the structures you've defined. It's less like running a program and more like giving a skilled actor a character to play.

### 2. Composable Thinking Moves

Complex thinking is often built from simple, repeatable steps. INDRA makes these steps explicit and allows you to combine them.

```indra
# Simple, single-step "operators"
wonder_about(topic)
check_assumptions(understanding)

# Composed into a multi-step "sequence"
sequence explore_idea(idea) ::=
  step:
    # The first step is to wonder
    output: ~(wonder_about(topic: idea))~
    set: &context.initial_thought: result
  step:
    # The second step is to check the assumptions in that wondering
    output: ~(check_assumptions(understanding: &context.initial_thought))~
```

### 3. Context as a Shared Workspace

INDRA uses a shared state called the `&context`. This is the workspace for the thought process. It doesn't just hold information; it creates an environment that shapes how the next steps unfold.

### 4. Actors as Defined Roles

An Actor is more than just a set of instructions. It's a coherent role in the process, defined by its `identity:`, `rules:`, and `understands:`. When you create an Actor like `@skeptic` or `@creative_explorer`, you are creating a consistent point of view for the LLM to adopt.

## The Shift in Approach

Working with INDRA involves a slight shift in perspective.

* **From Programming to Designing:** The focus moves from telling a computer exactly what to do, to designing a *process* for thinking.
* **From a Fixed Output to a Guided Exploration:** The goal is often to design a process that explores possibilities, rather than producing a single, predetermined answer.
* **From Answers to Explorations:** The value is often found in the structured process of exploration itself.

This allows you to make the thinking process that happens in your head more tangible, and to use the power of an LLM to explore it in a structured way.

**Next: [Your First INDRA Actor](./03-your-first-indra-actor.md)**
