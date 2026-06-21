# INDRA

INDRA is an agentic framework with a deterministic runtime. It composes ephemeral LLM actors into agent systems you can refactor behind stable interfaces, with the human a first-class actor those systems can await. You write the choreography in TypeScript, a model supplies typed judgment only at marked inference points, and the runtime carries it out the same way every time. The framework holds the invariants — isolation between actors, determinism, the typed inference boundary.

This project uses openspec.

## Vocabulary

These are the foundational terms INDRA uses, defined precisely. Many specs and docs still use them loosely or interchangeably; where they do, these definitions govern and the looser usage is the thing to fix. This glossary is canonical and mirrors the one in `README.md`; keep the two in sync.

**inference** — the substrate of AI operations: stochastic calculation internal to a model. Inference is opaque and non-deterministic.

**inference call** — an API call that routes a query, usually a natural-language prompt, to a model, often through an inference provider. One inference call is one consultation of the model.

**agent** — an inference call placed inside a loop, where each iteration is conditioned on context accumulated over prior iterations and on the results of actions the loop lets the model take. An agent acts on its environment through tools, which the framework's end user supplies in whatever form the task needs; the loop, not the single call, is what makes it an agent. In mainstream usage the model drives the loop and decides when to stop.

**actor** — INDRA's runtime unit: a sealed participant that takes turns under the conductor, with typed input, a typed return, and private working context unreadable from outside. An actor that consults the model realizes an agent: the conductor's turn cycle is the loop, and an inference leaf is where the model is consulted. An agent system is a composition of actors, and one actor can be replaced by a whole subtree of actors behind the same typed interface without any caller noticing.

**persona** — two senses. As a technique, a query method that constrains a model in natural language through an often anthropomorphized character or role description, `you are a ___, your role is ___`. As a result, the emergent and often anthropomorphic character that technique produces in inference output, compounding and growing more noticeable as a session progresses, as persona prompts are composed, made more explicit, or placed earlier in the context the call receives.

**voice** — the generally unstructured aspects of model output that are characteristic of a persona, of the model itself, or of other sources that shape an inference result. Where a persona in its second sense is the emergent character, voice is the characteristic texture that character speaks in.

The terms "persona" and "voice" are useful for describing mental model. These terms do not belong in specifications.

## Source of truth

The primary source of truth is the spec under `openspec/`: `openspec/specs/` is normative, and it governs. Start at `openspec/specs/README.md` for the map of the capability tree.

## Initiatives

`openspec/initiatives/` holds repo-native coordination documents: the durable rationale and direction that changes under `openspec/changes/` ladder up to. For intention and established future direction they govern, and there they carry more authority than the specs. The specs are normative for what a capability currently is. The initiatives are normative for why the work exists and where it is headed. When you need to infer intent or direction, read the initiatives first.
