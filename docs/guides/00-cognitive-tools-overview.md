# Guides: An Overview of the Pre-built Tools

The INDRA repository includes several pre-built `.in` files in the `core/commands/` directory. These are complete, working examples that show how the simple building blocks of the protocol can be composed into sophisticated tools for thought.

Each one is a different choreography of the same fundamental cognitive primitives.

### `/think` - A Tool for Exploration

This command provides a friendly interface to a Tree of Thought process. It's designed for when you have a complex topic and want to explore multiple avenues, follow promising threads, and synthesize your findings in a natural, conversational way. It shows how a simple "facade" actor can manage a powerful, underlying reasoning module.

### `/reason` - A Tool for Ongoing Analysis

This command acts as a persistent reasoning partner. It works with you to understand a query, composes a dynamic, multi-step plan to analyze it, and then executes that plan transparently. It's a stateful, multi-turn process designed for a continuous analytical dialogue.

### `/ponder` - A Tool for Creative Ideation

This command is an adaptive creative tool. It's designed to sense the momentum of a conversation—whether an idea is just forming, gaining traction, or ready to be consolidated—and adjust its responses accordingly. It's a good example of a more fluid, less structured conversational agent for open-ended ideation.

### `/confer` - A Tool for Multi-Perspective Dialogue

This command simulates a panel of experts. It identifies the kinds of expertise needed for your query, convenes a panel of specialized personas, and then moderates a structured debate between them. The process is transparent, allowing you to see how different viewpoints interact to produce a more robust synthesis.

### `/consider` - A Tool for a Comprehensive Report

This command is a single-pass analytical engine. It takes a query, collaborates with you to define the scope of the analysis, and then runs the query through a fixed sequence of reasoning modules: Tree of Thought for decomposition, multi-perspective analysis for breadth, and Graph of Thought for discovering novel connections. It produces a single, comprehensive report at the end of its process.

## Same Primitives, Different Designs

All of these tools are built from the same small set of cognitive primitives found in `core/prism/`. The difference between them is in the design—the way they compose sequences, adopt personas, and manage the flow of the conversation.

They serve as both useful tools and practical examples for how to design your own structured thinking processes.

**Next: [Designing Cognitive Architectures](./01-designing-cognitive-architectures.md)**