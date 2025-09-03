# Guides: An Overview of the Pre-built Tools

The INDRA repository includes several pre-built `.in` files in the `commands/` directory. These are complete, working examples that show how the simple building blocks of the protocol can be composed into sophisticated, performative tools for thought.

Each one is a different choreography of the same fundamental cognitive primitives, designed to feel like a true collaborative partner.

### `/explore` - A Tool for Exploration

This command provides a clean, simple interface to the powerful Tree of Thought reasoning module. It acts as a focused **orchestrator**, inviting you to explore a topic and then delegating the complex work of branching possibilities and deepening threads to the specialized `@tree_thinker` actor. It's a perfect example of how to create a user-friendly command that leverages a complex, reusable reasoning engine.

### `/reason` - A Tool for Adaptive Inquiry

This command is a persistent, multi-turn reasoning partner. It begins by collaborating with you to understand your query and agree on the scope of the investigation. It then dynamically composes a multi-step reasoning plan and executes it one step at a time, loading its cognitive capabilities on-demand. After each step, it reflects on what it has learned and can adapt its plan, making it a truly intelligent and flexible partner for long-form inquiry.

### `/ponder` - A Tool for Creative Ideation

This command is a performative creative partner. It moves away from rigid state management and instead engages in a fluid, natural conversation. It listens to your ideas and responds by performatively thinking out loud—sometimes noticing patterns, sometimes offering a new perspective, and sometimes asking a question to deepen the thread. It's designed to feel like a real brainstorming partner.

### `/confer` - A Tool for Multi-Perspective Dialogue

This command facilitates a transparent, performative dialogue between a panel of experts. It convenes a council of specialists tailored to your query and then orchestrates their conversation in the open, allowing you to see how different viewpoints interact, challenge each other, and build toward a more robust, synthesized understanding.

### `/consider` - A Tool for a Comprehensive Report

This command is a single-pass analytical engine that acts as a "symphony conductor." It collaborates with you to define the scope of the analysis and then orchestrates a series of analytical "movements"—from decomposition to multi-perspective analysis to the weaving of emergent connections. It produces a single, comprehensive, and narrative report at the end of its process, representing a complete intellectual artifact.

## Composable by Design

All of these tools are built from the same small set of cognitive primitives found in `lib/prism/`. The difference between them is in the design—the way they compose sequences, adopt personas, and manage the flow of the conversation. With the introduction of the `strategies/` directory, complex reasoning patterns are now encapsulated in their own files, allowing commands like `/reason` to dynamically load them as needed.

They serve as both useful tools and practical examples for how to design your own structured thinking processes.

**Next: [Composing Performative Actors](./01-composing-performative-actors.md)**