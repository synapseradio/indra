# Guide: Orchestrating Cognitive Agents - A Practical Guide

This guide provides a practical, hands-on introduction to the **Agent Council** and the **`@thinkies` orchestrator**. This system is designed for users who want to leverage the cognitive power of the INDRA ecosystem using natural language, without needing to write or understand the INDRA protocol itself.

## The Two Layers of the INDRA Ecosystem

It's helpful to think of this project as having two distinct layers:

1.  **The INDRA Protocol & PRISM Library (`.in` files):** This is the powerful, low-level "engine" for performative cognition. It's a formal protocol for defining actors, personas, and sequences of thought.
2.  **The Agent Council (`.md` files):** This is the high-level, human-friendly "user interface." Each agent is a markdown file that defines a specific cognitive "mindset" or "verb" (e.g., `@challenger`, `@strategist`).

The `@thinkies` command is the bridge between these two layers, allowing you to access the power of the PRISM engine through a simple, conversational interface.

## Installation

To use the Agent Council, you first need to make the agent definitions available to your Claude Code environment. The following shell script will copy the necessary files into your `$HOME/.claude` directory.

**Installation Script:**

```bash
#!/bin/bash

# This script installs the INDRA cognitive agents and the 'thinkies' command
# into your local Claude Code configuration directory.

# Define the source and destination directories
SOURCE_AGENTS_DIR="./agents/cognitive"
SOURCE_COMMANDS_DIR="./agents/commands"
DEST_AGENTS_DIR="$HOME/.claude/agents"
DEST_COMMANDS_DIR="$HOME/.claude/commands"

# Create the destination directories if they don't exist
echo "Creating destination directories..."
mkdir -p "$DEST_AGENTS_DIR"
mkdir -p "$DEST_COMMANDS_DIR"

# Copy the cognitive agent definitions
echo "Installing cognitive agents..."
cp -R "$SOURCE_AGENTS_DIR"/* "$DEST_AGENTS_DIR"/

# Copy the 'thinkies' command
echo "Installing the 'thinkies' command..."
cp "$SOURCE_COMMANDS_DIR"/thinkies.md "$DEST_COMMANDS_DIR"/

echo "Installation complete."
echo "You can now use the 'thinkies' command in your Claude Code sessions."
```

**To install:**

1.  Save the script above as `install_agents.sh` in the root of the `indra` project directory.
2.  Make the script executable: `chmod +x install_agents.sh`
3.  Run the script: `./install_agents.sh`

## Your First Cognitive Pipeline

Once the agents are installed, you can start using the `@thinkies` orchestrator. It's as simple as calling it with a natural language request.

Let's try a common use case: **getting a balanced analysis of a complex decision.**

**In your Claude Code session, type:**

> thinkies "I need to decide whether we should invest in developing a new feature, 'Project Starlight'. I need a thorough analysis of the opportunity and the risks."

**What happens next?**

The `@thinkies` orchestrator will analyze your request and design a multi-agent pipeline to address it. Internally, it might generate a plan like this:

`@agent-understand -> (@agent-ground -> @agent-challenge) -> @agent-plan -> @agent-evaluate`

It will then execute this plan step-by-step:

1.  **`@agent-understand`** will first map the territory, identifying what is known and unknown about "Project Starlight."
2.  Then, **`@agent-ground`** and **`@agent-challenge`** will work in parallel. The ground agent will find real-world data to ground the discussion, while the challenge agent stress-tests the initial assumptions.
3.  **`@agent-plan`** will take the findings from the previous step and develop a concrete, actionable plan.
4.  Finally, **`@agent-evaluate`** will provide a balanced, objective evaluation of the entire analysis, giving you a clear recommendation.

The final output will be a single, synthesized report that is far more robust and well-reasoned than what any single prompt or agent could have produced alone.

## Meet Your Council: A "Who to Call For What" Guide

Here are some of the core agents you can orchestrate via `@thinkies`. A great first step for any complex query is to start with `@agent-engage` to ensure your request is fully understood.

*   **When you're starting something new:** Call the **`@agent-understand`** to map the territory.
*   **When you need to ground a discussion in facts:** Call the **`@agent-ground`**.
*   **When you need to stress-test an idea:** Call the **`@agent-challenge`**.
*   **When you're stuck and need a creative breakthrough:** Call the **`@agent-innovate`**.
*   **When you have a map and need a plan:** Call the **`@agent-plan`**.
*   **When you need a final, objective evaluation:** Call the **`@agent-evaluate`**.
*   **When you have a lot of information and need to find the hidden patterns:** Call the **`@agent-connect`**.

By learning to combine these mindsets, you can design sophisticated and powerful reasoning processes using natural language.

---
**Next:** [On Long-Form Inquiry](./07-on-long-form-inquiry.md)
