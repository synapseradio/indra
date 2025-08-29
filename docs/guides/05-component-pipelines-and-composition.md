# On Component Pipelines and Composition

Actors can delegate tasks to each other using the `await` and `return` pattern. This is well-suited for hierarchical conversations, where one Actor needs a complete report from another. Sometimes, however, the need is not for a conversation, but for a **workflow**.

This is the purpose of **Component Pipelines**. Using the same pipe operator (`|>`) that is used with Operators, Actors can be chained together to create a cognitive assembly line, where a piece of understanding is progressively transformed by a series of specialists.

---

### The Core Idea: A Cognitive Assembly Line

Imagine a factory assembly line. A raw material comes in one end, and each station performs one specific job—shaping, polishing, painting—before passing it to the next. The final product emerges at the end.

A component pipeline in INDRA works in the same way:

*   **The Input:** An initial piece of data (like the user's query).
*   **The Stations:** A series of Actors, each with a specialized `perform:` block.
*   **The Workflow:** The data flows from one Actor to the next, getting refined at each step.
*   **The Output:** The final, transformed data emerges at the end of the pipeline.

### The Syntax: `( @actor1 |> @actor2 |> @actor3 )`

To create a pipeline, a series of Actors, separated by the pipe operator, are enclosed in parentheses.

```indra
actor @orchestrator:
  perform:
    then:
      # Define the input to the pipeline
      set:
        &pipeline.io: &user.latest

      # Execute the pipeline
      set:
        &context.final_result: (@text_cleaner |> @sentiment_analyzer |> @report_writer)

      output: <<|
        Here is the final report:
        $(&context.final_result)
      |>>
      await: @user
```

In this example:

1.  The user's input is placed into a special, transient context variable: `&pipeline.io`.
2.  `@text_cleaner` activates, takes `&pipeline.io` as its input, cleans it, and its `output` becomes the new `&pipeline.io`.
3.  `@sentiment_analyzer` activates, takes the *cleaned text* as its input, analyzes it, and its `output` becomes the new `&pipeline.io`.
4.  `@report_writer` activates, takes the *sentiment analysis* as its input, formats it into a report, and its `output` becomes the final result of the entire pipeline.
5.  This final result is then stored in `&context.final_result`.

### How Pipelined Actors Work

Actors in a pipeline are special. They are stateless, single-purpose transformers.

*   **Input:** They implicitly receive their input from `&pipeline.io`.
*   **Output:** The value of their `output:` block becomes the *new* `&pipeline.io` for the next Actor in the chain.
*   **Constraint:** They **cannot** use `say:` or `return:`. Their only job is to transform the data and pass it on.

Here’s what `@sentiment_analyzer` might look like:

```indra
actor @sentiment_analyzer:
  identity: "a specialist in detecting sentiment"
  rules:
    - "return only 'positive', 'negative', or 'neutral'"
  perform:
    # It implicitly receives the cleaned text from &pipeline.io
    output: <analyze the sentiment of "$(&pipeline.io)">
    
    # NO `then:` block is needed, as it cannot say or return.
```

### When to Use a Pipeline vs. `await`

The choice of pattern depends on the kind of cognitive process being designed.

*   **Use `await`/`return` for Conversations:**
    *   When a complex, multi-step analysis is needed from another Actor.
    *   When the interaction is hierarchical (a manager delegating to a specialist).
    *   When the called Actor needs to maintain its own internal state or have a multi-turn thought process.

*   **Use a Pipeline (`|>`) for Workflows:**
    *   When there is a linear, sequential transformation of data.
    *   When each step is a single, stateless transformation.
    *   When modeling a process like an assembly line or a data processing pipeline.

Component pipelines are an elegant way to express complex, linear transformations. They allow the specialized abilities of multiple Actors to be composed into a single, powerful, and readable workflow.

---
**Next:** [Runtime Control with Star Commands](./06-runtime-control-with-star-commands.md)