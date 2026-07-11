# INDRA

INDRA is an agentic framework with a deterministic runtime. It composes ephemeral LLM actors into agent systems you can refactor behind stable interfaces, with the human a first-class actor those systems can await. You write the choreography in TypeScript, a model supplies typed judgment only at marked inference points, and the runtime carries it out the same way every time. The framework holds the invariants — isolation between actors, determinism, the typed inference boundary.

This project uses openspec.

## Vocabulary

The foundational terms INDRA uses are defined in [README.md](README.md#vocabulary), which is the canonical glossary. Many specs and docs still use the terms loosely or interchangeably; where they do, the README definitions govern and the looser usage is the thing to fix.

## Source of truth

The primary source of truth is the spec under `openspec/`: `openspec/specs/` is normative, and it governs. Start at `openspec/specs/README.md` for the map of the capability tree.

## Initiatives

`openspec/initiatives/` holds repo-native coordination documents: the durable rationale and direction that changes under `openspec/changes/` ladder up to. For intention and established future direction they govern, and there they carry more authority than the specs. The specs are normative for what a capability currently is. The initiatives are normative for why the work exists and where it is headed. When you need to infer intent or direction, read the initiatives first.
