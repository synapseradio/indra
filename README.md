# INDRA: A Behavioral Transformation Protocol

**Current Version: 3.0** | [Migration Guide](./docs/architecture/MIGRATION_GUIDE.md)

INDRA (Inferential Narrative-Driven Reasoning Actors) is a protocol for writing programs within a prompt.
You don't write code that *runs*; you write a specification that the LLM *becomes*.

This repository contains the core INDRA protocol specification, reference implementations of reasoning tools, and the official documentation.

---

## Start Learning INDRA

The best way to understand INDRA's unique philosophy and powerful capabilities is by following the docs.

**➡️ [Start the INDRA Documentation](./docs/index.md)**

The documentation will guide you through:

* **Getting Started:** Learn the core philosophy and build your first actor.
* **Protocol Reference:** A detailed breakdown of the INDRA grammar and execution model.
* **Practical Guides:** Learn how to build complex reasoning tools with INDRA.

---

## What's in this Repo

* `core/`: Contains the heart of the INDRA protocol.
  * `indra-protocol.yaml`: The complete technical specification for the INDRA protocol.
  * `prism/` & `commands/`: A collection of reference implementations and reasoning tools written in INDRA.
* `docs/`: The complete documentation, tutorials, and guides.
* `README.md`: This file.

## Example Commands

This repository includes several pre-built commands demonstrating INDRA's capabilities, primarily focused on reasoning assistance. These are excellent case studies for learning how to write advanced INDRA.

* **/reason** - Structured reasoning with transparent thought processes.
* **/think** - Natural exploration of ideas through Tree of Thought reasoning.
* **/ponder** - Deep reflection on conceptual questions.
* **/research** - Multi-expert investigation with diverse perspectives.

You can learn more about how these are built in the [Guides](./docs/guides/01-writing-reasoning-tools.md).
