# INDRA

INDRA is an agentic framework with a deterministic runtime. It composes ephemeral LLM actors into agent systems you can refactor behind stable interfaces, with the human a first-class actor those systems can await. You write the choreography in TypeScript, a model supplies typed judgment only at marked inference points, and the runtime carries it out the same way every time. The framework holds the invariants — isolation between actors, determinism, the typed inference boundary.

This project uses openspec.

## `legacy/`

The `legacy/` directory holds the prompt-era source — the PRISM library, the commands, the protocol, the agent definitions, and the original documentation. It captures the original spirit of the language and where it came from, and it is worth reading for that. Treat it as reference only, never as a source of truth.

The primary source of truth is the spec under `openspec/`: `openspec/specs/` is normative, and it governs. Start at `openspec/specs/README.md` for the map of the capability tree. The deterministic runtime under `runtime/` is the live implementation — a source of truth for how the system actually behaves, but a subordinate one. When the runtime and the spec disagree, the spec wins and the runtime is the thing to fix.
