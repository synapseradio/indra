# INDRA

INDRA is a set of tools for the creation, composition, sequencing and refinement of agentic expressions.

This project uses openspec.

## `legacy/`

The `legacy/` directory holds the prompt-era source — the PRISM library, the commands, the protocol, the agent definitions, and the original documentation. It captures the original spirit of the language and where it came from, and it is worth reading for that. Treat it as reference only, never as a source of truth.

The primary source of truth is the spec under `openspec/`: `openspec/specs/` is normative, and it governs. The deterministic runtime under `runtime/` is the live implementation — a source of truth for how the system actually behaves, but a subordinate one. When the runtime and the spec disagree, the spec wins and the runtime is the thing to fix.
